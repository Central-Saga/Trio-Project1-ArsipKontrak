<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Menambahkan index untuk seluruh kolom foreign key dan mengganti unique
     * constraint biasa dengan partial unique index yang kompatibel SoftDeletes.
     */
    public function up(): void
    {
        $indexes = [
            'activity_logs_user_id_index' => 'activity_logs (user_id)',
            'activity_logs_document_id_index' => 'activity_logs (document_id)',
            'document_versions_document_id_index' => 'document_versions (document_id)',
            'document_versions_uploaded_by_index' => 'document_versions (uploaded_by)',
            'documents_created_by_index' => 'documents (created_by)',
            'notifications_recipient_user_id_index' => 'notifications (recipient_user_id)',
        ];

        foreach ($indexes as $name => $target) {
            DB::statement("CREATE INDEX IF NOT EXISTS {$name} ON {$target};");
        }

        // Foreign key pada sessions tidak memiliki index eksplisit di PostgreSQL.
        // Hapus seluruh FK user_id (termasuk sisa constraint lama) lalu buat satu
        // constraint yang bernama pasti, diikuti index kolomnya.
        DB::statement(<<<'SQL'
            DO $$
            DECLARE constraint_name text;
            BEGIN
                FOR constraint_name IN
                    SELECT conname
                    FROM pg_constraint
                    WHERE conrelid = 'sessions'::regclass
                      AND contype = 'f'
                      AND conkey = ARRAY[
                          (SELECT attnum FROM pg_attribute
                           WHERE attrelid = 'sessions'::regclass AND attname = 'user_id')
                      ]
                LOOP
                    EXECUTE format('ALTER TABLE sessions DROP CONSTRAINT %I', constraint_name);
                END LOOP;
            END $$;
        SQL);
        DB::statement(
            'ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_foreign '.
            'FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;'
        );
        DB::statement('CREATE INDEX IF NOT EXISTS sessions_user_id_index ON sessions (user_id);');

        // Unique index parsial: nomor/kode hanya unik untuk baris yang belum
        // di-soft-delete, sehingga nomor lama boleh dipakai kembali.
        $this->replaceUniqueWithPartial('documents', 'document_number', 'documents_document_number_unique');
        $this->replaceUniqueWithPartial('projects', 'project_code', 'projects_project_code_unique');
        $this->replaceUniqueWithPartial('contract_types', 'code', 'contract_types_code_unique');
    }

    public function down(): void
    {
        $this->restoreFullUnique('documents', 'document_number', 'documents_document_number_unique');
        $this->restoreFullUnique('projects', 'project_code', 'projects_project_code_unique');
        $this->restoreFullUnique('contract_types', 'code', 'contract_types_code_unique');

        DB::statement('ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_foreign;');

        foreach ([
            'activity_logs_user_id_index',
            'activity_logs_document_id_index',
            'document_versions_document_id_index',
            'document_versions_uploaded_by_index',
            'documents_created_by_index',
            'notifications_recipient_user_id_index',
            'sessions_user_id_index',
        ] as $name) {
            DB::statement("DROP INDEX IF EXISTS {$name};");
        }
    }

    private function replaceUniqueWithPartial(string $table, string $column, string $constraint): void
    {
        $index = "{$table}_{$column}_active_unique";

        DB::statement("ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS {$constraint};");
        DB::statement(
            "CREATE UNIQUE INDEX IF NOT EXISTS {$index} ON {$table} ({$column}) ".
            'WHERE deleted_at IS NULL;'
        );
    }

    private function restoreFullUnique(string $table, string $column, string $constraint): void
    {
        $index = "{$table}_{$column}_active_unique";

        DB::statement("DROP INDEX IF EXISTS {$index};");
        DB::statement("ALTER TABLE {$table} ADD CONSTRAINT {$constraint} UNIQUE ({$column});");
    }
};
