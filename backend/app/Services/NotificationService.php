<?php

namespace App\Services;

use App\DTO\NotificationListData;
use App\DTO\NotificationListQueryData;
use App\Models\Notification;
use App\Repositories\Contracts\NotificationRepositoryInterface;

class NotificationService
{
    public function __construct(
        private NotificationRepositoryInterface $notifications
    ) {}

    public function listForUser(int $userId, NotificationListQueryData $query): NotificationListData
    {
        return new NotificationListData(
            notifications: $this->notifications->forUser($userId, $query),
            unreadCount: $this->notifications->unreadCountForUser($userId),
        );
    }

    public function markAsRead(int $userId, string $id): Notification
    {
        $notification = $this->notifications->findForUserOrFail($userId, $id);

        $this->notifications->markAsRead($notification);

        return $notification;
    }

    public function markAllAsRead(int $userId): void
    {
        $this->notifications->markAllAsReadForUser($userId);
    }
}
