<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Menggunakan IF NOT EXISTS agar aman jika indeks sudah ada sebelumnya di PostgreSQL
        DB::statement('CREATE INDEX IF NOT EXISTS documents_project_id_index ON documents (project_id);');
        DB::statement('CREATE INDEX IF NOT EXISTS documents_expiry_date_index ON documents (expiry_date);');
        DB::statement('CREATE INDEX IF NOT EXISTS documents_status_index ON documents (status);');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropIndex(['project_id']);
            $table->dropIndex(['expiry_date']);
            $table->dropIndex(['status']);
        });
    }
};