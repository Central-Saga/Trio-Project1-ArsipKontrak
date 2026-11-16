<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class DeploymentStandardsTest extends TestCase
{
    public function test_entrypoint_does_not_run_database_migrations(): void
    {
        $entrypoint = File::get(base_path('docker-entrypoint.sh'));

        $this->assertStringNotContainsString(
            'artisan migrate',
            $entrypoint,
            'Entrypoint aplikasi tidak boleh menjalankan migrasi; gunakan release job terpisah.'
        );
    }

    public function test_compose_runs_migrations_as_an_isolated_release_job(): void
    {
        $compose = File::get(base_path('../compose.yaml'));

        $this->assertStringContainsString(
            'migrate:',
            $compose,
            'compose.yaml harus mendefinisikan service migrate.'
        );
        $this->assertStringContainsString(
            '--isolated',
            $compose,
            'Service migrate harus memakai --isolated agar aman untuk multi-replika.'
        );
        $this->assertStringContainsString(
            'service_completed_successfully',
            $compose,
            'Aplikasi harus menunggu release job migrasi selesai.'
        );
    }
}
