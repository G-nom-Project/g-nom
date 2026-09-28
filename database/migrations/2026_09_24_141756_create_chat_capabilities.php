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
        Schema::create('chat_capabilities', function (Blueprint $table) {
            $table->string('agent_conversations_id', 36)->primary();

            $table->foreign('agent_conversations_id')
                ->references('id')
                ->on('agent_conversations')
                ->cascadeOnDelete();

            $table->integer('max_steps')->default(5);
            $table->integer('research_depth')->default(10);
            $table->json('active_capabilities')->default('[]');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_capabilities');
    }
};
