<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationRepositoryInterface $notifications
    ) {
    }

    /**
     * Mengambil notifikasi milik user yang sedang login.
     * Endpoint ini hanya membaca data; sinkronisasi dilakukan oleh command terjadwal.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $notifications = $this->notifications->recentForUser($userId, 50);

        $unreadCount = $this->notifications->unreadCountForUser($userId);

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Menandai satu notifikasi milik user sebagai sudah dibaca.
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = $this->notifications->findForUserOrFail(
            $request->user()->id,
            $id
        );

        $notification->update([
            'read_at' => now(),
        ]);

        return response()->json([
            'message' => 'Notifikasi ditandai sudah dibaca.',
        ]);
    }

    /**
     * Menandai semua notifikasi yang belum dibaca milik user.
     */
    public function markAllAsRead(Request $request)
    {
        $this->notifications->markAllAsReadForUser($request->user()->id);

        return response()->json([
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
        ]);
    }
}
