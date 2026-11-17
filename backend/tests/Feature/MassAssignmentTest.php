<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Database\Eloquent\MassAssignmentException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MassAssignmentTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_is_not_a_fillable_attribute(): void
    {
        $this->assertNotContains(
            'role',
            (new User)->getFillable(),
            'Kolom role harus di luar daftar fillable.'
        );
    }

    public function test_role_cannot_be_mass_assigned(): void
    {
        $this->expectException(MassAssignmentException::class);

        User::create([
            'name' => 'Pengguna Tidak Sah',
            'email' => 'mass-assignment@example.test',
            'password' => 'password-rahasia',
            'role' => 'admin',
        ]);
    }

    public function test_user_seeder_still_assigns_roles_explicitly(): void
    {
        $this->seed(UserSeeder::class);

        $this->assertDatabaseHas('users', [
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);
        $this->assertDatabaseHas('users', [
            'email' => 'viewer@example.com',
            'role' => 'viewer',
        ]);
    }
}
