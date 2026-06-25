<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique('payments_provider_order_id_unique');
            $table->index('provider_order_id', 'payments_provider_order_id_index');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index(['user_id', 'status'], 'subscriptions_user_id_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex('subscriptions_user_id_status_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_provider_order_id_index');
            $table->unique('provider_order_id', 'payments_provider_order_id_unique');
        });
    }
};
