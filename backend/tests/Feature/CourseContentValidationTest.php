<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CurriculumValidator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class CourseContentValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_validator_rejects_empty_generated_course_structure(): void
    {
        $result = app(CurriculumValidator::class)->validate([], []);

        $this->assertSame('invalid', $result['status']);
        $this->assertContains('missing_course_title', $result['violations']);
        $this->assertContains('missing_course_sections', $result['violations']);
    }

    public function test_validator_normalizes_incomplete_ai_response_with_fallback_lesson(): void
    {
        $normalized = app(CurriculumValidator::class)->normalize([], [
            'topic' => 'Data Structures',
        ]);

        $this->assertSame('Data Structures', $normalized['title']);
        $this->assertNotEmpty($normalized['chapters']);
        $this->assertSame('Getting Started', $normalized['chapters'][0]['title']);
        $this->assertSame('Data Structures', $normalized['chapters'][0]['subtopics'][0]['title']);
        $this->assertNotEmpty($normalized['chapters'][0]['subtopics'][0]['content']);
    }

    public function test_store_course_does_not_save_empty_course_when_content_is_incomplete(): void
    {
        $user = User::factory()->create();

        $this->actingAsApi($user)
            ->postJson('/api/course', [
                'mainTopic' => 'AI Foundations',
                'type' => 'text',
                'language' => 'English',
                'content' => json_encode([]),
            ])
            ->assertCreated()
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('courses', [
            'user_id' => $user->id,
            'title' => 'AI Foundations',
        ]);

        $this->assertDatabaseHas('lessons', [
            'topic_title' => 'Getting Started',
            'title' => 'AI Foundations',
        ]);
    }

    public function test_store_course_normalizes_empty_lesson_content_and_arabic_titles(): void
    {
        $user = User::factory()->create(['role' => 'premium']);
        $content = [
            'title' => 'مقدمة في البرمجة',
            'chapters' => [[
                'title' => 'الفصل الأول',
                'subtopics' => [[
                    'title' => 'المتغيرات',
                    'content' => '',
                ]],
            ]],
        ];

        $this->actingAsApi($user)
            ->postJson('/api/course', [
                'mainTopic' => 'مقدمة في البرمجة',
                'type' => 'text',
                'language' => 'Arabic',
                'content' => json_encode($content),
            ])
            ->assertCreated();

        $this->assertDatabaseHas('lessons', [
            'topic_title' => 'الفصل الأول',
            'title' => 'المتغيرات',
            'content' => 'Content will be generated when this lesson is opened.',
        ]);
    }

    private function actingAsApi(User $user): self
    {
        return $this->withHeaders([
            'Authorization' => 'Bearer ' . JWTAuth::fromUser($user),
            'X-Device-ID' => 'test-device',
        ]);
    }
}
