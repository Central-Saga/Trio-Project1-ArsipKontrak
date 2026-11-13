<?php

namespace App\Repositories\Eloquent;

use App\DTO\NotificationListQueryData;
use App\Models\Notification;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class NotificationRepository implements NotificationRepositoryInterface
{
    public function forUser(int $userId, NotificationListQueryData $query): Collection
    {
        $builder = Notification::query()
            ->where('recipient_user_id', $userId)
            ->with('document');

        if ($query->type !== null) {
            $builder->where('type', $query->type);
        }

        if ($query->unreadOnly) {
            $builder->whereNull('read_at');
        }

        return $builder
            ->orderBy($query->sort, $query->direction)
            ->limit($query->perPage)
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

    public function markAsRead(Notification $notification): bool
    {
        return $notification->update([
            'read_at' => now(),
        ]);
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
