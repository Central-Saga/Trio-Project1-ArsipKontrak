<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ApiContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_validation_error_uses_standard_error_envelope(): void
    {
        $response = $this->postJson('/api/v1/login', []);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'errors' => ['email', 'password'],
            ])
            ->assertJsonPath('success', false)
            ->assertJsonPath('data', null);
    }

    public function test_unknown_api_route_uses_standard_error_envelope(): void
    {
        $response = $this->getJson('/api/v1/route-yang-tidak-tersedia');

        $response->assertStatus(404)
            ->assertJsonStructure([
                'success',
                'message',
                'data',
                'errors',
            ])
            ->assertJsonPath('success', false)
            ->assertJsonPath('data', null)
            ->assertJsonPath('errors', null);
    }

    public function test_internal_api_error_does_not_expose_exception_details(): void
    {
        Route::get('/api/v1/_test-internal-error', static function () {
            throw new RuntimeException('secret-internal-stack-detail');
        });

        $response = $this->getJson('/api/v1/_test-internal-error');

        $response->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Terjadi kesalahan internal server.')
            ->assertJsonPath('data', null)
            ->assertJsonPath('errors', null);

        $this->assertStringNotContainsString(
            'secret-internal-stack-detail',
            $response->getContent()
        );
    }

    public function test_manually_returned_api_error_uses_standard_envelope(): void
    {
        Route::get('/api/v1/_test-direct-error', static function () {
            return response()->json([
                'message' => 'Aksi uji tidak diizinkan.',
                'legacy_detail' => 'internal-only',
            ], 403);
        });

        $response = $this->getJson('/api/v1/_test-direct-error');

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Aksi uji tidak diizinkan.')
            ->assertJsonPath('data', null)
            ->assertJsonPath('errors', null);

        $this->assertStringNotContainsString(
            'legacy_detail',
            $response->getContent()
        );
    }

    public function test_manually_returned_api_500_hides_internal_details(): void
    {
        Route::get('/api/v1/_test-direct-internal-error', static function () {
            return response()->json([
                'message' => 'secret-database-password',
                'trace' => 'secret-internal-stack-detail',
            ], 500);
        });

        $response = $this->getJson('/api/v1/_test-direct-internal-error');

        $response->assertStatus(500)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Terjadi kesalahan internal server.')
            ->assertJsonPath('data', null)
            ->assertJsonPath('errors', null);

        $this->assertStringNotContainsString(
            'secret-database-password',
            $response->getContent()
        );

        $this->assertStringNotContainsString(
            'secret-internal-stack-detail',
            $response->getContent()
        );
    }

    public function test_document_pagination_exposes_standard_metadata(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/documents');

        $response->assertOk()
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
    }

    public function test_document_metadata_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/v1/documents/1/metadata')
            ->assertUnauthorized();
    }

    public function test_activity_log_pagination_exposes_standard_metadata(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/activity-logs');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data',
                'meta' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ]);
    }

    public function test_login_is_throttled_and_returns_standard_error_envelope(): void
    {
        Cache::flush();

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/login', [
                'email' => 'rate-limit-test@example.com',
                'password' => 'wrong-password',
            ])->assertStatus(422);
        }

        $response = $this->postJson('/api/v1/login', [
            'email' => 'rate-limit-test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429)
            ->assertJsonPath('success', false)
            ->assertJsonPath(
                'message',
                'Terlalu banyak permintaan. Silakan coba lagi nanti.'
            )
            ->assertJsonPath('data', null)
            ->assertJsonPath('errors', null);
    }

    public function test_cors_allows_whitelisted_origin(): void
    {
        config([
            'cors.allowed_origins' => ['http://localhost:3001'],
        ]);

        $response = $this->withHeaders([
            'Origin' => 'http://localhost:3001',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'Content-Type, Authorization',
        ])->options('/api/v1/login');

        $this->assertSame(
            'http://localhost:3001',
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }

    public function test_cors_rejects_unknown_origin(): void
    {
        // Dua origin membuat CorsService memeriksa origin peminta,
        // alih-alih memakai optimasi untuk satu origin.
        config([
            'cors.allowed_origins' => [
                'http://localhost:3000',
                'http://localhost:3001',
            ],
        ]);

        $response = $this->withHeaders([
            'Origin' => 'http://untrusted.example',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'Content-Type, Authorization',
        ])->options('/api/v1/login');

        $this->assertNull(
            $response->headers->get('Access-Control-Allow-Origin')
        );
    }
}
