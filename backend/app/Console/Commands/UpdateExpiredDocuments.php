<?php

namespace App\Console\Commands;

use App\Repositories\Contracts\DocumentRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Console\Command;

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
    public function handle(DocumentRepositoryInterface $documents): int
    {
        // Cari dokumen berstatus active atau draft yang expiry_date-nya sudah lewat
        $updatedCount = $documents->markExpiredForStatuses(
            ['active', 'draft'],
            Carbon::today()
        );

        $this->info("Berhasil memperbarui {$updatedCount} dokumen menjadi expired.");

        return self::SUCCESS;
    }
}
