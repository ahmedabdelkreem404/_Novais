<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('platform_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('platform_settings', 'group')) {
                $table->string('group')->default('platform')->after('value');
            }
            if (!Schema::hasColumn('platform_settings', 'is_public')) {
                $table->boolean('is_public')->default(true)->after('group');
            }
            if (!Schema::hasColumn('platform_settings', 'description')) {
                $table->text('description')->nullable()->after('is_public');
            }
        });

        Schema::create('content_blueprints', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->json('language_support')->nullable();
            $table->string('target_academic_level')->nullable();
            $table->json('output_structure');
            $table->json('required_sections')->nullable();
            $table->json('optional_sections')->nullable();
            $table->unsignedInteger('default_count')->default(5);
            $table->json('assessment_rules')->nullable();
            $table->json('media_rules')->nullable();
            $table->json('citation_rules')->nullable();
            $table->json('tone_rules')->nullable();
            $table->json('output_format_rules')->nullable();
            $table->text('prompt_instructions');
            $table->json('validation_schema')->nullable();
            $table->timestamps();
        });

        Schema::table('courses', function (Blueprint $table) {
            if (!Schema::hasColumn('courses', 'blueprint_slug')) {
                $table->string('blueprint_slug')->nullable()->after('type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            if (Schema::hasColumn('courses', 'blueprint_slug')) {
                $table->dropColumn('blueprint_slug');
            }
        });

        Schema::dropIfExists('content_blueprints');

        Schema::table('platform_settings', function (Blueprint $table) {
            foreach (['description', 'is_public', 'group'] as $column) {
                if (Schema::hasColumn('platform_settings', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
