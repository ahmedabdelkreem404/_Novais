<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseGenerationLog;
use App\Models\Lesson;
use App\Models\User;
use App\Services\DeviceManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthorizationSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_create_note_for_another_users_course(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $course = Course::create([
            'user_id' => $owner->id,
            'title' => 'Private Course',
            'type' => 'text',
        ]);

        $this->actingAsApi($attacker)
            ->postJson('/api/notes', [
                'course_id' => $course->id,
                'content' => 'stolen context',
            ])
            ->assertStatus(403);

        $this->assertDatabaseCount('personal_notes', 0);
    }

    public function test_user_cannot_attach_note_to_lesson_from_another_course(): void
    {
        $user = User::factory()->create();
        $course = Course::create(['user_id' => $user->id, 'title' => 'Mine', 'type' => 'text']);
        $otherCourse = Course::create(['user_id' => $user->id, 'title' => 'Other', 'type' => 'text']);
        $lesson = Lesson::create([
            'course_id' => $otherCourse->id,
            'topic_title' => 'Topic',
            'title' => 'Lesson',
        ]);

        $this->actingAsApi($user)
            ->postJson('/api/notes', [
                'course_id' => $course->id,
                'lesson_id' => $lesson->id,
                'content' => 'bad link',
            ])
            ->assertStatus(403);

        $this->assertDatabaseCount('personal_notes', 0);
    }

    public function test_user_cannot_generate_certificate_for_another_users_course(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $course = Course::create([
            'user_id' => $owner->id,
            'title' => 'Private Course',
            'type' => 'text',
            'metadata' => ['quizResult' => ['score' => 100]],
        ]);

        $this->actingAsApi($attacker)
            ->postJson("/api/courses/{$course->id}/certificate")
            ->assertStatus(403);

        $this->assertDatabaseCount('certificates', 0);
    }

    public function test_paid_paymob_status_bypasses_free_generation_limit(): void
    {
        $user = User::factory()->create(['sub_status' => 'pro_monthly']);

        $this->assertTrue(app(DeviceManager::class)->checkGenerationLimits($user, 'device-1'));
    }

    public function test_free_user_remains_limited_after_daily_generation(): void
    {
        $user = User::factory()->create(['sub_status' => 'free']);
        CourseGenerationLog::create([
            'user_id' => $user->id,
            'course_id' => 'course-1',
            'device_id' => 'device-1',
            'ip_address' => '127.0.0.1',
        ]);

        $this->assertFalse(app(DeviceManager::class)->checkGenerationLimits($user, 'device-1'));
    }

    private function actingAsApi(User $user): self
    {
        return $this->withHeaders([
            'Authorization' => 'Bearer ' . JWTAuth::fromUser($user),
            'X-Device-ID' => 'test-device',
        ]);
    }
}
