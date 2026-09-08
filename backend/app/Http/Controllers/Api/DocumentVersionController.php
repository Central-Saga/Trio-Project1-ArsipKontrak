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
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
        $document = Document::findOrFail($documentId);
        $validated = $request->validated();
        $userId = $request->user()?->id ?? 1;

        $version = DB::transaction(function () use ($request, $document, $validated, $userId) {
            // Nonaktifkan status is_current pada seluruh versi sebelumnya
            $document->versions()->where('is_current', true)->update(['is_current' => false]);

            // Hitung nomor versi baru jika tidak diisi manual (misal: v1.1, v1.2)
            $lastVersionCount = $document->versions()->count();
            $versionNumber = $validated['version_number'] ?? ('v1.' . $lastVersionCount);

            // Simpan file fisik & kalkulasi checksum SHA-256
            $file = $request->file('file');
            $fileHash = hash_file('sha256', $file->getRealPath());
            $fileName = $file->getClientOriginalName();
            $filePath = $file->store('documents/contracts', 'local');

            return DocumentVersion::create([
                'document_id'    => $document->id,
                'version_number' => $versionNumber,
                'file_name'      => $fileName,
                'file_path'      => $filePath,
                'file_hash'      => $fileHash,
                'file_size'      => $file->getSize(),
                'mime_type'      => $file->getMimeType(),
                'is_current'     => true,
                'encrypted_at'   => now(),
                'uploaded_by'    => $userId,
                'notes'          => $validated['notes'] ?? 'Revisi versi baru',
            ]);
        });

        return (new DocumentVersionResource($version->load('uploader')))
            ->response()
            ->setStatusCode(201);
    }

    public function download(string $documentId, string $versionId): BinaryFileResponse
    {
        $version = DocumentVersion::where('document_id', $documentId)->findOrFail($versionId);

        if (!Storage::disk('local')->exists($version->file_path)) {
            abort(404, 'Berkas fisik tidak ditemukan di server.');
        }

        $fullPath = Storage::disk('local')->path($version->file_path);

        return response()->download($fullPath, $version->file_name, [
            'Content-Type' => $version->mime_type,
        ]);
    }

    public function preview(string $documentId, string $versionId): BinaryFileResponse
    {
        $version = DocumentVersion::where('document_id', $documentId)->findOrFail($versionId);

        if (!Storage::disk('local')->exists($version->file_path)) {
            abort(404, 'Berkas fisik tidak ditemukan di server.');
        }

        $fullPath = Storage::disk('local')->path($version->file_path);

        return response()->file($fullPath, [
            'Content-Type' => $version->mime_type,
        ]);
    }
}