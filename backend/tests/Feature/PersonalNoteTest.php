<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Course;
use App\Models\PersonalNote;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PersonalNoteTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_only_see_their_own_notes()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $course1 = Course::create([
            'user_id' => $user1->id,
            'title' => 'User 1 Course',
            'type' => 'text',
            'language' => 'English',
            'metadata' => []
        ]);

        $course2 = Course::create([
            'user_id' => $user2->id,
            'title' => 'User 2 Course',
            'type' => 'text',
            'language' => 'English',
            'metadata' => []
        ]);

        // User 1 Note
        PersonalNote::create([
            'user_id' => $user1->id,
            'course_id' => $course1->id,
            'content' => 'Note 1 content'
        ]);

        // User 2 Note
        PersonalNote::create([
            'user_id' => $user2->id,
            'course_id' => $course2->id,
            'content' => 'Note 2 content'
        ]);

        // Access as User 1
        $response = $this->actingAs($user1, 'api')
            ->getJson('/api/notes');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['content' => 'Note 1 content']);
        $response->assertJsonMissing(['content' => 'Note 2 content']);
    }

    public function test_course_id_filter_works_and_validates_ownership()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $course1 = Course::create([
            'user_id' => $user1->id,
            'title' => 'User 1 Course',
            'type' => 'text',
            'language' => 'English',
            'metadata' => []
        ]);

        $course2 = Course::create([
            'user_id' => $user2->id,
            'title' => 'User 2 Course',
            'type' => 'text',
            'language' => 'English',
            'metadata' => []
        ]);

        // Try to filter notes by a course that doesn't belong to the user
        $response = $this->actingAs($user1, 'api')
            ->getJson("/api/notes?course_id={$course2->id}");

        $response->assertStatus(403);
    }

    public function test_pagination_limit_works()
    {
        $user = User::factory()->create();

        $course = Course::create([
            'user_id' => $user->id,
            'title' => 'User Course',
            'type' => 'text',
            'language' => 'English',
            'metadata' => []
        ]);

        // Create 5 notes
        for ($i = 1; $i <= 5; $i++) {
            PersonalNote::create([
                'user_id' => $user->id,
                'course_id' => $course->id,
                'content' => "Note $i content"
            ]);
        }

        // Limit to 2
        $response = $this->actingAs($user, 'api')
            ->getJson("/api/notes?course_id={$course->id}&limit=2");

        $response->assertStatus(200);
        $response->assertJsonCount(2);
    }
}
