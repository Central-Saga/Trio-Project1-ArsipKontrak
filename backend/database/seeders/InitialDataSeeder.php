<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Admin Awal
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'     => 'Administrator',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. Proyek Awal
        Project::firstOrCreate(
            ['project_code' => 'PRJ-MOU-001'],
            [
                'project_name' => 'Kerja Sama Digital Transformation',
                'client'       => 'PT Mitra Usaha Mandiri',
                'description'  => 'Proyek kerja sama strategis modernisasi sistem arsip digital.',
                'start_date'   => now()->toDateString(),
                'end_date'     => now()->addYear()->toDateString(),
                'status'       => 'active',
            ]
        );
    }
}