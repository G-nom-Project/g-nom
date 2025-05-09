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
        //
        Schema::create('assemblies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('infoText')->nullable();
            $table->foreignId('taxon_id')->constrained();
            $table->integer('addedBy');
            $table->boolean('public')->default(false);
            $table->bigInteger('numberOfSequences')->default(0);
            $table->bigInteger('cumulativeSequenceLength')->default(0);
            $table->bigInteger('n50')->default(0);
            $table->bigInteger('n90')->default(0);
            $table->bigInteger('shortestSequence')->default(0);
            $table->bigInteger('longestSequence')->default(0);
            $table->float('medianSequence')->default(0);
            $table->float('meanSequence')->default(0);
            $table->float('gcPercent')->default(0);
            $table->float('gcPercentMasked')->default(0);
            $table->json('lengthDistributionString')->default('{}');
            $table->json('charCount')->default('{}');
            $table->string('label')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('assemblies');
    }
};
