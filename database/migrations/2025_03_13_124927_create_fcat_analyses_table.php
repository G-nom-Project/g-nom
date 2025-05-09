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
        Schema::create('fcat_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assembly_id')->constrained()->cascadeOnDelete();
            $table->integer('m1_similar');
            $table->float('m1_similarPercent');
            $table->integer('m1_dissimilar');
            $table->float('m1_dissimilarPercent');
            $table->integer('m1_duplicated');
            $table->float('m1_duplicatedPercent');
            $table->integer('m1_missing');
            $table->float('m1_missingPercent');
            $table->integer('m1_ignored');
            $table->float('m1_ignoredPercent');
            // M2
            $table->integer('m2_similar');
            $table->float('m2_similarPercent');
            $table->integer('m2_dissimilar');
            $table->float('m2_dissimilarPercent');
            $table->integer('m2_duplicated');
            $table->float('m2_duplicatedPercent');
            $table->integer('m2_missing');
            $table->float('m2_missingPercent');
            $table->integer('m2_ignored');
            $table->float('m2_ignoredPercent');
            // M3
            $table->integer('m3_similar');
            $table->float('m3_similarPercent');
            $table->integer('m3_dissimilar');
            $table->float('m3_dissimilarPercent');
            $table->integer('m3_duplicated');
            $table->float('m3_duplicatedPercent');
            $table->integer('m3_missing');
            $table->float('m3_missingPercent');
            $table->integer('m3_ignored');
            $table->float('m3_ignoredPercent');
            // M4
            $table->integer('m4_similar');
            $table->float('m4_similarPercent');
            $table->integer('m4_dissimilar');
            $table->float('m4_dissimilarPercent');
            $table->integer('m4_duplicated');
            $table->float('m4_duplicatedPercent');
            $table->integer('m4_missing');
            $table->float('m4_missingPercent');
            $table->integer('m4_ignored');
            $table->float('m4_ignoredPercent');
            // Global
            $table->integer('total');
            $table->string('genomeID');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fcat_analyses');
    }
};
