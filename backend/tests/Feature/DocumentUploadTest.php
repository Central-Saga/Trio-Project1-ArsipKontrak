<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentUploadTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Mock user autentikasi
        $this->user = User::factory()->create([
            'email' => 'admin@arsipkontrak.local',
        ]);

        // 2. Project dummy
        $this->project = Project::create([
            'project_code' => 'PRJ-2026-001',
            'project_name' => 'Pengembangan Sistem Arsip Digital',
            'client'       => 'Internal Corporate',
            'description'  => 'Project repositori arsip kontrak digital tahun 2026',
            'start_date'   => '2026-01-01',
            'end_date'     => '2026-12-31',
            'status'       => 'active',
        ]);
    }

    public function test_can_upload_contract_document_with_initial_version_and_sha256_hash(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->create('kontrak_kerjasama.pdf', 1024, 'application/pdf');

        $payload = [
            'project_id'      => $this->project->id,
            'document_number' => 'DOC/TEST/2026/001',
            'document_name'   => 'Perjanjian Kerjasama Pengadaan',
            'document_type'   => 'contract',
            'partner'         => 'PT Mitra Digital Prima',
            'document_date'   => '2026-09-08',
            'effective_date'  => '2026-09-10',
            'expiry_date'     => '2027-09-10',
            'status'          => 'active',
            'description'     => 'Uji coba upload dokumen kontrak',
            'file'            => $file,
            'notes'           => 'Initial commit kontrak',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/documents', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.document_number', 'DOC/TEST/2026/001')
            ->assertJsonPath('data.current_version.version_number', 'v1.0')
            ->assertJsonPath('data.current_version.is_current', true);

        // Verifikasi entri database PostgreSQL
        $this->assertDatabaseHas('documents', [
            'project_id'      => $this->project->id,
            'document_number' => 'DOC/TEST/2026/001',
            'document_type'   => 'contract',
            'status'          => 'active',
        ]);

        $this->assertDatabaseHas('document_versions', [
            'version_number' => 'v1.0',
            'is_current'     => true,
        ]);

        // Verifikasi fisik file tersimpan di storage lokal
        $documentVersion = DocumentVersion::first();
        Storage::disk('local')->assertExists($documentVersion->file_path);

        // Verifikasi integritas hash SHA-256 (panjang 64 heksadesimal)
        $this->assertNotEmpty($documentVersion->file_hash);
        $this->assertEquals(64, strlen($documentVersion->file_hash));
    }

    public function test_cannot_upload_non_pdf_file(): void
    {
        Storage::fake('local');

        $file = UploadedFile::fake()->create('script_berbahaya.exe', 500, 'application/x-msdownload');

        $payload = [
            'project_id'      => $this->project->id,
            'document_number' => 'DOC/REJECT/001',
            'document_name'   => 'Dokumen Salah Format',
            'document_type'   => 'contract',
            'partner'         => 'Vendor Anonim',
            'document_date'   => '2026-09-08',
            'effective_date'  => '2026-09-10',
            'expiry_date'     => '2027-09-10',
            'file'            => $file,
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/v1documents', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_can_upload_new_version_and_updates_previous_version_current_flag(): void
    {
        Storage::fake('local');

        // 1. Dokumen awal (memenuhi not-null constraint PostgreSQL)
        $document = Document::create([
            'project_id'      => $this->project->id,
            'document_number' => 'DOC/VER/2026/002',
            'document_name'   => 'Dokumen Multi Versi',
            'document_type'   => 'mou',
            'partner'         => 'PT Sinergi Bangsa',
            'document_date'   => '2026-09-08',
            'effective_date'  => '2026-09-10',
            'expiry_date'     => '2027-09-10',
            'status'          => 'draft',
            'created_by'      => $this->user->id,
        ]);

        $v1File = UploadedFile::fake()->create('v1.pdf', 500, 'application/pdf');
        $v1Path = $v1File->store('documents/contracts', 'local');

        $v1 = DocumentVersion::create([
            'document_id'    => $document->id,
            'version_number' => 'v1.0',
            'file_name'      => 'v1.pdf',
            'file_path'      => $v1Path,
            'file_hash'      => hash_file('sha256', $v1File->getRealPath()),
            'file_size'      => $v1File->getSize(),
            'mime_type'      => 'application/pdf',
            'is_current'     => true,
            'uploaded_by'    => $this->user->id,
        ]);

        // 2. Upload revisi baru
        $v2File = UploadedFile::fake()->create('v2_revisi.pdf', 600, 'application/pdf');

        $response = $this->actingAs($this->user)
            ->postJson("/api/documents/{$document->id}/versions", [
                'file'           => $v2File,
                'version_number' => 'v2.0',
                'notes'          => 'Pembaruan klausul pasal 4',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.version_number', 'v2.0')
            ->assertJsonPath('data.is_current', true);

        // Verifikasi versi v1 diubah menjadi false
        $this->assertDatabaseHas('document_versions', [
            'id'         => $v1->id,
            'is_current' => false,
        ]);

        // Verifikasi versi v2 aktif (true)
        $this->assertDatabaseHas('document_versions', [
            'document_id'    => $document->id,
            'version_number' => 'v2.0',
            'is_current'     => true,
        ]);
    }
}