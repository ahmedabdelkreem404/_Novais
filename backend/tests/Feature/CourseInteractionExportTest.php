<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Interfaces\AIProviderInterface;
use App\Services\AI\DeepSeekService;
use App\Services\MediaResolverService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;
use ZipArchive;

class CourseInteractionExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_table_exists_after_migrations(): void
    {
        $this->assertTrue(Schema::hasTable('chats'));
    }

    public function test_deepseek_service_reads_model_from_config(): void
    {
        config(['services.deepseek.model' => 'deepseek-v4-flash']);

        $service = new DeepSeekService();
        $reflection = new \ReflectionClass($service);
        $property = $reflection->getProperty('model');
        $property->setAccessible(true);

        $this->assertSame('deepseek-v4-flash', $property->getValue($service));
    }

    public function test_authenticated_chat_flow_saves_user_and_assistant_messages(): void
    {
        $user = User::factory()->create();
        $course = $this->createCourse($user);

        $this->mock(DeepSeekService::class, function ($mock) {
            $mock->shouldReceive('chatWithContext')->once()->andReturn('A focused assistant reply.');
            $mock->shouldReceive('getLastUsage')->once()->andReturn([]);
        });

        $this->actingAsApi($user)
            ->postJson('/api/chat', [
                'courseId' => $course->public_id,
                'message' => 'Help me understand this lesson.',
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'reply' => 'A focused assistant reply.',
            ]);

        $this->assertDatabaseHas('chats', [
            'user_id' => $user->id,
            'course_id' => $course->id,
            'role' => 'user',
            'message' => 'Help me understand this lesson.',
        ]);

        $this->assertDatabaseHas('chats', [
            'user_id' => $user->id,
            'course_id' => $course->id,
            'role' => 'assistant',
            'message' => 'A focused assistant reply.',
        ]);
    }

    public function test_admin_can_chat_with_zero_remaining_credits(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create([
            'role' => 'admin',
            'remaining_credits' => 0,
            'total_credits' => 0,
        ]);
        $course = $this->createCourse($owner);

        $this->mock(DeepSeekService::class, function ($mock) {
            $mock->shouldReceive('chatWithContext')->once()->andReturn('Admin assistant reply.');
            $mock->shouldReceive('getLastUsage')->once()->andReturn(['total_tokens' => 50]);
        });

        $this->actingAsApi($admin)
            ->postJson('/api/chat', [
                'courseId' => $course->public_id,
                'message' => 'Admin check.',
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'reply' => 'Admin assistant reply.',
            ]);

        $admin->refresh();
        $this->assertSame(0, $admin->remaining_credits);
    }

    public function test_certificate_generation_works_with_public_id(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $course = $this->createCourse($user, [
            'metadata' => ['quizResult' => ['score' => 100]],
        ]);

        $this->actingAsApi($user)
            ->postJson("/api/courses/{$course->public_id}/certificate")
            ->assertCreated()
            ->assertJson([
                'message' => 'certificate.generated_and_sent',
            ]);

        $this->assertDatabaseHas('certificates', [
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);
    }

    public function test_ppt_export_returns_a_valid_pptx_response(): void
    {
        $user = User::factory()->create();
        $course = $this->createCourse($user);

        $response = $this->actingAsApi($user)
            ->get("/api/courses/{$course->id}/export/ppt")
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

        $this->assertValidPptxResponse($response);
    }

    public function test_pdf_export_works_with_public_id(): void
    {
        $user = User::factory()->create();
        $course = $this->createCourse($user);

        $response = $this->actingAsApi($user)
            ->get("/api/courses/{$course->public_id}/export/pdf")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertGreaterThan(100, strlen($response->getContent()));
    }

    public function test_pdf_export_works_with_numeric_id(): void
    {
        $user = User::factory()->create();
        $course = $this->createCourse($user);

        $response = $this->actingAsApi($user)
            ->get("/api/courses/{$course->id}/export/pdf")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertGreaterThan(100, strlen($response->getContent()));
    }

    public function test_non_admin_user_cannot_export_another_users_pdf(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $course = $this->createCourse($owner);

        $this->actingAsApi($attacker)
            ->get("/api/courses/{$course->public_id}/export/pdf")
            ->assertNotFound();
    }

    public function test_admin_can_export_another_users_pdf_and_ppt(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $course = $this->createCourse($owner);

        $this->actingAsApi($admin)
            ->get("/api/courses/{$course->public_id}/export/pdf")
            ->assertOk();

        $response = $this->actingAsApi($admin)
            ->get("/api/courses/{$course->public_id}/export/ppt")
            ->assertOk();

        $this->assertValidPptxResponse($response);
    }

    public function test_ppt_export_works_with_public_id(): void
    {
        $user = User::factory()->create();
        $course = $this->createCourse($user);

        $response = $this->actingAsApi($user)
            ->get("/api/courses/{$course->public_id}/export/ppt")
            ->assertOk();

        $this->assertValidPptxResponse($response);
    }

    public function test_public_id_starting_with_digit_does_not_match_numeric_id(): void
    {
        $user = User::factory()->create();
        $wrongCourse = $this->createCourse($user, ['title' => 'Wrong Numeric Match']);
        $targetCourse = $this->createCourse($user, ['title' => 'Correct Public Course']);
        $targetCourse->update(['public_id' => $wrongCourse->id . 'abc-public-id']);

        $this->actingAsApi($user)
            ->get("/api/courses/{$targetCourse->public_id}")
            ->assertOk()
            ->assertJsonPath('id', $targetCourse->id)
            ->assertJsonPath('title', 'Correct Public Course');

        $this->actingAsApi($user)
            ->get("/api/courses/{$targetCourse->public_id}/export/pdf")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
    }

    public function test_ppt_export_splits_long_lesson_content_into_multiple_slides(): void
    {
        $user = User::factory()->create();
        $course = $this->createCourse($user);
        $course->lessons()->first()->update([
            'content' => str_repeat(
                'A long exported lesson paragraph with practical detail, concise bullet-worthy ideas, and readable structure. ',
                45
            ),
        ]);

        $response = $this->actingAsApi($user)
            ->get("/api/courses/{$course->public_id}/export/ppt")
            ->assertOk();

        $this->assertGreaterThan(1, $this->assertValidPptxResponse($response));
    }

    public function test_generate_lesson_updates_matching_lesson_row_for_exports(): void
    {
        $user = User::factory()->create(['remaining_credits' => 500]);
        $course = $this->createCourse($user, [
            'title' => 'Real Content Course',
            'type' => 'Text & Image Course',
            'metadata' => [
                'title' => 'Real Content Course',
                'chapters' => [[
                    'title' => 'Chapter One',
                    'subtopics' => [[
                        'title' => 'Generated Lesson',
                    ]],
                ]],
            ],
        ]);
        $lesson = $course->lessons()->first();
        $lesson->update([
            'topic_title' => 'Chapter One',
            'title' => 'Generated Lesson',
            'content' => null,
        ]);

        $this->mock(AIProviderInterface::class, function ($mock) {
            $mock->shouldReceive('generateLessonContent')->once()->andReturn([
                'content' => 'This is real generated lesson content with useful educational detail.',
                'examples' => 'Example one.',
                'media_queries' => ['images' => []],
            ]);
        });

        $this->mock(MediaResolverService::class, function ($mock) {
            $mock->shouldReceive('resolveImagesMultiple')->zeroOrMoreTimes()->andReturn([]);
            $mock->shouldReceive('resolveImages')->zeroOrMoreTimes()->andReturn(null);
        });

        $this->actingAsApi($user)
            ->postJson('/api/generate-lesson', [
                'course_id' => $course->public_id,
                'chapter_title' => 'Chapter One',
                'subtopic_title' => 'Generated Lesson',
                'language' => 'English',
            ])
            ->assertOk()
            ->assertJsonPath('data.content', 'This is real generated lesson content with useful educational detail.');

        $this->assertDatabaseHas('lessons', [
            'id' => $lesson->id,
            'content' => 'This is real generated lesson content with useful educational detail.',
        ]);
    }

    public function test_non_admin_user_cannot_generate_lesson_for_another_users_course(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $course = $this->createCourse($owner, [
            'metadata' => [
                'title' => 'Private Course',
                'chapters' => [[
                    'title' => 'Private Chapter',
                    'subtopics' => [['title' => 'Private Lesson']],
                ]],
            ],
        ]);

        $this->actingAsApi($attacker)
            ->postJson('/api/generate-lesson', [
                'course_id' => $course->public_id,
                'chapter_title' => 'Private Chapter',
                'subtopic_title' => 'Private Lesson',
                'language' => 'English',
            ])
            ->assertForbidden();
    }

    public function test_non_admin_user_cannot_export_another_users_ppt(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $course = $this->createCourse($owner);

        $this->actingAsApi($attacker)
            ->get("/api/courses/{$course->public_id}/export/ppt")
            ->assertNotFound();
    }

    private function createCourse(User $user, array $attributes = []): Course
    {
        $course = Course::create(array_merge([
            'user_id' => $user->id,
            'title' => 'Release Gate Course',
            'type' => 'text',
            'language' => 'English',
        ], $attributes));

        Lesson::create([
            'course_id' => $course->id,
            'topic_title' => 'Verification',
            'title' => 'Final Verification',
            'content' => 'This lesson content is exported into a PowerPoint slide.',
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

    private function assertValidPptxResponse($response): int
    {
        $file = $response->baseResponse->getFile();
        $path = $file->getPathname();

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($path) === true);
        $this->assertNotFalse($zip->locateName('[Content_Types].xml'));
        $this->assertNotFalse($zip->locateName('ppt/presentation.xml'));
        $this->assertNotFalse($zip->locateName('ppt/slides/slide1.xml'));

        $slideCount = 0;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (preg_match('#^ppt/slides/slide\d+\.xml$#', $name)) {
                $slideCount++;
            }
        }

        $zip->close();

        @unlink($path);

        return $slideCount;
    }
}
