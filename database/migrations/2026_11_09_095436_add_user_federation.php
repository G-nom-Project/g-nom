<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('federated_users', function (Blueprint $table) {
            $table->foreignId('user_id')
                ->primary()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('provider_type', 32);
            $table->string('upstream_uid');

            $table->timestamps();

            // The same upstream identity can never be linked to two local users.
            $table->unique(['provider_type', 'upstream_uid']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_federated')->default(false);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('federated_users');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_federated');
        });
    }
};
