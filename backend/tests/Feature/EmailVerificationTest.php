<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_sends_verification_code()
    {
        Mail::fake();

        $response = $this->withHeaders(['X-Device-ID' => 'test-device-id'])->postJson('/api/auth/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'device_id' => 'test-device-id'
        ]);

        $response->assertStatus(201)
                 ->assertJson(['verification_required' => true]);

        $this->assertDatabaseHas('verification_codes', ['email' => 'test@example.com']);
        
        Mail::assertSent(VerificationCodeMail::class, function ($mail) {
            return $mail->hasTo('test@example.com');
        });
    }

    public function test_verify_email_with_correct_code()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
            'registration_device_id' => 'test-device-id'
        ]);

        VerificationCode::create([
            'email' => 'test@example.com',
            'code' => '123456',
            'expires_at' => now()->addMinutes(10)
        ]);

        $response = $this->withHeaders(['X-Device-ID' => 'test-device-id'])->postJson('/api/auth/verify-email', [
            'email' => 'test@example.com',
            'code' => '123456'
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['access_token', 'user']);

        $user->refresh();
        $this->assertNotNull($user->email_verified_at);
        $this->assertDatabaseMissing('verification_codes', ['email' => 'test@example.com']);
    }

    public function test_verify_email_with_incorrect_code()
    {
        $user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
            'registration_device_id' => 'test-device-id'
        ]);

        VerificationCode::create([
            'email' => 'test@example.com',
            'code' => '123456',
            'expires_at' => now()->addMinutes(10)
        ]);

        $response = $this->withHeaders(['X-Device-ID' => 'test-device-id'])->postJson('/api/auth/verify-email', [
            'email' => 'test@example.com',
            'code' => '654321'
        ]);

        $response->assertStatus(400);
        $user->refresh();
        $this->assertNull($user->email_verified_at);
    }

    public function test_resend_verification_code()
    {
        Mail::fake();

        User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
            'registration_device_id' => 'test-device-id'
        ]);

        $response = $this->withHeaders(['X-Device-ID' => 'test-device-id'])->postJson('/api/auth/resend-verification', [
            'email' => 'test@example.com'
        ]);

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('verification_codes', ['email' => 'test@example.com']);
        Mail::assertSent(VerificationCodeMail::class);
    }
}
