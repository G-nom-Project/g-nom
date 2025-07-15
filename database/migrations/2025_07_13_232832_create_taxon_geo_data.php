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
        Schema::create('taxon_geo_data', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            $table->string('description')->nullable();
            $table->string('source_link');
            $table->string('data_link')->nullable();
            $table->json('data')->nullable(); // Nullable if hosted externally
            $table->unsignedInteger('taxon_ncbiTaxonID');
            $table->foreign('taxon_ncbiTaxonID')->references('ncbiTaxonID')->on('taxa')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxon_geo_data');
    }
};
