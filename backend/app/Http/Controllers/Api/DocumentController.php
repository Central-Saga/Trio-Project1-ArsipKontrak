<?php

namespace App\Http\Controllers\Api;

use App\DTO\CreateDocumentData;
use App\DTO\DocumentListQueryData;
use App\DTO\UpdateDocumentData;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexDocumentRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Http\Requests\UpdateDocumentRequest;
use App\Http\Resources\DocumentMetadataResource;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Services\DocumentService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;

class DocumentController extends Controller
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private DocumentService $documentService,
    ) {}

    public function index(IndexDocumentRequest $request)
    {
        Gate::authorize('viewAny', Document::class);

        $query = DocumentListQueryData::fromValidated($request->validated());
        $documents = $this->documentService->listDocuments($request->user(), $query);

        return DocumentResource::collection($documents)->additional([
            'success' => true,
            'message' => 'Daftar dokumen berhasil diambil.',
        ]);
    }

    public function store(StoreDocumentRequest $request)
    {
        Gate::authorize('create', Document::class);
        $file = $request->file('file');
        if (! $file instanceof UploadedFile) {
            return response()->json([
                'message' => 'Berkas PDF dokumen wajib diunggah.',
            ], 422);
        }

        try {
            $document = $this->documentService->createDocument(
                CreateDocumentData::fromValidated($request->validated()),
                $file,
                (int) $request->user()->id
            );

            return response()->json([
                'success' => true,
                'message' => 'Dokumen berhasil diunggah dan dienkripsi.',
                'data' => new DocumentResource(
                    $document->load(['project', 'creator', 'versions.uploader'])
                ),
            ], 201);
        } catch (\Throwable $e) {
            report($e);

            if (app()->environment('testing')) {
                throw $e;
            }

            return response()->json([
                'message' => 'Gagal menyimpan dokumen.',
            ], 500);
        }
    }

    public function show(string $id)
    {
        $document = $this->documents->findWithRelations(
            $id,
            ['project', 'creator', 'versions.uploader']
        );

        Gate::authorize('view', $document);

        return new DocumentResource(
            $this->documentService->viewDetail($document, request()->user())
        );
    }

    /**
     * Metadata minimum untuk judul halaman frontend.
     * Tetap menggunakan policy dan tidak mencatat VIEW_DOCUMENT.
     */
    public function metadata(string $id)
    {
        $document = $this->documentService->metadata($id);

        Gate::authorize('view', $document);

        return (new DocumentMetadataResource($document))
            ->additional(['success' => true])
            ->response()
            ->header('Cache-Control', 'no-store, private');
    }

    public function update(UpdateDocumentRequest $request, string $id)
    {
        $document = $this->documents->findOrFail($id);

        Gate::authorize('update', $document);

        $document = $this->documentService->updateDocument(
            $document,
            UpdateDocumentData::fromValidated($request->validated())
        );

        return response()->json([
            'success' => true,
            'message' => 'Metadata dokumen berhasil diperbarui.',
            'data' => new DocumentResource($document),
        ]);
    }

    public function destroy(string $id)
    {
        $document = $this->documents->findWithRelations($id, ['versions']);

        Gate::authorize('delete', $document);
        try {
            $this->documentService->deleteDocument($document);

            return response()->json([
                'success' => true,
                'message' => 'Dokumen dipindahkan ke tempat sampah; file fisik dan riwayat versinya dipertahankan.',
                'data' => null,
            ]);
        } catch (\Throwable $e) {
            report($e);

            if (app()->environment('testing')) {
                throw $e;
            }

            return response()->json([
                'message' => 'Gagal menghapus dokumen.',
            ], 500);
        }
    }
}
