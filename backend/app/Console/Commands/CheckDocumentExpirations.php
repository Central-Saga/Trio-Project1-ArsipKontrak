<?php

namespace App\Console\Commands;

use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckDocumentExpirations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documents:check-expirations';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Periksa dokumen yang akan kedaluwarsa dan buat notifikasi otomatis';

    /**
     * Execute the console command.
     */
    public function handle(
        DocumentRepositoryInterface $documents,
        UserRepositoryInterface $users,
        NotificationRepositoryInterface $notifications
    ): int {
        $today = Carbon::today();

        // Kirim notifikasi ke seluruh pengguna yang terdaftar.
        $recipients = $users->pluckIds();

        $count = 0;

        $documents->chunkAll(500, function ($chunk) use (
            $today,
            $recipients,
            $notifications,
            &$count
        ): void {
            foreach ($chunk as $doc) {
                if (!$doc->expiry_date) {
                    continue;
                }

                $expiryDate = Carbon::parse($doc->expiry_date);
                $daysLeft = (int) $today->diffInDays($expiryDate, false);

                // Tentukan tipe notifikasi berdasarkan sisa hari sesuai migrasi
                $type = null;
                if ($daysLeft === 30) {
                    $type = 'expiry_30';
                } elseif ($daysLeft === 7) {
                    $type = 'expiry_7';
                } elseif ($daysLeft < 0) {
                    $type = 'expired';
                }

                if ($type) {
                    foreach ($recipients as $recipientId) {
                        // Mencegah duplikat berdasarkan unique constraint migration
                        // (document_id, recipient_user_id, type).
                        if ($notifications->existsFor($doc->id, $recipientId, $type)) {
                            continue;
                        }

                        $notifications->create([
                            'document_id' => $doc->id,
                            'recipient_user_id' => $recipientId,
                            'type' => $type,
                            'sent_at' => now(),
                        ]);
                        $count++;
                    }
                }
            }
        });

        $this->info("Pemeriksaan masa berlaku dokumen selesai. Berhasil membuat {$count} notifikasi baru.");

        return self::SUCCESS;
    }
}
