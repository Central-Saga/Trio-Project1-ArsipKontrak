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

        // 2. Proyek Awal (Diseragamkan menggunakan updateOrCreate)
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
                'code' => 'PKWT',
                'name' => 'PKWT (Perjanjian Kerja Waktu Tertentu)',
                'description' => 'Kontrak kerja untuk pegawai kontrak dalam jangka waktu tertentu.',
            ],
            [
                'code' => 'PKWTT',
                'name' => 'PKWTT (Perjanjian Kerja Waktu Tidak Tertentu)',
                'description' => 'Kontrak kerja untuk pegawai tetap.',
            ],
            [
                'code' => 'MOU',
                'name' => 'MoU (Memorandum of Understanding)',
                'description' => 'Nota kesepahaman kerja sama awal antar instansi atau perusahaan.',
            ],
            [
                'code' => 'VENDOR',
                'name' => 'Kontrak Kerja Sama Vendor / Mitra',
                'description' => 'Perjanjian pengadaan barang atau jasa dengan pihak ketiga.',
            ],
        ];

        foreach ($contractTypes as $type) {
            ContractType::updateOrCreate(
                ['code' => $type['code']], // Idempoten berdasarkan kode
                [
                    'name' => $type['name'],
                    'description' => $type['description'],
                ]
            );
        }
    }
}