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
        // Overall table to track taXaminer analyses
        Schema::create('taxaminer_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assembly_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();
        });

        // Track user settings associated with taXaminer analyses
        Schema::create('taxaminer_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assembly_id')->constrained()->cascadeOnDelete();
            $table->foreignId('taxaminer_analysis_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->json('custom_fields')->default('[]');
            $table->json('selection')->default('[]');
            $table->timestamps();
        });

        // Store diamond hits from individual taXaminer analyses
        Schema::create('taxaminer_diamond_hits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('taxaminer_analysis_id')->constrained()->cascadeOnDelete();
            $table->string('qseqid');
            $table->string('sseqid');
            $table->float('pident');
            $table->bigInteger('length');
            $table->float('evalue');
            $table->float('bitscore');
            $table->string('staxids');
            $table->string('ssciname');
            $table->timestamps();

            // Speed up the retrieval of individual records
            $table->index(['taxaminer_analysis_id', 'qseqid']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('taxaminer_analyses');
        Schema::dropIfExists('taxaminer_settings');
        Schema::dropIfExists('taxaminer_diamond_hits');
    }
};
