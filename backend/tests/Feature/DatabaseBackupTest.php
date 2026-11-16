<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class DatabaseBackupTest extends TestCase
{
    public function test_db_backup_command_runs_successfully(): void
    {
        $backupDir = storage_path('app/backups');

        $this->artisan('db:backup', ['--retention' => 7])
            ->assertSuccessful();

        $this->assertTrue(File::exists($backupDir), 'Direktori backup harus dibuat');
        $files = File::files($backupDir);
        $this->assertNotEmpty($files, 'File backup harus tersedia setelah command dieksekusi');
    }

    public function test_db_backup_is_scheduled_in_console_routes(): void
    {
        $consoleRoutes = File::get(base_path('routes/console.php'));

        $this->assertStringContainsString('db:backup', $consoleRoutes);
        $this->assertStringContainsString('dailyAt', $consoleRoutes);
    }

    public function test_compose_defines_backup_service_and_volume(): void
    {
        $compose = File::get(base_path('../compose.yaml'));

        $this->assertStringContainsString('backup:', $compose);
        $this->assertStringContainsString('postgres_backup:', $compose);
        $this->assertStringContainsString('BACKUP_RETENTION_DAYS', $compose);
    }
}
