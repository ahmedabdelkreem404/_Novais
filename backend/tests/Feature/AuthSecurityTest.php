<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AuthSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_failure_message_does_not_enumerate_users(): void
    {
        User::factory()->create([
            'email' => 'known@example.com',
            'password' => bcrypt('correct-password'),
        ]);

        $unknown = $this->withHeaders(['X-Device-ID' => 'device-a'])->postJson('/api/auth/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong-password',
        ]);
        $wrongPassword = $this->withHeaders(['X-Device-ID' => 'device-b'])->postJson('/api/auth/login', [
            'email' => 'known@example.com',
            'password' => 'wrong-password',
        ]);

        $unknown->assertStatus(401)->assertJson(['message' => 'auth.invalid_credentials']);
        $wrongPassword->assertStatus(401)->assertJson(['message' => 'auth.invalid_credentials']);
    }

    public function test_forgot_password_response_does_not_enumerate_users(): void
    {
        Mail::fake();

        $response = $this->withHeaders(['X-Device-ID' => 'device-a'])->postJson('/api/auth/forgot-password', [
            'email' => 'missing@example.com',
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'If this email exists, a reset link will be sent.']);
    }
}
