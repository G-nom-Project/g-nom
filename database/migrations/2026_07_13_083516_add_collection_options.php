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
        // Collection records
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->boolean('is_public')->default(false);
            // Owner
            $table->foreignId('user_id')->constrained();
            $table->timestamps();
        });

        // Collection membership (assemblies)
        Schema::create('collection_assembly', function (Blueprint $table) {
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assembly_id')->constrained()->cascadeOnDelete();
            $table->primary(['collection_id', 'assembly_id']);
            $table->timestamps();
        });

        // Collection membership (users)
        Schema::create('collection_user', function (Blueprint $table) {
            $table->foreignId('collection_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['collection_id', 'user_id']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
        Schema::dropIfExists('collections');
    }
};
