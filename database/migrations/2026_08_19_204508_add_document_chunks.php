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
        Schema::create('document_chunks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('chunk_index');

            $table->text('content');

            $table->string('section')->nullable();
            $table->string('type')->default('text');
            $table->jsonb('metadata')->nullable();
            $table->timestamps();
            $table->index(['document_id', 'chunk_index']);
            $table->vector('embedding', dimensions: config('ai.context_sizes.embeddings.result', 1024))->nullable();
        });

        Schema::create('document_chunk_element', function (Blueprint $table) {
            $table->foreignId('document_chunk_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('document_element_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedInteger('position');

            $table->primary([
                'document_chunk_id',
                'document_element_id',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('document_chunk_element');
        Schema::dropIfExists('document_chunks');
    }
};
