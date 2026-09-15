<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // Mengambil daftar notifikasi untuk user yang sedang login
    public function index(Request $request)
    {
        $user = $request->user();

        $notifications = Notification::where('recipient_user_id', $user->id)
            ->with('document')
            ->orderBy('created_at', 'desc')
            ->get();

        $unreadCount = Notification::where('recipient_user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    // Menandai satu notifikasi sudah dibaca
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('recipient_user_id', $request->user()->id)
            ->findOrFail($id);

        $notification->update([
            'read_at' => now(),
        ]);

        return response()->json(['message' => 'Notifikasi ditandai sudah dibaca.']);
    }

    // Menandai semua notifikasi sudah dibaca
    public function markAllAsRead(Request $request)
    {
        Notification::where('recipient_user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update([
                'read_at' => now(),
            ]);

        return response()->json(['message' => 'Semua notifikasi ditandai sudah dibaca.']);
    }
}