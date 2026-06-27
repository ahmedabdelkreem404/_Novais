<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use App\Services\AI\DeepSeekService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;
use ZipArchive;

class CourseInteractionExportTest extends TestCase
{
    use RefreshDatabase;

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

        $this->actingAsApi($user)
            ->get("/api/courses/{$course->public_id}/export/pdf")
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');
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

    private function assertValidPptxResponse($response): void
    {
        $file = $response->baseResponse->getFile();
        $path = $file->getPathname();

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($path) === true);
        $this->assertNotFalse($zip->locateName('[Content_Types].xml'));
        $this->assertNotFalse($zip->locateName('ppt/presentation.xml'));
        $this->assertNotFalse($zip->locateName('ppt/slides/slide1.xml'));
        $zip->close();

        @unlink($path);
    }
}
