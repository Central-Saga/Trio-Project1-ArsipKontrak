<?php

namespace App\Http\Controllers\Api;

use App\DTO\DocumentListQueryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Services\DocumentService;
use Illuminate\Support\Facades\Gate;

class DocumentTrashController extends Controller
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private DocumentService $documentService,
    ) {}

    public function index(IndexDocumentRequest $request)
    {
        Gate::authorize('viewTrash', Document::class);

        return DocumentResource::collection(
            $this->documentService->trashed(
                DocumentListQueryData::fromValidated($request->validated())
            )
        );
    }

    public function restore(string $id)
    {
        $document = $this->documents->findOnlyTrashed($id);

        Gate::authorize('restore', $document);

        return response()->json([
            'success' => true,
            'message' => 'Dokumen berhasil dikembalikan.',
            'data' => new DocumentResource(
                $this->documentService->restoreDocument($document)
            ),
        ]);
    }
}
