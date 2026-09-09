<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Administrator',
                'email' => 'admin@example.com',
                'password' => Hash::make('password123'),
                'role' => 'admin',
            ],
            [
                'name' => 'Project Manager',
                'email' => 'pm@example.com',
                'password' => Hash::make('password123'),
                'role' => 'project_manager',
            ],
            [
                'name' => 'Document Controller',
                'email' => 'controller@example.com',
                'password' => Hash::make('password123'),
                'role' => 'document_controller',
            ],
            [
                'name' => 'Viewer Tamu',
                'email' => 'viewer@example.com',
                'password' => Hash::make('password123'),
                'role' => 'viewer',
            ],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                $data
            );
        }
    }
}
