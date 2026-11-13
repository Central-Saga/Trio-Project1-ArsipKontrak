<?php

namespace App\Repositories\Contracts;

use App\Models\Document;
use App\Models\User;
use Carbon\CarbonInterface;
use Closure;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface DocumentRepositoryInterface
{
    public function statistics(): array;

    public function paginateForUser(?User $user, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function trashed(int $limit = 100): Collection;

    public function findOrFail(string $id): Document;

    public function findWithRelations(string $id, array $relations = []): Document;

    public function findOnlyTrashed(string $id): Document;

    public function findForMetadata(string $id): Document;

    public function create(array $attributes): Document;

    public function update(Document $document, array $attributes): bool;

    public function delete(Document $document): ?bool;

    public function restore(Document $document): bool;

    public function markExpiredBefore(CarbonInterface $date): int;

    public function markExpiredForStatuses(array $statuses, CarbonInterface $date): int;

    public function chunkForExpiryNotifications(int $chunkSize, Closure $callback): void;

    public function chunkAll(int $chunkSize, Closure $callback): void;

    public function transaction(Closure $callback): mixed;
}
