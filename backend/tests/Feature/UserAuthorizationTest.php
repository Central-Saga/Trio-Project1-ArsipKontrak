<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_valid_roles_can_access_document_listing(): void
    {
        foreach (['admin', 'project_manager', 'document_controller', 'viewer'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user, 'sanctum')
                ->getJson('/api/v1/documents')
                ->assertOk();
        }
    }

    public function test_admin_can_list_users_without_exposing_passwords(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['role' => 'viewer']);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonMissingPath('data.0.password')
            ->assertJsonMissingPath('data.1.password');
    }

    public function test_viewer_cannot_list_or_create_users(): void
    {
        $viewer = User::factory()->create(['role' => 'viewer']);

        $this->actingAs($viewer, 'sanctum')
            ->getJson('/api/v1/admin/users')
            ->assertForbidden();

        $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'name' => 'Pengguna Baru',
                'email' => 'pengguna.baru@example.test',
                'password' => 'password-rahasia',
                'role' => 'viewer',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', [
            'email' => 'pengguna.baru@example.test',
        ]);
    }

    public function test_viewer_cannot_create_an_admin_user(): void
    {
        $viewer = User::factory()->create(['role' => 'viewer']);

        $this->actingAs($viewer, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'name' => 'Admin Tidak Sah',
                'email' => 'attempted.admin@example.test',
                'password' => 'password-rahasia',
                'role' => 'admin',
            ])
            ->assertForbidden();

        $this->assertDatabaseMissing('users', [
            'email' => 'attempted.admin@example.test',
        ]);
    }

    public function test_admin_can_create_user_without_returning_password(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [
                'name' => 'Project Manager Baru',
                'email' => 'pm.baru@example.test',
                'password' => 'password-rahasia',
                'role' => 'project_manager',
            ])
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Project Manager Baru')
            ->assertJsonPath('data.email', 'pm.baru@example.test')
            ->assertJsonPath('data.role', 'project_manager')
            ->assertJsonMissingPath('data.password');

        $createdUser = User::where(
            'email',
            'pm.baru@example.test'
        )->firstOrFail();

        $this->assertTrue(
            Hash::check('password-rahasia', $createdUser->password)
        );
    }

    public function test_admin_user_creation_validates_required_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/admin/users', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'email',
                'password',
                'role',
            ]);
    }

    public function test_viewer_cannot_delete_another_user(): void
    {
        $viewer = User::factory()->create(['role' => 'viewer']);
        $target = User::factory()->create(['role' => 'viewer']);

        $this->actingAs($viewer, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$target->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('users', [
            'id' => $target->id,
        ]);
    }

    public function test_admin_cannot_delete_the_account_in_use(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$admin->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('users', [
            'id' => $admin->id,
        ]);
    }

    public function test_admin_can_delete_another_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $target = User::factory()->create(['role' => 'viewer']);

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$target->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data', null);

        $this->assertDatabaseMissing('users', [
            'id' => $target->id,
        ]);
    }
}
