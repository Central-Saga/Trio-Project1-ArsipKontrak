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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('restrict')->onUpdate('cascade');
            $table->string('document_number', 100)->unique();
            $table->string('document_name', 200);
            $table->enum('document_type', ['contract', 'mou', 'adendum', 'agreement', 'supporting']);
            $table->string('partner', 150);
            $table->date('document_date');
            $table->date('effective_date');
            $table->date('expiry_date')->index();
            $table->enum('status', ['draft', 'active', 'expired', 'terminated'])->index();
            $table->text('description')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict')->onUpdate('cascade');
            $table->softDeletes();
            $table->timestamps();
            $table->index('document_type');
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
