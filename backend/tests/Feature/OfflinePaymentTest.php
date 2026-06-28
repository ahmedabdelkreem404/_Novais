<?php

namespace Tests\Feature;

use App\Models\OfflinePaymentRequest;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use Tymon\JWTAuth\Facades\JWTAuth;

class OfflinePaymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_cannot_create_offline_payment_request(): void
    {
        $plan = $this->paidPlan();

        $this->postJson('/api/offline-payments', [
            'plan_id' => $plan->id,
            'method' => 'vodafone_cash',
        ])->assertStatus(401);
    }

    public function test_user_can_create_vodafone_cash_request_with_proof(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $plan = $this->paidPlan();

        $response = $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'billing_cycle' => 'monthly',
                'method' => 'vodafone_cash',
                'sender_phone' => '01000000000',
                'sender_name' => 'Ahmed',
                'transaction_reference' => 'VC-10001',
                'proof_image' => UploadedFile::fake()->image('receipt.jpg'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.method', 'vodafone_cash');

        $request = OfflinePaymentRequest::findOrFail($response->json('data.id'));
        Storage::disk('local')->assertExists($request->proof_image_path);
        $this->assertSame((float) $plan->price_egp, (float) $request->amount);
    }

    public function test_user_can_create_instapay_request(): void
    {
        $user = User::factory()->create();
        $plan = $this->paidPlan(['slug' => 'elite', 'price_egp' => 120]);

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'method' => 'instapay',
                'transaction_reference' => 'IPN-10001',
            ])
            ->assertCreated()
            ->assertJsonPath('data.method', 'instapay')
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_yearly_request_uses_discounted_yearly_amount(): void
    {
        $user = User::factory()->create();
        $plan = $this->paidPlan(['price_egp' => 60]);

        $response = $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'billing_cycle' => 'yearly',
                'method' => 'instapay',
                'transaction_reference' => 'IPN-YEARLY-10001',
            ])
            ->assertCreated()
            ->assertJsonPath('data.billing_cycle', 'yearly');

        $this->assertSame(600.0, (float) $response->json('data.amount'));
    }

    public function test_free_plan_is_rejected(): void
    {
        $user = User::factory()->create();
        $freePlan = Plan::create([
            'slug' => 'free',
            'name' => ['en' => 'Free'],
            'description' => ['en' => 'Free plan'],
            'features' => [],
            'price_egp' => 0,
            'course_limit' => 1,
        ]);

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $freePlan->id,
                'method' => 'vodafone_cash',
            ])
            ->assertStatus(422)
            ->assertJson(['message' => 'offline_payment.invalid_paid_plan']);
    }

    public function test_proof_must_be_a_valid_image(): void
    {
        $user = User::factory()->create();
        $plan = $this->paidPlan();

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'method' => 'vodafone_cash',
                'proof_image' => UploadedFile::fake()->create('receipt.pdf', 10, 'application/pdf'),
            ])
            ->assertStatus(422);
    }

    public function test_user_cannot_view_another_users_request(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();
        $request = $this->offlinePaymentFor($owner);

        $this->actingAsApi($attacker)
            ->getJson("/api/offline-payments/{$request->id}")
            ->assertStatus(403);
    }

    public function test_admin_approval_activates_subscription_once(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user', 'sub_status' => 'free', 'monthly_spent_egp' => 0]);
        $request = $this->offlinePaymentFor($user);

        $this->actingAsApi($admin)
            ->postJson("/api/admin/offline-payments/{$request->id}/approve", [
                'admin_note' => 'Receipt verified',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->actingAsApi($admin)
            ->postJson("/api/admin/offline-payments/{$request->id}/approve", [
                'admin_note' => 'Duplicate click',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertSame(1, Subscription::where('user_id', $user->id)->where('status', 'active')->count());
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'role' => 'premium',
            'sub_status' => 'pro_monthly',
        ]);
        $this->assertSame(60.0, (float) $user->fresh()->monthly_spent_egp);
    }

    public function test_admin_rejection_does_not_activate_subscription(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create(['role' => 'user', 'sub_status' => 'free']);
        $request = $this->offlinePaymentFor($user);

        $this->actingAsApi($admin)
            ->postJson("/api/admin/offline-payments/{$request->id}/reject", [
                'admin_note' => 'Reference not found',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'rejected');

        $this->assertDatabaseCount('subscriptions', 0);
        $this->assertSame('free', $user->fresh()->sub_status);
    }

    public function test_normal_user_cannot_approve_offline_payment(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $request = $this->offlinePaymentFor($user);

        $this->actingAsApi($user)
            ->postJson("/api/admin/offline-payments/{$request->id}/approve")
            ->assertStatus(403);
    }

    private function paidPlan(array $overrides = []): Plan
    {
        return Plan::create(array_merge([
            'slug' => 'pro',
            'name' => ['en' => 'Pro'],
            'description' => ['en' => 'Pro plan'],
            'features' => [],
            'price_egp' => 60,
            'course_limit' => 3,
        ], $overrides));
    }

    private function offlinePaymentFor(User $user): OfflinePaymentRequest
    {
        $plan = $this->paidPlan();

        return OfflinePaymentRequest::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'amount' => $plan->price_egp,
            'currency' => 'EGP',
            'method' => 'vodafone_cash',
            'transaction_reference' => 'REF-' . $user->id . '-' . uniqid(),
            'status' => 'pending',
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
