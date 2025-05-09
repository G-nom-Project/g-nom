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
        Schema::create('genomic_annotation_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('genomic_annotation_id')->constrained()->cascadeOnDelete();
            $table->string('seqID');
            $table->string('type');
            $table->integer('start');
            $table->integer('end');
            $table->json('attributes');
            $table->text('source');
            $table->float('score');
            $table->string('strand')    ;
            $table->smallInteger('phase')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('genomic_annotation_features');
    }
};
