<?php

namespace App\Repositories\Eloquent;

use App\Models\Document;
use App\Models\DocumentVersion;
use App\Repositories\Contracts\DocumentVersionRepositoryInterface;
use Closure;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DocumentVersionRepository implements DocumentVersionRepositoryInterface
{
    public function forDocument(Document $document, int $limit = 100): Collection
    {
        return $document->versions()
            ->with('uploader')
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function countForDocument(Document $document): int
    {
        return $document->versions()->count();
    }

    public function create(array $attributes): DocumentVersion
    {
        return DocumentVersion::create($attributes);
    }

    public function markAllNotCurrent(Document $document): int
    {
        return $document->versions()->update(['is_current' => false]);
    }

    public function findForDocumentOrFail(string $documentId, string $versionId): DocumentVersion
    {
        return DocumentVersion::query()
            ->where('document_id', $documentId)
            ->findOrFail($versionId);
    }

    public function findCurrentOrLatest(Document $document, ?string $versionId = null): ?DocumentVersion
    {
        if ($versionId !== null) {
            return DocumentVersion::query()
                ->where('document_id', $document->id)
                ->findOrFail($versionId);
        }

        return DocumentVersion::query()
            ->where('document_id', $document->id)
            ->where('is_current', true)
            ->first()
            ?? DocumentVersion::query()
                ->where('document_id', $document->id)
                ->latest()
                ->first();
    }

    public function transaction(Closure $callback): mixed
    {
        return DB::transaction($callback);
    }
}
