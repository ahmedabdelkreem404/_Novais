<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('content_blueprints', function (Blueprint $table) {
            if (! Schema::hasColumn('content_blueprints', 'form_schema')) {
                $table->json('form_schema')->nullable()->after('validation_schema');
            }
        });
    }

    public function down(): void
    {
        Schema::table('content_blueprints', function (Blueprint $table) {
            if (Schema::hasColumn('content_blueprints', 'form_schema')) {
                $table->dropColumn('form_schema');
            }
        });
    }
};
