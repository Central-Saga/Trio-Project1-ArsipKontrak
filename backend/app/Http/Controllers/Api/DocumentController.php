<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\DocumentVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $documents = Document::with(['latestVersion.uploader', 'creator', 'project'])
            ->latest()
            ->paginate(10);

        return DocumentResource::collection($documents);
    }

    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $userId = $request->user()?->id ?? 1; // Fallback ke user ID 1 jika belum menyalakan middleware auth

        $document = DB::transaction(function () use ($validated, $request, $userId) {
            // 1. Simpan metadata dokumen kontrak
            $document = Document::create([
                'project_id'      => $validated['project_id'] ?? null,
                'document_number' => $validated['document_number'],
                'document_name'   => $validated['document_name'],
                'document_type'   => $validated['document_type'],
                'partner'         => $validated['partner'],
                'document_date'   => $validated['document_date'],
                'effective_date'  => $validated['effective_date'] ?? null,
                'expiry_date'     => $validated['expiry_date'] ?? null,
                'status'          => $validated['status'] ?? 'DRAFT',
                'description'     => $validated['description'] ?? null,
                'created_by'      => $userId,
            ]);

            // 2. Upload file & kalkulasi SHA-256 Checksum Hash (Param 16, 26, 31)
            $file = $request->file('file');
            $fileHash = hash_file('sha256', $file->getRealPath());
            $fileName = $file->getClientOriginalName();
            
            // Simpan ke disk lokal private (app/documents/contracts)
            $filePath = $file->store('documents/contracts', 'local');

            // 3. Simpan entri versi awal (v1.0)
            DocumentVersion::create([
                'document_id'    => $document->id,
                'version_number' => 'v1.0',
                'file_name'      => $fileName,
                'file_path'      => $filePath,
                'file_hash'      => $fileHash,
                'file_size'      => $file->getSize(),
                'mime_type'      => $file->getMimeType(),
                'is_current'     => true,
                'encrypted_at'   => now(),
                'uploaded_by'    => $userId,
                'notes'          => $validated['notes'] ?? 'Initial upload',
            ]);

            return $document->load(['latestVersion.uploader', 'creator', 'project']);
        });

        return (new DocumentResource($document))
            ->response()
            ->setStatusCode(201);
    }

    public function show(string $id): DocumentResource
    {
        $document = Document::with(['versions.uploader', 'creator', 'project'])->findOrFail($id);

        return new DocumentResource($document);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $document = Document::findOrFail($id);

        $validated = $request->validate([
            'document_name'  => ['sometimes', 'required', 'string', 'max:255'],
            'document_type'  => ['sometimes', 'required', 'string', 'in:MOU,SPK,KONTRAK,NDA,LAINNYA'],
            'partner'        => ['sometimes', 'required', 'string', 'max:255'],
            'document_date'  => ['sometimes', 'required', 'date'],
            'effective_date' => ['nullable', 'date'],
            'expiry_date'    => ['nullable', 'date', 'after_or_equal:effective_date'],
            'status'         => ['sometimes', 'required', 'string', 'in:DRAFT,REVIEW,ACTIVE,EXPIRED,TERMINATED'],
            'description'    => ['nullable', 'string'],
        ]);

        $document->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Metadata dokumen berhasil diperbarui.',
            'data'    => new DocumentResource($document->load(['latestVersion', 'creator', 'project'])),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $document = Document::findOrFail($id);
        $document->delete(); // Soft delete terpicu

        return response()->json([
            'status'  => 'success',
            'message' => 'Dokumen berhasil dihapus (soft delete).',
        ]);
    }
}