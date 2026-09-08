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
    Schema::create('activity_logs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('restrict');
        $table->foreignId('document_id')->nullable()->constrained('documents')->nullOnDelete();
        $table->string('action', 50)->index();
        $table->text('description')->nullable();
        $table->string('ip_address', 45)->nullable();
        $table->timestamp('created_at')->useCurrent()->index();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
