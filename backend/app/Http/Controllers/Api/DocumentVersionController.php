<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Http\Resources\DocumentVersionResource;
use App\Http\Requests\StoreDocumentVersionRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class DocumentVersionController extends Controller
{
    /**
     * Tampilkan daftar versi untuk suatu dokumen.
     */
    public function index(string $documentId)
    {
        $document = Document::findOrFail($documentId);
        $versions = $document->versions()->with('uploader')->latest()->get();

        return DocumentVersionResource::collection($versions);
    }

    /**
     * Unggah versi baru / adendum untuk dokumen yang sudah ada.
     */

    public function store(StoreDocumentVersionRequest $request, string $documentId)
    {
        $document = Document::findOrFail($documentId);
        $validated = $request->validated();

        Gate::authorize('update', $document);

        $file = $request->file('file');
        $path = null;

        try {
            $version = DB::transaction(function () use (
                $document, $validated, $file, $request, &$path
            ) {
                $content = file_get_contents($file->getRealPath());
                if ($content === false) {
                    throw new \RuntimeException('File tidak dapat dibaca.');
                }

                $key = config('app.key');
                if (str_starts_with($key, 'base64:')) {
                    $key = base64_decode(substr($key, 7), true);
                }

                if ($key === false || $key === '') {
                    throw new \RuntimeException('Kunci enkripsi aplikasi tidak valid.');
                }

                $iv = random_bytes(openssl_cipher_iv_length('aes-256-cbc'));
                $encrypted = openssl_encrypt(
                    $content,
                    'aes-256-cbc',
                    $key,
                    0,
                    $iv
                );

                if ($encrypted === false) {
                    throw new \RuntimeException('Enkripsi file gagal.');
                }

                $path = 'documents/contracts/' . bin2hex(random_bytes(16)) . '.enc';
                $payload = base64_encode($iv . $encrypted);

                if (! Storage::disk('private_encrypted')->put($path, $payload)) {
                    throw new \RuntimeException('File terenkripsi gagal disimpan.');
                }

                $document->versions()->update(['is_current' => false]);

                $hash = hash_file('sha256', $file->getRealPath());
                if ($hash === false) {
                    throw new \RuntimeException('Hash SHA-256 gagal dihitung.');
                }

                return DocumentVersion::create([
                    'document_id' => $document->id,
                    'version_number' => $validated['version_number']
                        ?? 'v' . ($document->versions()->count() + 1) . '.0',
                    'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(),
                    'file_size' => $file->getSize(),
                    'file_hash' => $hash,
                    'mime_type' => $file->getMimeType(),
                    'encrypted_at' => now(),
                    'is_current' => true,
                    'notes' => $validated['notes'] ?? null,
                    'uploaded_by' => $request->user()->id,
                ]);
            });

            return response()->json([
                'message' => 'Versi baru berhasil diunggah dengan enkripsi penuh.',
                'data' => new DocumentVersionResource($version->load('uploader')),
            ], 201);
        } catch (\Throwable $e) {
            if ($path && Storage::disk('private_encrypted')->exists($path)) {
                Storage::disk('private_encrypted')->delete($path);
            }

            report($e);

            if (app()->environment('testing')) {
                throw $e;
            }

            return response()->json([
                'message' => 'Gagal mengunggah versi baru.',
            ], 500);
        }
    }

    /**
     * Unduh file dokumen (dekripsi transparan).
     */
    public function download(string $documentId, string $versionId)
    {
        $version = DocumentVersion::where('document_id', $documentId)->findOrFail($versionId);

        if (!Storage::disk('private_encrypted')->exists($version->file_path)) {
            return response()->json(['message' => 'File fisik tidak ditemukan di server.'], 404);
        }

        $encryptedPayload = base64_decode(Storage::disk('private_encrypted')->get($version->file_path));
        
        $ivLength = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($encryptedPayload, 0, $ivLength);
        $encryptedContent = substr($encryptedPayload, $ivLength);

        $encryptionKey = config('app.key');
        if (str_starts_with($encryptionKey, 'base64:')) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7));
        }

        $decryptedContent = openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv);

        return response()->streamDownload(function () use ($decryptedContent) {
            echo $decryptedContent;
        }, $version->file_name);
    }
    public function preview(string $documentId, string $versionId)
    {
        $version = DocumentVersion::where('document_id', $documentId)->findOrFail($versionId);

        if (!Storage::disk('private_encrypted')->exists($version->file_path)) {
            return response()->json(['message' => 'File fisik tidak ditemukan di server.'], 404);
        }

        $encryptedPayload = base64_decode(Storage::disk('private_encrypted')->get($version->file_path));
        
        $ivLength = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($encryptedPayload, 0, $ivLength);
        $encryptedContent = substr($encryptedPayload, $ivLength);

        $encryptionKey = config('app.key');
        if (str_starts_with($encryptionKey, 'base64:')) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7));
        }

        $decryptedContent = openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv);

        return response()->make($decryptedContent, 200, [
            'Content-Type' => $version->mime_type,
            'Content-Disposition' => 'inline; filename="' . $version->file_name . '"'
        ]);
    }
}