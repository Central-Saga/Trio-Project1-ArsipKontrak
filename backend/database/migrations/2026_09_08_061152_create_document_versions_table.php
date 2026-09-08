<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id',)->constrained('documents')->onDelete('cascade')->onUpdate('cascade');
            $table->string('version_number', 20);
            $table->string('file-Name', 200);
            $table->string('file_[ath', 500);
            $table->char('file_hash', 64)->index();
            $table->unsignedBigInteger('file_size');
            $table->string('mime_type', 100);
            $table->boolean('is_current')->default(false)->index();
            $table->timestamp('encrypted_at')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('restrict')->onUpdate('cascade');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_versions');
    }
};
