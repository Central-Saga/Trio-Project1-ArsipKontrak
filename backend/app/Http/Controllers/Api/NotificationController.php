<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Document;
use Illuminate\Http\Request;
use Carbon\Carbon;

class NotificationController extends Controller
{
    // Mengambil daftar notifikasi untuk user yang sedang login sekaligus memindai dokumen
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Jalankan pemindaian otomatis dokumen yang mendekati H-7 atau Expired
        $this->generateDocumentNotifications($user->id);

        // 2. Ambil data notifikasi
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

    // Fungsi bantu untuk membuat notifikasi otomatis berdasarkan expiry_date
    private function generateDocumentNotifications($userId)
    {
        $today = Carbon::today();
        
        // Ambil dokumen yang memiliki tanggal kedaluwarsa
        $documents = Document::whereNotNull('expiry_date')->get();

        foreach ($documents as $doc) {
            $expiryDate = Carbon::parse($doc->expiry_date)->startOfDay();
            $diffDays = (int) $today->diffInDays($expiryDate, false); // Selisih hari

            $notifType = null;

            if ($diffDays < 0) {
                // Sudah kedaluwarsa
                $notifType = 'expired';
            } elseif ($diffDays <= 7 && $diffDays >= 0) {
                // Diubah menjadi rentang: dari hari ini (0) hingga 7 hari ke depan
                $notifType = 'expiry_7';
            } elseif ($diffDays === 30) {
                // Tepat H-30
                $notifType = 'expiry_30';
            }

            if ($notifType) {
                // Cek apakah notifikasi untuk dokumen dan tipe ini sudah pernah dibuat sebelumnya
                $exists = Notification::where('recipient_user_id', $userId)
                    ->where('document_id', $doc->id)
                    ->where('type', $notifType)
                    ->exists();

                if (!$exists) {
                    // Gunakan objek baru agar aman dari proteksi database
                    $notification = new Notification();
                    $notification->recipient_user_id = $userId;
                    $notification->document_id = $doc->id;
                    $notification->type = $notifType;
                    $notification->sent_at = now();
                    $notification->save();
                }
            }
        }
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