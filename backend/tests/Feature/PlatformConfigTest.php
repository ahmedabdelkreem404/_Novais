<?php

namespace Tests\Feature;

use App\Models\PlatformSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class PlatformConfigTest extends TestCase
{
    use RefreshDatabase;

    public function test_platform_settings_table_exists(): void
    {
        $this->assertTrue(Schema::hasTable('platform_settings'));
        $this->assertTrue(Schema::hasColumns('platform_settings', [
            'key',
            'value',
        ]));
    }

    public function test_platform_setting_defaults_are_available(): void
    {
        $config = PlatformSetting::currentConfig();

        $this->assertTrue($config['course_creation_enabled']);
        $this->assertFalse($config['all_languages_free']);
        $this->assertTrue($config['video_courses_enabled']);
        $this->assertFalse($config['video_courses_free']);
        $this->assertContains('English', $config['enabled_languages']);
        $this->assertContains('English', $config['free_languages']);
        $this->assertContains('Theory & Image Course', $config['enabled_course_types']);
        $this->assertContains('Theory & Image Course', $config['free_course_types']);
    }
}
