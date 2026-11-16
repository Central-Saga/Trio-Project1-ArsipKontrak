<?php

namespace App\Http\Controllers\Api;

use App\DTO\CreateDocumentVersionData;
use App\DTO\DocumentVersionListQueryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexDocumentVersionRequest;
use App\Http\Requests\StoreDocumentVersionRequest;
use App\Http\Resources\DocumentVersionResource;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Services\DocumentService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;

class DocumentVersionController extends Controller
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private DocumentService $documentService,
    ) {}

    /**
     * Tampilkan daftar versi untuk suatu dokumen.
     */
    public function index(IndexDocumentVersionRequest $request, string $documentId)
    {
        $document = $this->documents->findOrFail($documentId);

        Gate::authorize('view', $document);

        $versions = $this->documentService->versionsFor(
            $document,
            DocumentVersionListQueryData::fromValidated($request->validated())
        );

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
                CreateDocumentVersionData::fromValidated($request->validated()),
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
}
