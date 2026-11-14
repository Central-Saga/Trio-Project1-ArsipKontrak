<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MassAssignmentEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_sent_to_login_is_ignored(): void
    {
        $user = User::factory()->create([
            'email' => 'viewer-mass-assignment@example.test',
            'password' => 'password-rahasia',
            'role' => 'viewer',
        ]);

        $this->postJson('/api/v1/login', [
            'email' => $user->email,
            'password' => 'password-rahasia',
            'role' => 'admin',
        ])
            ->assertOk()
            ->assertJsonPath('user.role', 'viewer');

        $this->assertSame('viewer', $user->fresh()->role);
    }

    public function test_unauthenticated_request_cannot_create_an_admin_user(): void
    {
        $this->postJson('/api/v1/admin/users', [
            'name' => 'Admin Tidak Sah',
            'email' => 'unauthenticated-admin@example.test',
            'password' => 'password-rahasia',
            'role' => 'admin',
        ])->assertUnauthorized();

        $this->assertDatabaseMissing('users', [
            'email' => 'unauthenticated-admin@example.test',
        ]);
    }
}
