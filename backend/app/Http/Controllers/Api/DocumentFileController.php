<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DocumentFileRequest;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Services\DocumentService;
use Illuminate\Support\Facades\Gate;

class DocumentFileController extends Controller
{
    public function __construct(
        private DocumentRepositoryInterface $documents,
        private DocumentService $documentService,
    ) {}

    public function preview(DocumentFileRequest $request, string $id)
    {
        $document = $this->documents->findWithRelations($id, ['versions']);

        Gate::authorize('view', $document);

        try {
            $file = $this->documentService->previewFile(
                $document,
                $request->versionId(),
                $request->user()
            );

            if ($file === null) {
                return response()->json(['message' => 'Berkas fisik tidak ditemukan.'], 404);
            }

            return response($file->content, 200, [
                'Content-Type' => $file->mimeType,
                'Content-Disposition' => 'inline; filename="'.addslashes($file->fileName).'"',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal memuat pratinjau: '.$e->getMessage(),
            ], 500);
        }
    }

    public function download(DocumentFileRequest $request, string $id)
    {
        $document = $this->documents->findWithRelations($id, ['versions']);

        Gate::authorize('download', $document);

        try {
            $file = $this->documentService->downloadFile(
                $document,
                $request->versionId(),
                $request->user()
            );

            if ($file === null) {
                return response()->json(['message' => 'Berkas fisik tidak ditemukan.'], 404);
            }

            return response($file->content, 200, [
                'Content-Type' => $file->mimeType,
                'Content-Disposition' => 'attachment; filename="'.addslashes($file->fileName).'"',
            ]);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => 'Gagal mengunduh: '.$e->getMessage(),
            ], 500);
        }
    }
}
