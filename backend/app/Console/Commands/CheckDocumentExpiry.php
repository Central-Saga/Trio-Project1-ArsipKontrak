<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Document;
use App\Models\Notification;
use Carbon\Carbon;

class CheckDocumentExpiry extends Command
{
    protected $signature = 'documents:check-expiry';
    protected $description = 'Memeriksa masa berlaku dokumen dan membuat reminder H-30, H-7, serta status expired';

    public function handle()
    {
        $today = Carbon::today();
        $this->info("Menjalankan pemeriksaan expiry dokumen pada: " . $today->toDateString());

        // Ambil semua dokumen yang belum berstatus terminated atau expired
        $documents = Document::whereNotIn('status', ['terminated', 'expired'])->get();

        foreach ($documents as $document) {
            $expiryDate = Carbon::parse($document->expiry_date);
            $diffDays = $today->diffInDays($expiryDate, false); // false agar bernilai negatif jika sudah lewat

            // 1. Jika sudah lewat tanggal expiry (H-0 / lewat)
            if ($diffDays < 0) {
                $document->update(['status' => 'expired']);
                $this->createNotification($document, 'expired');
                continue;
            }

            // 2. Reminder H-30 (antara 8 sampai 30 hari menuju kedaluwarsa)
            if ($diffDays <= 30 && $diffDays > 7) {
                $this->createNotification($document, 'expiry_30');
            }

            // 3. Reminder H-7 (antara 0 sampai 7 hari menuju kedaluwarsa)
            if ($diffDays <= 7) {
                $this->createNotification($document, 'expiry_7');
            }
        }

        $this->info('Pemeriksaan expiry dokumen selesai.');
    }

   // private function createDocument Notification helper
    private function createNotification($document, $type)
    {
        // Tentukan siapa penerima (Project Manager & Document Controller, atau pembuat dokumen)
        // Berdasarkan PRD, reminder ditujukan ke role terkait atau creator/admin. 
        // Di sini kita contohkan dikirim ke user `created_by` atau bisa disesuaikan dengan relasi role.
        $recipientId = $document->created_by; 

        // Gunakan firstOrCreate untuk mencegah duplikasi (memanfaatkan UNIQUE constraint [document_id, recipient_user_id, type])
        Notification::firstOrCreate(
            [
                'document_id' => $document->id,
                'recipient_user_id' => $recipientId,
                'type' => $type,
            ],
            [
                'sent_at' => now(),
            ]
        );
    }
}
