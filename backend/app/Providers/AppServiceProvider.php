<?php

namespace App\Providers;

use App\Models\Document;
use App\Models\User;
use App\Policies\DocumentPolicy;
use App\Policies\UserPolicy;
use App\Repositories\Contracts\DocumentRepositoryInterface;
use App\Repositories\Contracts\DocumentVersionRepositoryInterface;
use App\Repositories\Contracts\NotificationRepositoryInterface;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Eloquent\DocumentRepository;
use App\Repositories\Eloquent\DocumentVersionRepository;
use App\Repositories\Eloquent\NotificationRepository;
use App\Repositories\Eloquent\UserRepository;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Pemetaan kontrak repository ke implementasi Eloquent.
     *
     * @var array<class-string, class-string>
     */
    public array $bindings = [
        DocumentRepositoryInterface::class => DocumentRepository::class,
        DocumentVersionRepositoryInterface::class => DocumentVersionRepository::class,
        NotificationRepositoryInterface::class => NotificationRepository::class,
        UserRepositoryInterface::class => UserRepository::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        foreach ($this->bindings as $abstract => $concrete) {
            $this->app->bind($abstract, $concrete);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(User::class, UserPolicy::class);

        // Mencegah lazy loading di lingkungan non-production.
        Model::preventLazyLoading(! app()->isProduction());
    }
}
