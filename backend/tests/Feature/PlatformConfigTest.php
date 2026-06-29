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

    public function test_public_platform_config_endpoint_returns_config(): void
    {
        $response = $this->getJson('/api/platform-config');

        $response->assertOk()
            ->assertJsonPath('course_creation_enabled', true)
            ->assertJsonPath('all_languages_free', false)
            ->assertJsonPath('video_courses_enabled', true);
    }

    public function test_admin_can_update_platform_config(): void
    {
        $admin = \App\Models\User::factory()->create(['role' => 'admin']);
        $token = auth('api')->login($admin);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/admin/platform-config', [
                'all_languages_free' => true,
                'video_courses_free' => true,
                'free_languages' => ['English', 'Arabic'],
                'free_course_types' => ['Theory & Image Course', 'Video & Theory Course'],
            ]);

        $response->assertOk()
            ->assertJsonPath('all_languages_free', true)
            ->assertJsonPath('video_courses_free', true);

        $this->assertTrue(\App\Models\PlatformSetting::currentConfig()['all_languages_free']);
    }

    public function test_non_admin_cannot_update_platform_config(): void
    {
        $user = \App\Models\User::factory()->create(['role' => 'user']);
        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/admin/platform-config', [
                'all_languages_free' => true,
            ]);

        $response->assertForbidden();
    }

    public function test_course_generation_can_be_disabled(): void
    {
        \App\Models\PlatformSetting::updateConfig(['course_creation_enabled' => false]);
        $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Device-ID', 'test-device-id')
            ->postJson('/api/generate-course', [
                'topic' => 'Python',
                'type' => 'Theory & Image Course',
                'language' => 'English',
                'numModules' => 5,
            ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'platform.course_creation_disabled');
    }

    public function test_free_user_cannot_generate_locked_language(): void
    {
        \App\Models\PlatformSetting::updateConfig([
            'all_languages_free' => false,
            'free_languages' => ['English'],
        ]);
        $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Device-ID', 'test-device-id')
            ->postJson('/api/generate-course', [
                'topic' => 'Python',
                'type' => 'Theory & Image Course',
                'language' => 'Arabic',
                'numModules' => 5,
            ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'platform.language_requires_upgrade');
    }

    public function test_free_user_can_generate_language_when_marked_free(): void
    {
        \App\Models\PlatformSetting::updateConfig([
            'free_languages' => ['English', 'Arabic'],
        ]);
        $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
        $token = auth('api')->login($user);

        $this->mock(\App\Services\CourseService::class, function ($mock) {
            $mock->shouldReceive('generateOutline')->once()->andReturn([
                'title' => 'Python',
                'chapters' => [],
            ]);
        });

        $this->mock(\App\Services\CurriculumValidator::class, function ($mock) {
            $mock->shouldReceive('normalize')->andReturnUsing(fn ($value) => $value);
        });

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Device-ID', 'test-device-id')
            ->postJson('/api/generate-course', [
                'topic' => 'Python',
                'type' => 'Theory & Image Course',
                'language' => 'Arabic',
                'numModules' => 5,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_free_user_cannot_generate_locked_video_course(): void
    {
        \App\Models\PlatformSetting::updateConfig([
            'video_courses_enabled' => true,
            'video_courses_free' => false,
            'free_course_types' => ['Theory & Image Course'],
        ]);
        $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Device-ID', 'test-device-id')
            ->postJson('/api/generate-course', [
                'topic' => 'Python',
                'type' => 'Video & Theory Course',
                'language' => 'English',
                'numModules' => 5,
            ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'platform.course_type_requires_upgrade');
    }

    public function test_free_user_cannot_generate_locked_level(): void
    {
        \App\Models\PlatformSetting::updateConfig([
            'enabled_levels' => ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
            'free_levels' => ['Beginner', 'Intermediate', 'Advanced'],
        ]);
        $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Device-ID', 'test-device-id')
            ->postJson('/api/generate-course', [
                'topic' => 'Python',
                'type' => 'Theory & Image Course',
                'language' => 'English',
                'numModules' => 5,
                'level' => 'Professional',
            ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'platform.level_requires_upgrade');
    }

    public function test_free_user_cannot_generate_locked_depth(): void
    {
        \App\Models\PlatformSetting::updateConfig([
            'enabled_depths' => [5, 10],
            'free_depth_limit' => 5,
        ]);
        $user = \App\Models\User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
        $token = auth('api')->login($user);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Device-ID', 'test-device-id')
            ->postJson('/api/generate-course', [
                'topic' => 'Python',
                'type' => 'Theory & Image Course',
                'language' => 'English',
                'numModules' => 10,
                'level' => 'Beginner',
            ]);

        $response->assertForbidden()
            ->assertJsonPath('message', 'platform.depth_requires_upgrade');
    }

    public function test_public_config_excludes_admin_only_fields(): void
    {
        $response = $this->getJson('/api/platform-config');

        $response->assertOk()
            ->assertJsonMissingPath('secret_private_key');
    }
}
