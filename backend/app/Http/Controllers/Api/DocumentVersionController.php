<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentVersionRequest;
use App\Http\Resources\DocumentVersionResource;
use App\Models\Document;
use App\Models\DocumentVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentVersionController extends Controller
{
    public function index(string $documentId): AnonymousResourceCollection
    {
        $document = Document::findOrFail($documentId);
        $versions = $document->versions()->with('uploader')->latest()->get();

        return DocumentVersionResource::collection($versions);
    }

    public function store(StoreDocumentVersionRequest $request, string $documentId): JsonResponse
    {
        abort_unless($request->user()?->role === 'admin', 403, 'Akses hanya tersedia untuk administrator.');

        $document = Document::findOrFail($documentId);
        $validated = $request->validated();
        $userId = $request->user()?->id ?? 1;

        $version = DB::transaction(function () use ($request, $document, $validated, $userId) {
            // Nonaktifkan status is_current pada seluruh versi sebelumnya
            $document->versions()->where('is_current', true)->update(['is_current' => false]);

            // Hitung nomor versi baru jika tidak diisi manual (misal: v1.1, v1.2)
            $lastVersionCount = $document->versions()->count();
            $versionNumber = $validated['version_number'] ?? ('v1.' . $lastVersionCount);

            // Simpan file fisik sesuai mode keamanan & kalkulasi checksum SHA-256
            $file = $request->file('file');
            $fileHash = hash_file('sha256', $file->getRealPath());
            $fileName = $file->getClientOriginalName();
            $isSecureMode = $request->boolean('secure_mode', true);
            $encryptedAt = null;

            if ($isSecureMode) {
                $fileContent = file_get_contents($file->getRealPath());
                $encryptionKey = config('app.key');
                if (str_starts_with($encryptionKey, 'base64:')) {
                    $encryptionKey = base64_decode(substr($encryptionKey, 7));
                }

                $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length('aes-256-cbc'));
                $encryptedContent = openssl_encrypt($fileContent, 'aes-256-cbc', $encryptionKey, 0, $iv);
                $payload = base64_encode($iv . $encryptedContent);
                $filePath = 'documents/contracts/' . uniqid() . '.enc';
                Storage::disk('private_encrypted')->put($filePath, $payload);
                $encryptedAt = now();
            } else {
                $filePath = $file->store('documents/contracts', 'private_encrypted');
            }

            return DocumentVersion::create([
                'document_id'    => $document->id,
                'version_number' => $versionNumber,
                'file_name'      => $fileName,
                'file_path'      => $filePath,
                'file_hash'      => $fileHash,
                'file_size'      => $file->getSize(),
                'mime_type'      => $file->getMimeType(),
                'is_current'     => true,
                'encrypted_at'   => $encryptedAt,
                'uploaded_by'    => $userId,
                'notes'          => $validated['notes'] ?? 'Revisi versi baru',
            ]);
        });

        return (new DocumentVersionResource($version->load('uploader')))
            ->response()
            ->setStatusCode(201);
    }

    public function download(string $documentId, string $versionId)
    {
        $version = DocumentVersion::where('document_id', $documentId)->findOrFail($versionId);

        if (!Storage::disk('private_encrypted')->exists($version->file_path)) {
            abort(404, 'Berkas fisik tidak ditemukan di server.');
        }

        if (!$version->encrypted_at) {
            return response()->download(
                Storage::disk('private_encrypted')->path($version->file_path),
                $version->file_name,
                ['Content-Type' => $version->mime_type]
            );
        }

        $decryptedContent = $this->decryptPayload(Storage::disk('private_encrypted')->get($version->file_path));

        return response()->streamDownload(function () use ($decryptedContent) {
            echo $decryptedContent;
        }, $version->file_name, ['Content-Type' => $version->mime_type]);
    }

    public function preview(string $documentId, string $versionId)
    {
        $version = DocumentVersion::where('document_id', $documentId)->findOrFail($versionId);

        if (!Storage::disk('private_encrypted')->exists($version->file_path)) {
            abort(404, 'Berkas fisik tidak ditemukan di server.');
        }

        if (!$version->encrypted_at) {
            return response()->file(Storage::disk('private_encrypted')->path($version->file_path), [
                'Content-Type' => $version->mime_type,
            ]);
        }

        $decryptedContent = $this->decryptPayload(Storage::disk('private_encrypted')->get($version->file_path));

        return response($decryptedContent)->header('Content-Type', $version->mime_type);
    }

    private function decryptPayload(string $payload): string
    {
        $encryptedPayload = base64_decode($payload);
        $ivLength = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($encryptedPayload, 0, $ivLength);
        $encryptedContent = substr($encryptedPayload, $ivLength);
        $encryptionKey = config('app.key');

        if (str_starts_with($encryptionKey, 'base64:')) {
            $encryptionKey = base64_decode(substr($encryptionKey, 7));
        }

        return openssl_decrypt($encryptedContent, 'aes-256-cbc', $encryptionKey, 0, $iv) ?: '';
    }
}