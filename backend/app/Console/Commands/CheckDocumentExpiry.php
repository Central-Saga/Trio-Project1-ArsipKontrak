<?php

namespace App\Console\Commands;

use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckDocumentExpiry extends Command
{
    protected $signature = 'documents:check-expiry';

    protected $description = 'Memperbarui status expiry dan membuat notifikasi H-30, H-7, serta expired secara idempotent';

    public function handle(
        DocumentRepositoryInterface $documents,
        NotificationRepositoryInterface $notifications
    ): int {
        $today = Carbon::today();

        $this->info(
            'Menjalankan pemeriksaan expiry dokumen pada: '
            . $today->toDateString()
        );

        // Pembaruan status dilakukan secara massal, bukan per dokumen.
        $updatedCount = $documents->markExpiredBefore($today);

        $notificationsInserted = 0;

        // Ambil dokumen bertahap agar penggunaan memori tetap terkendali.
        // Dokumen expired tetap dibaca agar notifikasi expired tidak terlewat.
        $documents->chunkForExpiryNotifications(500, function ($chunk) use (
            $today,
            $notifications,
            &$notificationsInserted
        ): void {
            $rows = [];

            foreach ($chunk as $document) {
                if (!$document->created_by || !$document->expiry_date) {
                    continue;
                }

                $expiryDate = Carbon::parse($document->expiry_date)
                    ->startOfDay();

                $diffDays = (int) $today->diffInDays(
                    $expiryDate,
                    false
                );

                if ($diffDays < 0) {
                    $type = 'expired';
                } elseif ($diffDays <= 7) {
                    $type = 'expiry_7';
                } elseif ($diffDays <= 30) {
                    $type = 'expiry_30';
                } else {
                    continue;
                }

                $now = now();

                $rows[] = [
                    'document_id' => $document->id,
                    'recipient_user_id' => $document->created_by,
                    'type' => $type,
                    'sent_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            // Satu batch insert, bukan query exists untuk tiap dokumen.
            // Unique constraint di database mencegah notifikasi duplikat.
            if ($rows !== []) {
                $notificationsInserted += $notifications->insertOrIgnore($rows);
            }
        });

        $this->info(
            "Berhasil memperbarui {$updatedCount} dokumen menjadi expired."
        );

        $this->info(
            "Notifikasi baru yang dibuat: {$notificationsInserted}."
        );

        $this->info('Pemeriksaan expiry dokumen selesai.');

        return self::SUCCESS;
    }
}
