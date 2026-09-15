<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model; // <-- Tambahkan import ini di atas
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Mengaktifkan pencegahan lazy loading (aktif otomatis di luar mode production)
        Model::preventLazyLoading(! app()->isProduction());
    }
}