<?php

namespace Tests\Feature;

use App\Interfaces\AIProviderInterface;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Services\MediaResolverService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class CourseMediaContractTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_course_persists_course_cover_and_lesson_image_media_from_generated_content(): void
    {
        $user = User::factory()->create();

        $content = [
            'title' => 'Image Course',
            'cover_image' => 'https://cdn.example.test/course-cover.png',
            'chapters' => [[
                'title' => 'Chapter One',
                'subtopics' => [[
                    'title' => 'Visual Lesson',
                    'content' => 'Lesson content',
                    'metadata' => [
                        'images' => [[
                            'url' => 'https://cdn.example.test/lesson-image.png',
                            'title' => 'Lesson image',
                        ]],
                    ],
                ]],
            ]],
        ];

        $this->actingAsApi($user)
            ->postJson('/api/course', [
                'mainTopic' => 'Image Course',
                'type' => 'Theory & Image Course',
                'language' => 'English',
                'content' => json_encode($content),
            ])
            ->assertCreated();

        $this->assertDatabaseHas('courses', [
            'user_id' => $user->id,
            'title' => 'Image Course',
            'photo' => 'https://cdn.example.test/course-cover.png',
        ]);

        $this->assertDatabaseHas('lessons', [
            'title' => 'Visual Lesson',
            'media_url' => 'https://cdn.example.test/lesson-image.png',
            'media_type' => 'image',
        ]);
    }

    public function test_lesson_content_generation_persists_image_media_for_image_courses(): void
    {
        $user = User::factory()->create();
        $course = $this->createCourse($user, 'Theory & Image Course');
        $lesson = $course->lessons()->first();

        $this->mock(AIProviderInterface::class, function ($mock) {
            $mock->shouldReceive('generateLessonContent')->once()->andReturn([
                'content' => 'Generated image lesson content.',
                'media_queries' => [
                    'images' => [[
                        'query' => 'Visual Lesson educational diagram',
                        'intent' => 'educational',
                        'constraints' => ['orientation' => 'landscape'],
                    ]],
                ],
            ]);
        });

        $this->mock(MediaResolverService::class, function ($mock) {
            $mock->shouldReceive('resolveImagesMultiple')->once()->andReturn([[
                'url' => 'https://cdn.example.test/generated-image.png',
                'title' => 'Generated image',
                'source' => 'test',
                'score' => 0.9,
                'metadata' => [],
            ]]);
        });

        $this->actingAsApi($user)
            ->getJson("/api/courses/{$course->public_id}/lessons/{$lesson->id}")
            ->assertOk()
            ->assertJsonPath('media_url', 'https://cdn.example.test/generated-image.png')
            ->assertJsonPath('media_type', 'image');

        $this->assertDatabaseHas('lessons', [
            'id' => $lesson->id,
            'media_url' => 'https://cdn.example.test/generated-image.png',
            'media_type' => 'image',
        ]);
    }

    public function test_lesson_content_generation_persists_video_media_for_video_courses(): void
    {
        $user = User::factory()->create();
        $course = $this->createCourse($user, 'Video & Theory Course');
        $lesson = $course->lessons()->first();

        $this->mock(AIProviderInterface::class, function ($mock) {
            $mock->shouldReceive('generateLessonContent')->once()->andReturn([
                'content' => 'Generated video lesson content.',
                'media_queries' => [
                    'videos' => [[
                        'query' => 'Visual Lesson tutorial',
                        'intent' => 'educational',
                        'constraints' => ['language' => 'English'],
                    ]],
                ],
            ]);
        });

        $this->mock(MediaResolverService::class, function ($mock) {
            $mock->shouldReceive('resolveVideos')->once()->andReturn([
                'url' => 'https://www.youtube.com/watch?v=abc123def45',
                'title' => 'Generated video',
                'source' => 'youtube',
                'score' => 0.9,
                'metadata' => ['thumbnail' => 'https://img.youtube.com/vi/abc123def45/hqdefault.jpg'],
            ]);
        });

        $this->actingAsApi($user)
            ->getJson("/api/courses/{$course->public_id}/lessons/{$lesson->id}")
            ->assertOk()
            ->assertJsonPath('media_url', 'https://www.youtube.com/watch?v=abc123def45')
            ->assertJsonPath('media_type', 'video');

        $this->assertDatabaseHas('lessons', [
            'id' => $lesson->id,
            'media_url' => 'https://www.youtube.com/watch?v=abc123def45',
            'media_type' => 'video',
        ]);
    }

    public function test_web_generate_lesson_endpoint_persists_lesson_media_columns(): void
    {
        $user = User::factory()->create(['remaining_credits' => 500]);
        $course = $this->createCourse($user, 'Theory & Image Course');
        $lesson = $course->lessons()->first();

        $this->mock(AIProviderInterface::class, function ($mock) {
            $mock->shouldReceive('generateLessonContent')->once()->andReturn([
                'content' => 'Generated web lesson content.',
                'media_queries' => [
                    'images' => [[
                        'query' => 'Visual Lesson web diagram',
                        'intent' => 'educational',
                        'constraints' => ['orientation' => 'landscape'],
                    ]],
                ],
            ]);
        });

        $this->mock(MediaResolverService::class, function ($mock) {
            $mock->shouldReceive('resolveImagesMultiple')->atLeast()->once()->andReturn([[
                'url' => 'https://cdn.example.test/web-generated-image.png',
                'title' => 'Web generated image',
                'source' => 'test',
                'score' => 0.9,
                'metadata' => [],
            ]]);
        });

        $this->actingAsApi($user)
            ->postJson('/api/generate-lesson', [
                'course_id' => $course->public_id,
                'chapter_title' => 'Chapter One',
                'subtopic_title' => 'Visual Lesson',
                'language' => 'English',
            ])
            ->assertOk();

        $this->assertDatabaseHas('lessons', [
            'id' => $lesson->id,
            'media_url' => 'https://cdn.example.test/web-generated-image.png',
            'media_type' => 'image',
        ]);
    }

    private function createCourse(User $user, string $type): Course
    {
        $course = Course::create([
            'user_id' => $user->id,
            'title' => 'Media Course',
            'type' => $type,
            'language' => 'English',
            'photo' => 'https://cdn.example.test/course-cover.png',
            'metadata' => [
                'title' => 'Media Course',
                'chapters' => [[
                    'title' => 'Chapter One',
                    'subtopics' => [['title' => 'Visual Lesson']],
                ]],
            ],
        ]);

        Lesson::create([
            'course_id' => $course->id,
            'topic_title' => 'Chapter One',
            'title' => 'Visual Lesson',
            'content' => null,
            'media_type' => 'none',
        ]);

        return $course;
    }

    private function actingAsApi(User $user): self
    {
        return $this->withHeaders([
            'Authorization' => 'Bearer ' . JWTAuth::fromUser($user),
            'X-Device-ID' => 'test-device',
        ]);
    }
}
