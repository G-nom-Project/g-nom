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

            // Link to Taxon
            $table->unsignedInteger('taxonID');
            $table->foreign('taxonID', 'taxon_geo_data_taxon_fk')
                ->references('ncbiTaxonID')
                ->on('taxa');
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
