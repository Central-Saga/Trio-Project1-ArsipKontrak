<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Project;
use App\Models\Document;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upload_document_successfully()
    {
        // 1. Siapkan storage disk khusus terenkripsi agar menggunakan faking yang aman
        Storage::fake('private_encrypted');

        // 2. Buat user dummy dan autentikasi menggunakan Sanctum
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        // 3. Buat data Project secara manual dengan atribut lengkap
        $project = Project::create([
            'project_code' => 'PRJ/2026/001',
            'project_name' => 'Proyek Uji Coba',
            'name' => 'Proyek Uji Coba',
            'client' => 'PT Klien Uji',
            'description' => 'Deskripsi proyek uji coba',
            'start_date' => '2026-09-14',
            'end_date' => '2027-09-14',
        ]);

        // 4. Buat berkas PDF tiruan
        $file = UploadedFile::fake()->create('kontrak_uji.pdf', 500, 'application/pdf');

        // 5. Kirim request POST ke endpoint store document
        $response = $this->withHeader('Accept', 'application/json')
            ->postJson('/api/v1/documents', [
                'project_id' => $project->id,
                'document_type' => 'contract',
                'partner' => 'PT Percobaan Uji',
                'document_number' => 'CTR/2026/TEST/001',
                'document_name' => 'Kontrak Kerjasama Uji Coba',
                'contract_type_id' => 1,
                'client_id' => 1,
                'document_date' => '2026-09-14',
                'effective_date' => '2026-09-14',
                'expiry_date' => '2027-09-14',
                'status' => 'active',
                'description' => 'Dokumen uji coba otomatis',
                'file' => $file,
            ]);

        // 6. Verifikasi bahwa respons sukses (201 Created)
        $response->assertStatus(201);
    }

    public function test_user_can_create_document_version()
    {
        // 1. Siapkan storage
        Storage::fake('private_encrypted');

        // 2. Autentikasi user
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        // 3. Buat data Project
        $project = Project::create([
            'project_code' => 'PRJ/2026/002',
            'project_name' => 'Proyek Versi',
            'name' => 'Proyek Versi',
            'client' => 'PT Klien Versi',
            'description' => 'Deskripsi proyek versi',
            'start_date' => '2026-09-14',
            'end_date' => '2027-09-14',
        ]);

        // 4. Buat dokumen awal di database
        $document = Document::create([
            'project_id' => $project->id,
            'document_number' => 'CTR/2026/VER/001',
            'document_name' => 'Kontrak Versi 1',
            'document_type' => 'contract',
            'partner' => 'PT Partner Versi',
            'document_date' => '2026-09-14',
            'effective_date' => '2026-09-14',
            'expiry_date' => '2027-09-14',
            'status' => 'active',
            'description' => 'Dokumen versi awal',
            'created_by' => $user->id,
        ]);

        // 5. Buat file baru untuk versi berikutnya
        $newFile = UploadedFile::fake()->create('kontrak_v2.pdf', 500, 'application/pdf');

        // 6. Kirim request untuk menambah versi dokumen
        $response = $this->withHeader('Accept', 'application/json')
            ->postJson("/api/v1/documents/{$document->id}/versions", [
                'file' => $newFile,
                'description' => 'Pembaruan versi dokumen ke-2',
            ]);

        // 7. Cek apakah endpoint versioning merespons sukses (201 Created)
        $response->assertStatus(201);
    }

    public function test_unauthenticated_user_cannot_upload_document()
    {
        // 1. Siapkan storage
        Storage::fake('private_encrypted');

        // 2. Buat file tiruan tanpa melakukan autentikasi (tanpa actingAs)
        $file = UploadedFile::fake()->create('kontrak_ unauthorized.pdf', 500, 'application/pdf');

        // 3. Kirim request POST ke endpoint store document
        $response = $this->withHeader('Accept', 'application/json')
            ->postJson('/api/v1/documents', [
                'project_id' => 1,
                'document_type' => 'contract',
                'partner' => 'PT Tanpa Izin',
                'document_number' => 'CTR/2026/UNAUTH/001',
                'document_name' => 'Kontrak Tanpa Izin',
                'contract_type_id' => 1,
                'client_id' => 1,
                'document_date' => '2026-09-14',
                'effective_date' => '2026-09-14',
                'expiry_date' => '2027-09-14',
                'status' => 'active',
                'description' => 'Dokumen tanpa izin',
                'file' => $file,
            ]);

        // 4. Verifikasi bahwa akses ditolak karena belum login (401 Unauthorized)
        $response->assertStatus(401);
    }
}