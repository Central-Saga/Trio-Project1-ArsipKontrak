<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Cache\ArrayStore;
use Illuminate\Cache\RateLimiter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Tests\TestCase;

class CacheResilienceTest extends TestCase
{
    use RefreshDatabase;

    public function test_cache_falls_back_when_primary_store_is_unavailable(): void
    {
        $this->useUnstableFailoverStore();

        $cache = Cache::store('failover');
        $cache->put('resilience-check', 'ok', 60);

        $this->assertSame('ok', $cache->get('resilience-check'));
    }

    public function test_statistics_endpoint_fails_open_when_cache_primary_is_unavailable(): void
    {
        $this->useUnstableFailoverStore(asDefault: true);

        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/dashboard/statistics')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    private function useUnstableFailoverStore(bool $asDefault = false): void
    {
        Cache::extend('unstable', fn () => Cache::repository(
            new class extends ArrayStore
            {
                public function get($key)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function many(array $keys)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function put($key, $value, $seconds)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function putMany(array $values, $seconds)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function add($key, $value, $seconds)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function increment($key, $value = 1)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function decrement($key, $value = 1)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function forever($key, $value)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function forget($key)
                {
                    throw new RuntimeException('Simulated cache outage.');
                }

                public function flush()
                {
                    throw new RuntimeException('Simulated cache outage.');
                }
            }
        ));

        config([
            'cache.stores.unstable' => ['driver' => 'unstable'],
            'cache.stores.failover' => [
                'driver' => 'failover',
                'stores' => ['unstable', 'array'],
            ],
        ]);

        if ($asDefault) {
            config(['cache.default' => 'failover']);

            $this->app->forgetInstance('cache.store');
            $this->app->forgetInstance(RateLimiter::class);
        }

        Cache::forgetDriver('failover');
    }
}
