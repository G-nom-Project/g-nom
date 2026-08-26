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
        //
        Schema::create('documents', function (Blueprint $table) {
            $table->id();

            $table->string('title')->nullable();
            $table->text('abstract')->nullable();
            $table->json('authors')->nullable();
            $table->string('doi')->nullable();
            $table->string('file_path');
            $table->string('file_hash', 64)->unique();

            $table->foreignId('user_id')->constrained();

            // This is reserved for potential later use
            $table->jsonb('metadata')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('documents');
    }
};
