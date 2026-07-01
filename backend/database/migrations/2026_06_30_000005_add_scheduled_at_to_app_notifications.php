<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('app_notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('app_notifications', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('published_at')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('app_notifications', function (Blueprint $table) {
            if (Schema::hasColumn('app_notifications', 'scheduled_at')) {
                $table->dropColumn('scheduled_at');
            }
        });
    }
};
