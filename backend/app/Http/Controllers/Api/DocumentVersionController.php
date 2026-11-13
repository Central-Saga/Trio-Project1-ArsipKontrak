<?php

namespace App\Http\Controllers\Api;

use App\DTO\CreateDocumentVersionData;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentVersionRequest;
use App\Http\Resources\DocumentVersionResource;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\DocumentVersionRepositoryInterface;
use App\Services\DocumentService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class DocumentVersionController extends Controller
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private DocumentVersionRepositoryInterface $versions,
        private DocumentService $documentService
    ) {}

    /**
     * Tampilkan daftar versi untuk suatu dokumen.
     */
    public function index(string $documentId)
    {
        $document = $this->documents->findOrFail($documentId);
        Gate::authorize('view', $document);

        $versions = $this->versions->forDocument($document, 100);

        return DocumentVersionResource::collection($versions)->additional([
            'success' => true,
            'message' => 'Riwayat versi dokumen berhasil diambil.',
        ]);
    }

    /**
     * Unggah versi baru / adendum untuk dokumen yang sudah ada.
     */
    public function store(StoreDocumentVersionRequest $request, string $documentId)
    {
        $document = $this->documents->findOrFail($documentId);
        $validated = $request->validated();

        Gate::authorize('update', $document);

        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            return response()->json([
                'message' => 'File revisi kontrak wajib diunggah.',
            ], 422);
        }

        try {
            $version = $this->documentService->addVersion(
                $document,
                CreateDocumentVersionData::fromValidated($validated),
                $file,
                (int) $request->user()->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Versi baru berhasil diunggah dengan enkripsi penuh.',
                'data' => new DocumentVersionResource($version->load('uploader')),
            ], 201);
        } catch (\Throwable $e) {
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
        $document = $this->documents->findOrFail($documentId);
        Gate::authorize('view', $document);

        $version = $this->versions->findForDocumentOrFail($documentId, $versionId);

        if (! Storage::disk('private_encrypted')->exists($version->file_path)) {
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
        $document = $this->documents->findOrFail($documentId);
        Gate::authorize('view', $document);

        $version = $this->versions->findForDocumentOrFail($documentId, $versionId);

        if (! Storage::disk('private_encrypted')->exists($version->file_path)) {
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
            'Content-Disposition' => 'inline; filename="'.$version->file_name.'"',
        ]);
    }
}
