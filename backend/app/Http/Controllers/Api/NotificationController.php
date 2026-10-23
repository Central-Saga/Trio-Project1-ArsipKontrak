<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Mengambil notifikasi milik user yang sedang login.
     * Endpoint ini hanya membaca data; sinkronisasi dilakukan oleh command terjadwal.
     */
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $notifications = Notification::query()
            ->where('recipient_user_id', $userId)
            ->with('document')
            ->orderByDesc('created_at')
            ->get();

        $unreadCount = Notification::query()
            ->where('recipient_user_id', $userId)
            ->whereNull('read_at')
            ->count();

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
        $notification = Notification::query()
            ->where('recipient_user_id', $request->user()->id)
            ->findOrFail($id);

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
        Notification::query()
            ->where('recipient_user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);

        return response()->json([
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
        ]);
    }
}
