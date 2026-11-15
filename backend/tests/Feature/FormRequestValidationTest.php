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

class FormRequestValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_number_stays_reserved_after_soft_delete(): void
    {
        Storage::fake('private_encrypted');

        $admin = User::factory()->create(['role' => 'admin']);
        $project = $this->createProject();
        $trashedDocument = $this->createDocument(
            $project,
            $admin,
            'CTR/2026/TRASHED/001'
        );
        $trashedDocument->delete();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/documents', [
                'project_id' => $project->id,
                'document_number' => $trashedDocument->document_number,
                'document_name' => 'Dokumen Baru',
                'document_type' => 'contract',
                'partner' => 'PT Mitra Baru',
                'document_date' => '2026-09-14',
                'expiry_date' => '2027-09-14',
                'file' => UploadedFile::fake()->create(
                    'dokumen-baru.pdf',
                    200,
                    'application/pdf'
                ),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('document_number');

        $activeDocument = $this->createDocument(
            $project,
            $admin,
            'CTR/2026/ACTIVE/001'
        );

        $this->putJson(
            "/api/v1/documents/{$activeDocument->id}",
            ['document_number' => $trashedDocument->document_number]
        )
            ->assertUnprocessable()
            ->assertJsonValidationErrors('document_number');
    }

    public function test_soft_deleted_version_number_can_be_reused(): void
    {
        Storage::fake('private_encrypted');

        $admin = User::factory()->create(['role' => 'admin']);
        $document = $this->createDocument(
            $this->createProject(),
            $admin,
            'CTR/2026/VERSION/001'
        );

        $deletedVersion = DocumentVersion::create([
            'document_id' => $document->id,
            'version_number' => 'v2.0',
            'file_name' => 'versi-lama.pdf',
            'file_path' => 'documents/versi-lama.pdf',
            'file_hash' => str_repeat('a', 64),
            'file_size' => 200,
            'mime_type' => 'application/pdf',
            'is_current' => false,
            'uploaded_by' => $admin->id,
            'notes' => 'Versi lama',
        ]);
        $deletedVersion->delete();

        $this->actingAs($admin, 'sanctum')
            ->postJson("/api/v1/documents/{$document->id}/versions", [
                'version_number' => 'v2.0',
                'notes' => 'Versi pengganti',
                'file' => UploadedFile::fake()->create(
                    'versi-baru.pdf',
                    200,
                    'application/pdf'
                ),
            ])
            ->assertCreated();

        $this->assertSame(
            1,
            DocumentVersion::query()
                ->where('document_id', $document->id)
                ->where('version_number', 'v2.0')
                ->whereNull('deleted_at')
                ->count()
        );
    }

    public function test_update_rejects_expiry_before_document_date(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $document = $this->createDocument(
            $this->createProject(),
            $admin,
            'CTR/2026/UPDATE-DATE/001'
        );

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/v1/documents/{$document->id}", [
                'document_date' => '2026-09-14',
                'expiry_date' => '2026-09-13',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('expiry_date');

        $this->assertSame(
            '2027-01-01',
            $document->fresh()->expiry_date->toDateString()
        );
    }

    public function test_document_validation_matches_persisted_field_limits(): void
    {
        Storage::fake('private_encrypted');

        $admin = User::factory()->create(['role' => 'admin']);
        $project = $this->createProject();

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/documents', [
                'project_id' => $project->id,
                'document_number' => 'CTR/2026/INVALID/001',
                'document_name' => str_repeat('N', 201),
                'document_type' => 'other',
                'partner' => str_repeat('P', 151),
                'document_date' => '2026-09-14',
                'expiry_date' => '2027-09-14',
                'file' => UploadedFile::fake()->create(
                    'dokumen-invalid.pdf',
                    200,
                    'application/pdf'
                ),
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'document_name',
                'document_type',
                'partner',
            ]);
    }

    private function createProject(): Project
    {
        return Project::create([
            'project_code' => 'PRJ/2026/VALIDATION',
            'project_name' => 'Proyek Validasi',
            'client' => 'PT Klien Validasi',
            'description' => 'Fixture validasi FormRequest',
            'start_date' => '2026-01-01',
            'end_date' => '2027-01-01',
        ]);
    }

    private function createDocument(
        Project $project,
        User $user,
        string $documentNumber
    ): Document {
        return Document::create([
            'project_id' => $project->id,
            'document_number' => $documentNumber,
            'document_name' => 'Dokumen Validasi',
            'document_type' => 'contract',
            'partner' => 'PT Mitra Validasi',
            'document_date' => '2026-01-01',
            'effective_date' => '2026-01-01',
            'expiry_date' => '2027-01-01',
            'status' => 'active',
            'created_by' => $user->id,
        ]);
    }
}
