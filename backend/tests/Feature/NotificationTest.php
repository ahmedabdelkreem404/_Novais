<?php

namespace Tests\Feature;

use App\Models\AppNotification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_send_notification_to_one_user(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user']);
        $token = auth('api')->login($admin);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/notifications', [
                'target' => 'user',
                'user_id' => $user->id,
                'title' => 'Course ready',
                'body' => 'Your course is ready to review.',
                'type' => 'course',
            ])
            ->assertCreated()
            ->assertJsonPath('created_count', 1);

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $user->id,
            'title' => 'Course ready',
            'type' => 'course',
        ]);
    }

    public function test_non_admin_cannot_send_notifications(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $token = auth('api')->login($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/notifications', [
                'target' => 'all',
                'title' => 'Hello',
                'body' => 'Nope',
            ])
            ->assertForbidden();
    }

    public function test_user_can_list_and_mark_own_notification_read(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $other = User::factory()->create(['role' => 'user']);
        $own = AppNotification::create([
            'user_id' => $user->id,
            'title' => 'Welcome',
            'body' => 'Glad you are here.',
            'type' => 'info',
            'published_at' => now(),
        ]);
        AppNotification::create([
            'user_id' => $other->id,
            'title' => 'Other',
            'body' => 'Hidden',
            'type' => 'info',
            'published_at' => now(),
        ]);

        $token = auth('api')->login($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonFragment(['title' => 'Welcome'])
            ->assertJsonMissing(['title' => 'Other']);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/notifications/{$own->id}/read")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertNotNull($own->fresh()->read_at);
    }

    public function test_admin_broadcast_creates_per_user_notifications(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->count(2)->create(['role' => 'user']);
        $token = auth('api')->login($admin);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/admin/notifications', [
                'target' => 'all',
                'title' => 'Maintenance',
                'body' => 'Scheduled maintenance tonight.',
                'type' => 'system',
            ])
            ->assertCreated()
            ->assertJsonPath('created_count', 3);

        $this->assertSame(3, AppNotification::where('title', 'Maintenance')->count());
    }

    public function test_mobile_can_register_notification_device(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $token = auth('api')->login($user);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/notification-devices', [
                'device_id' => 'emulator-5554',
                'platform' => 'android',
                'push_token' => 'local-test-token',
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('notification_devices', [
            'user_id' => $user->id,
            'device_id' => 'emulator-5554',
            'platform' => 'android',
        ]);
    }
}
