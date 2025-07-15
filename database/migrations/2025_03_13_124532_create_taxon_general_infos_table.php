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
        Schema::create('taxon_general_infos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('taxon_id')->references('ncbiTaxonID')->on('taxa')->cascadeOnDelete();;
            $table->string('label')->nullable();
            $table->string('headline')->nullable();
            $table->text('text')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('taxon_general_infos');
    }
};
