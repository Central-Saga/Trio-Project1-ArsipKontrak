<?php

namespace App\Http\Controllers\Api;

use App\DTO\NotificationListQueryData;
use App\Http\Controllers\Controller;
use App\Http\Requests\IndexNotificationRequest;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(private NotificationService $notificationService) {}

    /**
     * Mengambil notifikasi milik user yang sedang login.
     * Endpoint ini hanya membaca data; sinkronisasi dilakukan oleh command terjadwal.
     */
    public function index(IndexNotificationRequest $request)
    {
        $data = $this->notificationService->listForUser(
            (int) $request->user()->id,
            NotificationListQueryData::fromValidated($request->validated())
        );

        return response()->json([
            'notifications' => NotificationResource::collection(
                $data->notifications
            )->resolve($request),
            'unread_count' => $data->unreadCount,
        ]);
    }

    /**
     * Menandai satu notifikasi milik user sebagai sudah dibaca.
     */
    public function markAsRead(Request $request, string $id)
    {
        $this->notificationService->markAsRead(
            (int) $request->user()->id,
            $id
        );

        return response()->json([
            'message' => 'Notifikasi ditandai sudah dibaca.',
        ]);
    }

    /**
     * Menandai semua notifikasi yang belum dibaca milik user.
     */
    public function markAllAsRead(Request $request)
    {
        $this->notificationService->markAllAsRead((int) $request->user()->id);

        return response()->json([
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
        ]);
    }
}
