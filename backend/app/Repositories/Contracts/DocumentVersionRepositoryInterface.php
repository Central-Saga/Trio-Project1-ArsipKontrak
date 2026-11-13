<?php

namespace App\Repositories\Contracts;

use App\DTO\DocumentVersionListQueryData;
use App\Models\Document;
use App\Models\DocumentVersion;
use Closure;
use Illuminate\Database\Eloquent\Collection;

interface DocumentVersionRepositoryInterface
{
    public function forDocument(Document $document, DocumentVersionListQueryData $query): Collection;

    public function countForDocument(Document $document): int;

    public function create(array $attributes): DocumentVersion;

    public function markAllNotCurrent(Document $document): int;

    public function findForDocumentOrFail(string $documentId, string $versionId): DocumentVersion;

    public function findCurrentOrLatest(Document $document, ?string $versionId = null): ?DocumentVersion;

    public function transaction(Closure $callback): mixed;
}
