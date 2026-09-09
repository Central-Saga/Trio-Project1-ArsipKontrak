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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_code', 50)->inique();
            $table->string('project_name', 150);
            $table->string('client', 150);
            $table->text('description')->nullable9();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->enum('status', ['draft', 'active', 'complated','arived'])->default('draft');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
