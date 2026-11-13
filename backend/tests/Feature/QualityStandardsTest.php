<?php

namespace Tests\Feature;

use App\Repositories\Contracts\ActivityLogRepositoryInterface;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\DocumentVersionRepositoryInterface;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Repositories\Contracts\ProjectRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
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

    public function test_repository_contracts_are_bound_in_the_service_provider(): void
    {
        $provider = File::get(app_path('Providers/AppServiceProvider.php'));

        $this->assertStringContainsString(
            'public array $bindings',
            $provider,
            'AppServiceProvider harus mendeklarasikan pemetaan $bindings.'
        );

        $this->assertStringContainsString(
            '$this->app->bind(',
            $provider,
            'AppServiceProvider harus mendaftarkan setiap binding repository.'
        );

        foreach ([
            ActivityLogRepositoryInterface::class,
            DocumentRepositoryInterface::class,
            DocumentVersionRepositoryInterface::class,
            NotificationRepositoryInterface::class,
            ProjectRepositoryInterface::class,
            UserRepositoryInterface::class,
        ] as $contract) {
            $this->assertInstanceOf(
                $contract,
                app($contract),
                "Kontrak {$contract} belum terikat ke implementasinya."
            );
        }
    }

    public function test_controllers_jobs_and_commands_do_not_query_models_directly(): void
    {
        $files = $this->applicationFiles(['Http/Controllers', 'Jobs', 'Console']);

        $this->assertNotEmpty($files, 'Tidak ada source code controller/command yang diperiksa.');

        foreach ($files as $file) {
            foreach (['::query', 'DB::'] as $forbidden) {
                $this->assertStringNotContainsString(
                    $forbidden,
                    $file->getContents(),
                    "{$file->getRelativePathname()} tidak boleh memakai {$forbidden}; gunakan repository."
                );
            }
        }
    }

    public function test_controllers_jobs_and_commands_do_not_fetch_unbounded_collections(): void
    {
        $files = $this->applicationFiles(['Http/Controllers', 'Jobs', 'Console']);

        foreach ($files as $file) {
            foreach (['->get()', '::all()', '->all()'] as $forbidden) {
                $this->assertStringNotContainsString(
                    $forbidden,
                    $file->getContents(),
                    "{$file->getRelativePathname()} tidak boleh memakai {$forbidden}; batasi dengan paginate/limit/chunk."
                );
            }
        }
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

    /**
     * @param  list<string>  $directories
     * @return list<\SplFileInfo>
     */
    private function applicationFiles(array $directories): array
    {
        $files = [];

        foreach ($directories as $directory) {
            $path = app_path($directory);

            if (! File::isDirectory($path)) {
                continue;
            }

            foreach (File::allFiles($path) as $file) {
                $files[] = $file;
            }
        }

        return $files;
    }
}
