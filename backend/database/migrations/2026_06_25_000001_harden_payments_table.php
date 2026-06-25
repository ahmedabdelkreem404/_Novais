<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('plan_id')->nullable()->after('transaction_id');
            $table->string('provider_order_id')->nullable()->after('plan_id');
            $table->string('provider_transaction_id')->nullable()->after('provider_order_id');
            $table->timestamp('paid_at')->nullable()->after('status');
            $table->timestamp('failed_at')->nullable()->after('paid_at');
            $table->timestamp('cancelled_at')->nullable()->after('failed_at');
            $table->index(['user_id', 'status']);
            $table->unique('provider_order_id');
            $table->unique('provider_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['provider_order_id']);
            $table->dropUnique(['provider_transaction_id']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropColumn([
                'plan_id',
                'provider_order_id',
                'provider_transaction_id',
                'paid_at',
                'failed_at',
                'cancelled_at',
            ]);
        });
    }
};
