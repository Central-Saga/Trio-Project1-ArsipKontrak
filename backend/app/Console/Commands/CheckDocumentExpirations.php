<?php

namespace App\Console\Commands;
use Illuminate\Console\Command;
use App\Models\Document;
use App\Models\User;
use App\Models\Notification;
use Carbon\Carbon;

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
    public function handle()
    {
        $today = Carbon::today();
        
        // Kirim notifikasi ke Admin dan Viewer (atau sesuaikan kebutuhan)
        $recipients = User::all(); 
        $documents = Document::all();

        $count = 0;

        foreach ($documents as $doc) {
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
                foreach ($recipients as $recipient) {
                    // Mencegah duplikat berdasarkan unique constraint migration (document_id, recipient_user_id, type)
                    $exists = Notification::where('document_id', $doc->id)
                        ->where('recipient_user_id', $recipient->id)
                        ->where('type', $type)
                        ->exists();

                    if (!$exists) {
                        Notification::create([
                            'document_id' => $doc->id,
                            'recipient_user_id' => $recipient->id,
                            'type' => $type,
                            'sent_at' => now(),
                        ]);
                        $count++;
                    }
                }
            }
        }

        $this->info("Pemeriksaan masa berlaku dokumen selesai. Berhasil membuat {$count} notifikasi baru.");
    }
}

