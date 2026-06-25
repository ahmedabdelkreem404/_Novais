<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PaymobService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Mockery\MockInterface;
use Tests\TestCase;

class PaymentSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_paymob_webhook_rejects_invalid_hmac(): void
    {
        $user = User::factory()->create();
        $payment = Payment::create([
            'user_id' => $user->id,
            'transaction_id' => 'ORD-invalid',
            'plan_id' => 'pro_monthly',
            'amount' => 60,
            'currency' => 'EGP',
            'status' => 'pending',
        ]);

        $this->mock(PaymobService::class, function (MockInterface $mock) {
            $mock->shouldReceive('verifyWebhookPayload')->once()->andReturn(false);
        });

        $this->postJson('/api/payment/webhook', $this->successfulPayload($payment))
            ->assertStatus(403);

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseCount('subscriptions', 0);
    }

    public function test_payment_callback_does_not_activate_pending_payment(): void
    {
        $user = User::factory()->create();
        $payment = Payment::create([
            'user_id' => $user->id,
            'transaction_id' => 'ORD-callback',
            'plan_id' => 'pro_monthly',
            'amount' => 60,
            'currency' => 'EGP',
            'status' => 'pending',
        ]);

        $this->get('/api/payment/callback?reference=ORD-callback&status=success')
            ->assertRedirect('http://localhost:3000/payment-failed');

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'pending',
        ]);
        $this->assertDatabaseCount('subscriptions', 0);
    }

    public function test_signed_success_webhook_activates_subscription_once(): void
    {
        Mail::fake();
        Plan::create([
            'slug' => 'pro',
            'name' => 'Pro',
            'description' => 'Pro plan',
            'features' => [],
            'price_egp' => 60,
            'course_limit' => 3,
        ]);
        $user = User::factory()->create(['role' => 'user', 'sub_status' => 'free', 'monthly_spent_egp' => 0]);
        $payment = Payment::create([
            'user_id' => $user->id,
            'transaction_id' => 'ORD-paid',
            'plan_id' => 'pro_monthly',
            'provider_order_id' => '9001',
            'amount' => 60,
            'currency' => 'EGP',
            'status' => 'pending',
        ]);

        $this->mock(PaymobService::class, function (MockInterface $mock) {
            $mock->shouldReceive('verifyWebhookPayload')->twice()->andReturn(true);
        });

        $payload = $this->successfulPayload($payment);
        $this->postJson('/api/payment/webhook', $payload)->assertOk();
        $this->postJson('/api/payment/webhook', $payload)->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'paid',
            'provider_transaction_id' => '7001',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'premium',
            'sub_status' => 'pro_monthly',
        ]);
        $this->assertSame(1, Subscription::where('user_id', $user->id)->where('status', 'active')->count());
        $this->assertSame(60.0, (float) $user->fresh()->monthly_spent_egp);
    }

    public function test_signed_failed_webhook_marks_payment_failed_without_subscription(): void
    {
        $user = User::factory()->create();
        $payment = Payment::create([
            'user_id' => $user->id,
            'transaction_id' => 'ORD-failed',
            'plan_id' => 'pro_monthly',
            'provider_order_id' => '9002',
            'amount' => 60,
            'currency' => 'EGP',
            'status' => 'pending',
        ]);

        $this->mock(PaymobService::class, function (MockInterface $mock) {
            $mock->shouldReceive('verifyWebhookPayload')->once()->andReturn(true);
        });

        $payload = $this->successfulPayload($payment);
        $payload['obj']['success'] = false;

        $this->postJson('/api/payment/webhook', $payload)->assertOk();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'status' => 'failed',
        ]);
        $this->assertDatabaseCount('subscriptions', 0);
    }

    private function successfulPayload(Payment $payment): array
    {
        return [
            'type' => 'TRANSACTION',
            'hmac' => 'test-signature',
            'obj' => [
                'id' => '7001',
                'success' => true,
                'pending' => false,
                'amount_cents' => (int) round(((float) $payment->amount) * 100),
                'order' => [
                    'id' => $payment->provider_order_id ?: '9001',
                    'merchant_order_id' => $payment->transaction_id,
                ],
            ],
        ];
    }
}
