<?php

namespace Tests\Feature;

use App\DTO\CreateDocumentData;
use App\DTO\CreateDocumentVersionData;
use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use App\Services\DocumentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use ReflectionMethod;
use Tests\TestCase;

class ServiceDomainTest extends TestCase
{
    use RefreshDatabase;

    public function test_service_methods_do_not_accept_raw_arrays(): void
    {
        $files = File::allFiles(app_path('Services'));

        $this->assertNotEmpty($files, 'Tidak ada source code service yang diperiksa.');

        foreach ($files as $file) {
            $this->assertDoesNotMatchRegularExpression(
                '/function\s+\w+\s*\([^)]*\barray\s+\$/s',
                $file->getContents(),
                "{$file->getRelativePathname()} masih menerima array mentah; gunakan DTO."
            );
        }
    }

    public function test_document_service_uses_dtos_for_its_public_contract(): void
    {
        $createDocument = new ReflectionMethod(DocumentService::class, 'createDocument');
        $addVersion = new ReflectionMethod(DocumentService::class, 'addVersion');

        $this->assertSame(
            CreateDocumentData::class,
            $createDocument->getParameters()[0]->getType()?->getName()
        );

        $this->assertSame(
            CreateDocumentVersionData::class,
            $addVersion->getParameters()[1]->getType()?->getName()
        );
    }

    public function test_posting_same_document_twice_without_idempotency_key_creates_one_document(): void
    {
        Storage::fake('private_encrypted');

        $admin = User::factory()->create(['role' => 'admin']);
        $project = $this->createProject();

        $payload = $this->documentPayload($project);

        $first = $this->actingAs($admin)
            ->postJson('/api/v1/documents', $payload + [
                'file' => UploadedFile::fake()->create('kontrak-idempotent.pdf', 500, 'application/pdf'),
            ]);

        $first->assertStatus(201);

        $second = $this->actingAs($admin)
            ->postJson('/api/v1/documents', $payload + [
                'file' => UploadedFile::fake()->create('kontrak-idempotent.pdf', 500, 'application/pdf'),
            ]);

        $second->assertStatus(201)
            ->assertHeader('Idempotency-Replayed', 'true');

        $this->assertDatabaseCount('documents', 1);
        $this->assertDatabaseCount('document_versions', 1);
    }

    public function test_posting_same_document_twice_with_idempotency_key_replays_the_response(): void
    {
        Storage::fake('private_encrypted');

        $admin = User::factory()->create(['role' => 'admin']);
        $project = $this->createProject();

        $payload = $this->documentPayload($project);

        $first = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'document-create-001')
            ->postJson('/api/v1/documents', $payload + [
                'file' => UploadedFile::fake()->create('kontrak-key.pdf', 500, 'application/pdf'),
            ]);

        $first->assertStatus(201);
        $documentNumber = $first->json('data.document_number');

