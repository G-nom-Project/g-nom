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
        Schema::create('taxa', function (Blueprint $table) {
            $table->integer('ncbiTaxonID')->primary();
            $table->integer('parentNcbiTaxonID');
            $table->string('scientificName');
            $table->string('taxonRank');
            $table->string('commonName')->nullable();
            $table->string('imageCredit')->nullable();
            $table->boolean('phylopic')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxa');
    }
};
