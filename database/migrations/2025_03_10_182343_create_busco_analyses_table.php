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
        Schema::create('busco_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assembly_id')->constrained()->cascadeOnDelete();
            $table->integer("analysis_id");
            $table->integer("completeSingle");
            $table->integer("completeDuplicated");
            $table->integer("fragmented");
            $table->integer("missing");
            $table->integer("total");
            $table->float("completeSinglePercent");
            $table->float("completeDuplicatedPercent");
            $table->float("fragmentedPercent");
            $table->float("missingPercent");
            $table->string("dataset")->nullable();
            $table->string("buscoMode")->nullable();
            $table->text("targetFile")->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('busco_analyses');
    }
};
