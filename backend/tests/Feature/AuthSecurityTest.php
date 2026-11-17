<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_sanctum_token_expiration_is_configured_and_not_null(): void
    {
        $expiration = config('sanctum.expiration');

        $this->assertNotNull($expiration, 'Sanctum token expiration must not be null');
        $this->assertIsInt($expiration, 'Sanctum token expiration must be an integer');
        $this->assertGreaterThan(0, $expiration, 'Sanctum token expiration must be greater than zero minutes');
    }

    public function test_logout_revokes_current_token_and_rejects_subsequent_requests(): void
    {
        $user = User::factory()->create([
            'email' => 'logout.test@example.com',
            'password' => Hash::make('password123'),
        ]);

        $token = $user->createToken('test_auth_token')->plainTextToken;

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.user.email', 'logout.test@example.com');

        $this->withToken($token)
            ->postJson('/api/v1/logout')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/v1/me')
            ->assertUnauthorized();
    }

    public function test_changing_password_revokes_all_existing_tokens(): void
    {
        $user = User::factory()->create([
            'email' => 'change.pw@example.com',
            'password' => Hash::make('old-password-123'),
        ]);

        $oldToken = $user->createToken('session_one')->plainTextToken;
        $anotherOldToken = $user->createToken('session_two')->plainTextToken;

        $this->withToken($oldToken)
            ->getJson('/api/v1/me')
            ->assertOk();

        $this->withToken($oldToken)
            ->postJson('/api/v1/change-password', [
                'current_password' => 'old-password-123',
                'password' => 'new-secret-password-456',
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $user->refresh();
        $this->assertTrue(Hash::check('new-secret-password-456', $user->password));

        $this->app['auth']->forgetGuards();

        // Token lama harus mati (unauthorized)
        $this->withToken($oldToken)
            ->getJson('/api/v1/me')
            ->assertUnauthorized();

        $this->app['auth']->forgetGuards();

        $this->withToken($anotherOldToken)
            ->getJson('/api/v1/me')
            ->assertUnauthorized();
    }
}
