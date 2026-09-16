<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use App\Models\ContractType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Akun Admin Awal
        User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name'     => 'Administrator',
                'password' => Hash::make('password123'),
                'role'     => 'admin',
            ]
        );

        // 1.b Akun Viewer Awal
        User::updateOrCreate(
            ['email' => 'viewer@example.com'],
            [
                'name'     => 'Yanto',
                'password' => Hash::make('password123'),
                'role'     => 'viewer',
            ]
        );

        // Tambahkan user Asep sebagai Viewer
        User::firstOrCreate(
            ['email' => 'asep@example.com'],
            [
                'name'     => 'Asep',
                'password' => bcrypt('password123'),
                'role'     => 'viewer',
            ]
        );

        // 2. Proyek Awal
        Project::updateOrCreate(
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

        // 3. Master Jenis Kontrak Kerja & MoU 
        $contractTypes = [
            [
                'name'        => 'PKWT (Perjanjian Kerja Waktu Tertentu)',
                'description' => 'Kontrak kerja untuk pegawai kontrak dalam jangka waktu tertentu.',
            ],
            [
                'name'        => 'PKWTT (Perjanjian Kerja Waktu Tidak Tertentu)',
                'description' => 'Kontrak kerja untuk pegawai tetap.',
            ],
            [
                'name'        => 'MoU (Memorandum of Understanding)',
                'description' => 'Nota kesepahaman kerja sama awal antar instansi atau perusahaan.',
            ],
            [
                'name'        => 'Kontrak Kerja Sama Vendor / Mitra',
                'description' => 'Perjanjian pengadaan barang atau jasa dengan pihak ketiga.',
            ],
        ];

        foreach ($contractTypes as $type) {
            // Menggunakan 'name' sebagai acuan pencarian karena kolom 'code' tidak ada
            $contractType = ContractType::withTrashed()->firstOrCreate(
                ['name' => $type['name']],
                [
                    'description' => $type['description'],
                ]
            );

            if ($contractType->trashed()) {
                $contractType->restore();
            }

            $contractType->update([
                'description' => $type['description'],
            ]);
        }
    }
}