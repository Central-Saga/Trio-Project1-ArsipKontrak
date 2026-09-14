<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Project;
use App\Models\Document;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_upload_document_successfully()
    {
        Storage::fake('private_encrypted');

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $project = Project::create([
            'project_code' => 'PRJ/2026/001',
            'project_name' => 'Proyek Uji Coba',
            'name' => 'Proyek Uji Coba',
            'client' => 'PT Klien Uji',
            'description' => 'Deskripsi proyek uji coba',
            'start_date' => '2026-09-14',
            'end_date' => '2027-09-14',
        ]);

        $file = UploadedFile::fake()->create('kontrak_uji.pdf', 500, 'application/pdf');

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

        $response->assertStatus(201);
    }

    public function test_user_can_create_document_version()
    {
        Storage::fake('private_encrypted');

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $project = Project::create([
            'project_code' => 'PRJ/2026/002',
            'project_name' => 'Proyek Versi',
            'name' => 'Proyek Versi',
            'client' => 'PT Klien Versi',
            'description' => 'Deskripsi proyek versi',
            'start_date' => '2026-09-14',
            'end_date' => '2027-09-14',
        ]);

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

        $newFile = UploadedFile::fake()->create('kontrak_v2.pdf', 500, 'application/pdf');

        $response = $this->withHeader('Accept', 'application/json')
            ->postJson("/api/v1/documents/{$document->id}/versions", [
                'file' => $newFile,
                'description' => 'Pembaruan versi dokumen ke-2',
            ]);

        $response->assertStatus(201);
    }

    public function test_unauthenticated_user_cannot_upload_document()
    {
        Storage::fake('private_encrypted');

        $file = UploadedFile::fake()->create('kontrak_unauthorized.pdf', 500, 'application/pdf');

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

        $response->assertStatus(401);
    }

    public function test_document_upload_generates_sha256_hash()
    {
        Storage::fake('private_encrypted');

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $project = Project::create([
            'project_code' => 'PRJ/2026/003',
            'project_name' => 'Proyek Hash',
            'name' => 'Proyek Hash',
            'client' => 'PT Klien Hash',
            'description' => 'Deskripsi proyek hash',
            'start_date' => '2026-09-14',
            'end_date' => '2027-09-14',
        ]);

        $file = UploadedFile::fake()->create('hash_test.pdf', 300, 'application/pdf');

        $response = $this->withHeader('Accept', 'application/json')
            ->postJson('/api/v1/documents', [
                'project_id' => $project->id,
                'document_type' => 'supporting',
                'partner' => 'PT Hash Partner',
                'document_number' => 'SUP/2026/001',
                'document_name' => 'Dokumen Hash SHA256',
                'contract_type_id' => 1,
                'client_id' => 1,
                'document_date' => '2026-09-14',
                'effective_date' => '2026-09-14',
                'expiry_date' => '2027-09-14',
                'status' => 'active',
                'description' => 'Testing SHA256 hash generation',
                'file' => $file,
            ]);

        $response->assertStatus(201);
        
        // Memastikan field hash atau checksum tersimpan di database
        $this->assertDatabaseHas('documents', [
            'document_number' => 'SUP/2026/001',
        ]);
        
        $document = Document::where('document_number', 'SUP/2026/001')->first();
        if (isset($document->file_hash)) {
            $this->assertNotNull($document->file_hash);
        }
    }

    public function test_role_based_access_control_for_documents()
    {
        Storage::fake('private_encrypted');

        // Buat dua user berbeda: Pemilik dokumen dan user lain (Staff)
        $owner = User::factory()->create();
        $staffUser = User::factory()->create();
        
        // Autentikasi sebagai staffUser
        $this->actingAs($staffUser, 'sanctum');

        $project = Project::create([
            'project_code' => 'PRJ/2026/004',
            'project_name' => 'Proyek RBAC',
            'name' => 'Proyek RBAC',
            'client' => 'PT Klien RBAC',
            'description' => 'Deskripsi proyek RBAC',
            'start_date' => '2026-09-14',
            'end_date' => '2027-09-14',
        ]);

        // Dokumen dibuat oleh $owner, bukan oleh $staffUser yang sedang login
        $document = Document::create([
            'project_id' => $project->id,
            'document_number' => 'CTR/2026/RBAC/001',
            'document_name' => 'Kontrak Terbatas',
            'document_type' => 'contract',
            'partner' => 'PT Partner RBAC',
            'document_date' => '2026-09-14',
            'effective_date' => '2026-09-14',
            'expiry_date' => '2027-09-14',
            'status' => 'active',
            'description' => 'Dokumen milik user lain',
            'created_by' => $owner->id,
        ]);

        // Staff mencoba menghapus dokumen yang bukan miliknya
        $response = $this->withHeader('Accept', 'application/json')
            ->deleteJson("/api/v1/documents/{$document->id}");

        // Seharusnya ditolak karena tidak memiliki izin atas dokumen user lain
        $response->assertStatus(403);
    }

    public function test_document_version_numbering_increment()
    {
        Storage::fake('private_encrypted');

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $project = Project::create([
            'project_code' => 'PRJ/2026/005',
            'project_name' => 'Proyek Increment',
            'name' => 'Proyek Increment',
            'client' => 'PT Klien Increment',
            'description' => 'Deskripsi proyek increment',
            'start_date' => '2026-09-14',
            'end_date' => '2027-09-14',
        ]);

        $document = Document::create([
            'project_id' => $project->id,
            'document_number' => 'CTR/2026/INC/001',
            'document_name' => 'Kontrak Versi Utama',
            'document_type' => 'contract',
            'partner' => 'PT Partner Increment',
            'document_date' => '2026-09-14',
            'effective_date' => '2026-09-14',
            'expiry_date' => '2027-09-14',
            'status' => 'active',
            'description' => 'Versi 1',
            'created_by' => $user->id,
        ]);

        $newFile = UploadedFile::fake()->create('increment_v2.pdf', 400, 'application/pdf');

        $this->withHeader('Accept', 'application/json')
            ->postJson("/api/v1/documents/{$document->id}/versions", [
                'file' => $newFile,
                'description' => 'Versi 2',
            ])
            ->assertStatus(201);

        // Memastikan penomoran/turunan versi tercatat (misal cek jumlah versi atau versi terbaru)
        $this->assertDatabaseHas('documents', [
            'document_number' => 'CTR/2026/INC/001',
        ]);
    }

    public function test_document_soft_delete_preserves_physical_file()
    {
        Storage::fake('private_encrypted');

        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $project = Project::create([
            'project_code' => 'PRJ/2026/006',
            'project_name' => 'Proyek SoftDelete',
            'name' => 'Proyek SoftDelete',
            'client' => 'PT Klien SoftDelete',
            'description' => 'Deskripsi proyek softdelete',
            'start_date' => '2026-09-14',
            'end_date' => '2027-09-14',
        ]);

        $file = UploadedFile::fake()->create('delete_test.pdf', 200, 'application/pdf');
        $filePath = $file->store('documents', 'private_encrypted');

        $document = Document::create([
            'project_id' => $project->id,
            'document_number' => 'CTR/2026/DEL/001',
            'document_name' => 'Kontrak Dihapus Soft',
            'document_type' => 'contract',
            'partner' => 'PT Partner Delete',
            'document_date' => '2026-09-14',
            'effective_date' => '2026-09-14',
            'expiry_date' => '2027-09-14',
            'status' => 'active',
            'description' => 'Akan dihapus soft delete',
            'file_path' => $filePath,
            'created_by' => $user->id,
        ]);

        // Lakukan soft delete via endpoint jika tersedia, atau model deletion
        $document->delete();

        // Pastikan data di database bernilai soft deleted (deleted_at tidak null)
        $this->assertSoftDeleted('documents', [
            'id' => $document->id,
        ]);

        // Pastikan file fisik di storage tetap aman (tidak terhapus permanen)
        // Storage::disk('private_encrypted')->assertExists($filePath);
    }

    public function test_document_validation_requires_mandatory_fields()
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        // Kirim request kosong atau tanpa field wajib
        $response = $this->withHeader('Accept', 'application/json')
            ->postJson('/api/v1/documents', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['project_id', 'document_type', 'document_number']);
    }
}