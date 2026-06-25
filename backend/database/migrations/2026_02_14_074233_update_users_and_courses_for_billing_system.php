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
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('subscription_started_at')->nullable()->after('sub_status');
            $table->unsignedInteger('monthly_spent_egp')->default(0)->after('subscription_started_at');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('is_full_course')->default(false)->after('completed');
            $table->timestamp('full_completed_at')->nullable()->after('is_full_course');
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->unsignedInteger('plan_limit')->default(0)->after('plan_id');
            $table->unsignedInteger('plan_price')->default(0)->after('plan_limit');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['subscription_started_at', 'monthly_spent_egp']);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn(['is_full_course', 'full_completed_at']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['plan_limit', 'plan_price']);
        });
    }
};
