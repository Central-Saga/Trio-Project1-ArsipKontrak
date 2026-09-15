<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Document;
use Carbon\Carbon;

class UpdateExpiredDocuments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documents:update-expired';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Secara otomatis memperbarui status dokumen menjadi expired jika tanggal kedaluwarsa telah terlewati';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Cari dokumen berstatus active atau draft yang expiry_date-nya sudah lewat
        $updatedCount = Document::whereIn('status', ['active', 'draft'])
            ->where('expiry_date', '<', Carbon::today())
            ->update(['status' => 'expired']);

        $this->info("Berhasil memperbarui {$updatedCount} dokumen menjadi expired.");
        
        return Command::SUCCESS;
    }
}