        $second = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'document-create-001')
            ->postJson('/api/v1/documents', $payload + [
                'file' => UploadedFile::fake()->create('kontrak-key.pdf', 500, 'application/pdf'),
            ]);

        $second->assertStatus(201)
            ->assertHeader('Idempotency-Replayed', 'true')
            ->assertJsonPath('data.document_number', $documentNumber);

        $this->assertDatabaseCount('documents', 1);
        $this->assertDatabaseCount('document_versions', 1);
    }

    public function test_same_idempotency_key_with_different_payload_returns_conflict(): void
    {
        Storage::fake('private_encrypted');

        $admin = User::factory()->create(['role' => 'admin']);
        $project = $this->createProject();

        $firstPayload = $this->documentPayload($project);

        $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'document-create-conflict')
            ->postJson('/api/v1/documents', $firstPayload + [
                'file' => UploadedFile::fake()->create('kontrak-conflict.pdf', 500, 'application/pdf'),
            ])
            ->assertStatus(201);

        $secondPayload = array_merge($firstPayload, [
            'document_number' => 'DOC/IDEMPOTENT/002',
            'document_name' => 'Payload Berbeda',
        ]);

        $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'document-create-conflict')
            ->postJson('/api/v1/documents', $secondPayload + [
                'file' => UploadedFile::fake()->create('kontrak-conflict.pdf', 500, 'application/pdf'),
            ])
            ->assertStatus(409);

        $this->assertDatabaseCount('documents', 1);
    }

    public function test_posting_same_document_version_twice_creates_one_version(): void
    {
        Storage::fake('private_encrypted');

        $admin = User::factory()->create(['role' => 'admin']);
        $project = $this->createProject();
        $document = $this->createDocument($project, $admin);

        $payload = [
            'version_number' => 'v2.0',
            'notes' => 'Revisi kedua kontrak.',
        ];

        $first = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'document-version-001')
            ->postJson("/api/v1/documents/{$document->id}/versions", $payload + [
                'file' => UploadedFile::fake()->create('kontrak-v2.pdf', 500, 'application/pdf'),
            ]);

        $first->assertStatus(201);

        $second = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'document-version-001')
            ->postJson("/api/v1/documents/{$document->id}/versions", $payload + [
                'file' => UploadedFile::fake()->create('kontrak-v2.pdf', 500, 'application/pdf'),
            ]);

        $second->assertStatus(201)
            ->assertHeader('Idempotency-Replayed', 'true');

        $this->assertSame(1, $document->versions()->count());
    }

    public function test_creating_same_user_twice_with_idempotency_key_creates_one_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $payload = [
            'name' => 'Pengguna Idempotent',
            'email' => 'idempotent-user@arsipkontrak.local',
            'password' => 'password-rahasia',
            'role' => 'viewer',
        ];

        $first = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'user-create-001')
            ->postJson('/api/v1/admin/users', $payload);

        $first->assertStatus(201);

        $second = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'user-create-001')
            ->postJson('/api/v1/admin/users', $payload);

        $second->assertStatus(201)
            ->assertHeader('Idempotency-Replayed', 'true');

        $this->assertSame(
            1,
            User::where('email', 'idempotent-user@arsipkontrak.local')->count()
        );
    }

    public function test_restoring_same_document_twice_has_one_effect(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $project = $this->createProject();
        $document = $this->createDocument($project, $admin);
        $document->delete();

        $first = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'document-restore-001')
            ->postJson("/api/v1/documents/{$document->id}/restore");

        $first->assertStatus(200);

        $second = $this->actingAs($admin)
            ->withHeader('Idempotency-Key', 'document-restore-001')
            ->postJson("/api/v1/documents/{$document->id}/restore");

        $second->assertStatus(200)
            ->assertHeader('Idempotency-Replayed', 'true');

        $this->assertNull($document->fresh()->deleted_at);
        $this->assertDatabaseCount('documents', 1);
    }

    private function createProject(): Project
    {
        return Project::create([
            'project_code' => 'PRJ-IDEMPOTENT-001',
            'project_name' => 'Proyek Idempotency',
            'client' => 'PT Uji Idempotency',
            'description' => 'Proyek untuk pengujian service dan idempotency.',
            'start_date' => '2026-01-01',
            'end_date' => '2027-12-31',
            'status' => 'active',
        ]);
    }

    private function createDocument(Project $project, User $admin): Document
    {
        return Document::create([
            'project_id' => $project->id,
            'document_number' => 'DOC/IDEMPOTENT/001',
            'document_name' => 'Dokumen Idempotency',
            'document_type' => 'contract',
            'partner' => 'PT Uji Idempotency',
            'document_date' => '2026-01-01',
            'effective_date' => '2026-01-01',
            'expiry_date' => '2027-12-31',
            'status' => 'active',
            'description' => 'Dokumen untuk pengujian versi.',
            'created_by' => $admin->id,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function documentPayload(Project $project): array
    {
        return [
            'project_id' => $project->id,
            'document_number' => 'DOC/IDEMPOTENT/001',
            'document_name' => 'Kontrak Idempotent',
            'document_type' => 'contract',
            'partner' => 'PT Uji Idempotency',
            'document_date' => '2026-01-01',
            'effective_date' => '2026-01-01',
            'expiry_date' => '2027-12-31',
            'status' => 'active',
            'description' => 'Pengujian idempotency mutasi dokumen.',
        ];
    }
}
