<?php

namespace App\Repositories\Eloquent;

use App\Models\Notification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class NotificationRepository implements NotificationRepositoryInterface
{
    public function recentForUser(int $userId, int $limit = 50): Collection
    {
        return Notification::query()
            ->where('recipient_user_id', $userId)
            ->with('document')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    public function unreadCountForUser(int $userId): int
    {
        return Notification::query()
            ->where('recipient_user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function findForUserOrFail(int $userId, string $id): Notification
    {
        return Notification::query()
            ->where('recipient_user_id', $userId)
            ->findOrFail($id);
    }

    public function markAllAsReadForUser(int $userId): int
    {
        return Notification::query()
            ->where('recipient_user_id', $userId)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);
    }

    public function existsFor(int $documentId, int $userId, string $type): bool
    {
        return Notification::where('document_id', $documentId)
            ->where('recipient_user_id', $userId)
            ->where('type', $type)
            ->exists();
    }

    public function create(array $attributes): Notification
    {
        return Notification::create($attributes);
    }

    public function insertOrIgnore(array $rows): int
    {
        return Notification::query()->insertOrIgnore($rows);
    }
}
