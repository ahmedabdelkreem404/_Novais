<?php

namespace Tests\Feature;

use App\Models\ContentBlueprint;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\CourseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContentBlueprintTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_endpoint_returns_enabled_blueprints_only(): void
    {
        ContentBlueprint::create(ContentBlueprint::defaults()[0]);
        ContentBlueprint::create(array_merge(ContentBlueprint::defaults()[2], [
            'slug' => 'disabled-exam',
            'enabled' => false,
        ]));

        $response = $this->getJson('/api/content-blueprints');

        $response->assertOk()
            ->assertJsonFragment(['slug' => 'normal-course'])
            ->assertJsonMissing(['slug' => 'disabled-exam'])
            ->assertJsonMissingPath('0.prompt_instructions');
    }

    public function test_default_blueprints_cover_supported_product_types(): void
    {
        $slugs = collect(ContentBlueprint::defaults())->pluck('slug')->all();

        $this->assertEqualsCanonicalizing([
            'normal-course',
            'leveled-course',
            'interactive-practical-course',
            'academic-course',
            'study-review',
            'question-bank',
            'exam-builder',
            'book',
            'story',
            'graduation-project',
            'master-thesis',
            'lesson-plan',
            'assignment-builder',
            'project-based-learning',
        ], $slugs);
    }

    public function test_normal_user_cannot_manage_blueprints(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $token = auth('api')->login($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/admin/content-blueprints')
            ->assertForbidden();
    }

    public function test_admin_can_create_update_and_disable_blueprint(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $token = auth('api')->login($admin);

        $payload = array_merge(ContentBlueprint::defaults()[0], [
            'name' => 'Custom Lab',
            'slug' => 'custom-lab',
        ]);

        $created = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/content-blueprints', $payload)
            ->assertCreated()
            ->assertJsonPath('slug', 'custom-lab')
            ->json();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson('/api/admin/content-blueprints/'.$created['id'], array_merge($payload, [
                'enabled' => false,
                'prompt_instructions' => 'Updated instructions.',
            ]))
            ->assertOk()
            ->assertJsonPath('enabled', false);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson('/api/admin/content-blueprints/'.$created['id'])
            ->assertOk()
            ->assertJsonPath('disabled', true);
    }

    public function test_disabled_blueprint_is_rejected_for_generation(): void
    {
        ContentBlueprint::create(array_merge(ContentBlueprint::defaults()[0], [
            'enabled' => false,
        ]));

        $user = User::factory()->create(['role' => 'premium', 'sub_status' => 'premium']);
        $token = auth('api')->login($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Device-ID', 'test-device-id')
            ->postJson('/api/generate-course', [
                'topic' => 'Python',
                'type' => 'Theory & Image Course',
                'language' => 'English',
                'numModules' => 5,
                'blueprint_slug' => 'normal-course',
            ])
            ->assertForbidden()
            ->assertJsonPath('message', 'platform.blueprint_disabled');
    }

    public function test_generation_accepts_blueprint_fields_and_egyptian_arabic(): void
    {
        ContentBlueprint::create(collect(ContentBlueprint::defaults())
            ->firstWhere('slug', 'question-bank'));
        PlatformSetting::updateConfig([
            'all_languages_free' => true,
            'enabled_languages' => ['English', 'Arabic', 'Egyptian Arabic'],
            'free_languages' => ['English', 'Arabic', 'Egyptian Arabic'],
        ]);

        $user = User::factory()->create(['role' => 'premium', 'sub_status' => 'premium']);
        $token = auth('api')->login($user);

        $this->mock(CourseService::class, function ($mock) {
            $mock->shouldReceive('generateOutline')
                ->once()
                ->withArgs(function (array $data) {
                    return $data['blueprint_slug'] === 'question-bank'
                        && $data['blueprint_fields']['question_count'] === '40'
                        && $data['blueprint_fields']['topics'] === 'Python basics'
                        && $data['blueprint_fields']['difficulty'] === 'mixed'
                        && $data['blueprint_fields']['question_types'] === 'mixed'
                        && $data['language'] === 'Egyptian Arabic';
                })
                ->andReturn([
                    'title' => 'Python Questions',
                    'chapters' => [],
                    'blueprint_slug' => 'question-bank',
                    'language_variant' => 'Egyptian Arabic',
                ]);
        });

        $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Device-ID', 'test-device-id')
            ->postJson('/api/generate-course', [
                'topic' => 'Python',
                'type' => 'Theory & Image Course',
                'language' => 'Egyptian Arabic',
                'numModules' => 40,
                'blueprint_slug' => 'question-bank',
                'blueprint_fields' => [
                    'topics' => 'Python basics',
                    'question_count' => '40',
                    'difficulty' => 'mixed',
                    'question_types' => 'mixed',
                ],
            ])
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.language_variant', 'Egyptian Arabic');
    }
}
