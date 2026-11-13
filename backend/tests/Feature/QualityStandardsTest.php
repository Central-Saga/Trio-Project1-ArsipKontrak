<?php

namespace Tests\Feature;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class QualityStandardsTest extends TestCase
{
    public function test_lazy_loading_prevention_is_enabled_in_testing_environment(): void
    {
        $this->assertSame('testing', app()->environment());

        $this->assertTrue(
            Model::preventsLazyLoading(),
            'Model::preventLazyLoading() harus aktif selama testing.'
        );
    }

    public function test_controllers_and_services_do_not_use_the_cache_facade_directly(): void
    {
        foreach (['app/Http/Controllers', 'app/Services'] as $directory) {
            $files = File::allFiles(base_path($directory));

            $this->assertNotEmpty(
                $files,
                "Direktori {$directory} tidak ditemukan atau kosong."
            );

            foreach ($files as $file) {
                $this->assertStringNotContainsString(
                    'Cache::',
                    $file->getContents(),
                    "{$file->getRelativePathname()} tidak boleh mengakses Cache:: secara langsung."
                );
            }
        }
    }

    public function test_application_does_not_flush_the_entire_cache(): void
    {
        $forbiddenCall = 'Cache::'.'flush()';

        foreach (['app', 'routes', 'database', 'tests'] as $directory) {
            foreach (File::allFiles(base_path($directory)) as $file) {
                $this->assertStringNotContainsString(
                    $forbiddenCall,
                    $file->getContents(),
                    "{$file->getRelativePathname()} tidak boleh memanggil {$forbiddenCall}."
                );
            }
        }
    }
}
