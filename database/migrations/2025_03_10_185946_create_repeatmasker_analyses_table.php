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
        Schema::create('repeatmasker_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assembly_id')->constrained()->cascadeOnDelete();
            $table->integer("sines");
            $table->integer("sines_length");
            $table->integer("lines");
            $table->integer("lines_length");
            $table->integer("ltr_elements");
            $table->integer("ltr_elements_length");
            $table->integer("dna_elements");
            $table->integer("dna_elements_length");
            $table->integer("unclassified");
            $table->integer("unclassified_length");
            $table->integer("rolling_circles");
            $table->integer("rolling_circles_length");
            $table->integer("small_rna");
            $table->integer("small_rna_length");
            $table->integer("satellites");
            $table->integer("satellites_length");
            $table->integer("simple_repeats");
            $table->integer("simple_repeats_length");
            $table->integer("low_complexity");
            $table->integer("low_complexity_length");
            $table->float("total_non_repetitive_length_percent");
            $table->integer("total_non_repetitive_length");
            $table->float("total_repetitive_length_percent");
            $table->integer("total_repetitive_length");
            $table->integer("numberN");
            $table->float("percentN");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('repeatmasker_analyses');
    }
};
