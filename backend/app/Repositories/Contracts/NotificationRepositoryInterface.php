<?php

namespace App\Repositories\Contracts;

use App\DTO\NotificationListQueryData;
use App\Models\Notification;
use Illuminate\Database\Eloquent\Collection;

interface NotificationRepositoryInterface
{
    public function forUser(int $userId, NotificationListQueryData $query): Collection;

    public function unreadCountForUser(int $userId): int;

    public function findForUserOrFail(int $userId, string $id): Notification;

    public function markAsRead(Notification $notification): bool;

    public function markAllAsReadForUser(int $userId): int;

    public function existsFor(int $documentId, int $userId, string $type): bool;

    public function create(array $attributes): Notification;

    public function insertOrIgnore(array $rows): int;
}
