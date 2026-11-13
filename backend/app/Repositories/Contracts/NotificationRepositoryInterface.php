<?php

namespace App\Repositories\Contracts;

use App\Models\Notification;
use Illuminate\Database\Eloquent\Collection;

interface NotificationRepositoryInterface
{
    public function recentForUser(int $userId, int $limit = 50): Collection;

    public function unreadCountForUser(int $userId): int;

    public function findForUserOrFail(int $userId, string $id): Notification;

    public function markAllAsReadForUser(int $userId): int;

    public function existsFor(int $documentId, int $userId, string $type): bool;

    public function create(array $attributes): Notification;

    public function insertOrIgnore(array $rows): int;
}
