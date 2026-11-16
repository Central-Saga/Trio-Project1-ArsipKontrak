<?php

namespace App\DTO;

use App\Models\Notification;
use Illuminate\Database\Eloquent\Collection;

final readonly class NotificationListData
{
    /**
     * @param  Collection<int, Notification>  $notifications
     */
    public function __construct(
        public Collection $notifications,
        public int $unreadCount,
    ) {}
}
