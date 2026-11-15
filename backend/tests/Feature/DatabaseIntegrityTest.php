<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_number_can_be_reused_after_soft_delete(): void
    {
        [$project, $user] = $this->makeProjectAndUser();

        $first = Document::create($this->documentAttributes($project, $user, 'DOC-REUSE-001'));
        $first->delete();

        $second = Document::create($this->documentAttributes($project, $user, 'DOC-REUSE-001'));

        $this->assertNotSame($first->id, $second->id);
        $this->assertSame('DOC-REUSE-001', $second->fresh()->document_number);
        $this->assertSoftDeleted($first);
    }

    public function test_every_foreign_key_column_has_an_index(): void
    {
        $missing = DB::select(<<<'SQL'
            SELECT c.conrelid::regclass AS table_name, a.attname AS column_name
            FROM pg_constraint c
            JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) ON true
            JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
            WHERE c.contype = 'f'
              AND NOT EXISTS (
                  SELECT 1
                  FROM pg_index i
                  WHERE i.indrelid = c.conrelid
                    AND i.indkey[0] = k.attnum
              )
            ORDER BY table_name, column_name
        SQL);

        $this->assertSame([], $missing, 'Setiap kolom foreign key harus memiliki index.');
    }

    public function test_soft_delete_unique_indexes_are_partial(): void
    {
        $indexes = DB::select(<<<'SQL'
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname IN (
                  'documents_document_number_active_unique',
                  'projects_project_code_active_unique',
                  'contract_types_code_active_unique'
              )
            ORDER BY indexname
        SQL);

        $this->assertCount(3, $indexes);

        foreach ($indexes as $index) {
            $this->assertStringContainsString('WHERE (deleted_at IS NULL)', $index->indexdef);
        }
    }

    /**
     * @return array{0: Project, 1: User}
     */
    private function makeProjectAndUser(): array
    {
        $project = Project::create([
            'project_code' => 'PRJ-REUSE',
            'project_name' => 'Proyek Uji',
            'client' => 'Klien Uji',
            'start_date' => '2026-01-01',
            'status' => 'active',
        ]);

        $user = User::create([
            'name' => 'Pengguna Uji',
            'email' => 'integritas@example.test',
            'password' => 'password-rahasia',
        ]);

        return [$project, $user];
    }

    /**
     * @return array<string, mixed>
     */
    private function documentAttributes(Project $project, User $user, string $number): array
    {
        return [
            'project_id' => $project->id,
            'document_number' => $number,
            'document_name' => 'Dokumen Uji',
            'document_type' => 'contract',
            'partner' => 'Mitra Uji',
            'document_date' => '2026-01-01',
            'effective_date' => '2026-01-01',
            'expiry_date' => '2026-12-31',
            'status' => 'active',
            'created_by' => $user->id,
        ];
    }
}
