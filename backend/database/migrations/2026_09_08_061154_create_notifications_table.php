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
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            // Relasi ke dokumen terkait
            $table->foreignId('document_id')->constrained('documents')->cascadeOnDelete();
            
            // Relasi ke user penerima reminder (Project Manager / Doc Controller)
            $table->foreignId('recipient_user_id')->constrained('users')->cascadeOnDelete();
            
            // Tipe reminder sesuai PRD
            $table->enum('type', ['expiry_30', 'expiry_7', 'expired']);
            
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            // Sesuai PRD: Mencegah reminder duplikat untuk dokumen & penerima yang sama
            $table->unique(['document_id', 'recipient_user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};