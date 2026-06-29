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

    public function test_request_without_proof_image_and_reference_is_rejected(): void
    {
        $user = User::factory()->create();
        $plan = $this->paidPlan();

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'method' => 'vodafone_cash',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['transaction_reference', 'proof_image']);
    }

    public function test_request_with_proof_image_only_is_accepted(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $plan = $this->paidPlan();

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'method' => 'vodafone_cash',
                'proof_image' => UploadedFile::fake()->image('receipt.png'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.transaction_reference', null);
    }

    public function test_request_with_both_proof_image_and_reference_is_accepted(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $plan = $this->paidPlan();

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'method' => 'instapay',
                'transaction_reference' => 'BOTH-10001',
                'proof_image' => UploadedFile::fake()->image('receipt.webp'),
            ])
            ->assertCreated()
            ->assertJsonPath('data.transaction_reference', 'BOTH-10001');
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

    public function test_duplicate_pending_request_for_same_plan_cycle_and_method_is_rejected(): void
    {
        $user = User::factory()->create();
        $plan = $this->paidPlan();

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'billing_cycle' => 'monthly',
                'method' => 'vodafone_cash',
                'transaction_reference' => 'DUP-10001',
            ])
            ->assertCreated();

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'billing_cycle' => 'monthly',
                'method' => 'vodafone_cash',
                'transaction_reference' => 'DUP-10002',
            ])
            ->assertStatus(422)
            ->assertJson(['message' => 'offline_payment.duplicate_pending_request']);
    }

    public function test_request_after_cancellation_is_allowed(): void
    {
        $user = User::factory()->create();
        $plan = $this->paidPlan();

        $first = $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'billing_cycle' => 'monthly',
                'method' => 'vodafone_cash',
                'transaction_reference' => 'CANCEL-10001',
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAsApi($user)
            ->postJson("/api/offline-payments/{$first}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'billing_cycle' => 'monthly',
                'method' => 'vodafone_cash',
                'transaction_reference' => 'CANCEL-10002',
            ])
            ->assertCreated();
    }

    public function test_request_after_rejection_is_allowed(): void
    {
        $user = User::factory()->create();
        $plan = $this->paidPlan();

        $first = $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'billing_cycle' => 'monthly',
                'method' => 'instapay',
                'transaction_reference' => 'REJECT-10001',
            ])
            ->assertCreated()
            ->json('data.id');

        OfflinePaymentRequest::findOrFail($first)->update([
            'status' => OfflinePaymentRequest::STATUS_REJECTED,
            'admin_note' => 'Reference not found',
            'rejected_at' => now(),
        ]);

        $this->actingAsApi($user)
            ->postJson('/api/offline-payments', [
                'plan_id' => $plan->id,
                'billing_cycle' => 'monthly',
                'method' => 'instapay',
                'transaction_reference' => 'REJECT-10002',
            ])
            ->assertCreated();
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

    public function test_unauthenticated_user_cannot_download_proof(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();
        $request = $this->offlinePaymentFor($user, ['proof_image_path' => 'offline-payment-proofs/receipt.jpg']);
        Storage::disk('local')->put($request->proof_image_path, 'fake-image');

        $this->getJson("/api/admin/offline-payments/{$request->id}/proof")
            ->assertStatus(401);
    }

    public function test_non_admin_cannot_download_proof(): void
    {
        Storage::fake('local');
        $user = User::factory()->create(['role' => 'user']);
        $request = $this->offlinePaymentFor($user, ['proof_image_path' => 'offline-payment-proofs/receipt.jpg']);
        Storage::disk('local')->put($request->proof_image_path, 'fake-image');

        $this->actingAsApi($user)
            ->getJson("/api/admin/offline-payments/{$request->id}/proof")
            ->assertStatus(403);
    }

    public function test_admin_can_download_proof_from_private_storage(): void
    {
        Storage::fake('local');
        $admin = User::factory()->create(['role' => 'admin']);
        $user = User::factory()->create();
        $request = $this->offlinePaymentFor($user, ['proof_image_path' => 'offline-payment-proofs/receipt.jpg']);
        Storage::disk('local')->put($request->proof_image_path, 'fake-image');

        $this->actingAsApi($admin)
            ->get("/api/admin/offline-payments/{$request->id}/proof")
            ->assertOk()
            ->assertHeader('content-disposition');
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

    private function offlinePaymentFor(User $user, array $overrides = []): OfflinePaymentRequest
    {
        $plan = $this->paidPlan();

        return OfflinePaymentRequest::create(array_merge([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'billing_cycle' => 'monthly',
            'amount' => $plan->price_egp,
            'currency' => 'EGP',
            'method' => 'vodafone_cash',
            'transaction_reference' => 'REF-' . $user->id . '-' . uniqid(),
            'status' => 'pending',
        ], $overrides));
    }

    private function actingAsApi(User $user): self
    {
        $this->flushHeaders();
        auth()->forgetGuards();

        return $this->withHeaders([
            'Authorization' => 'Bearer ' . JWTAuth::fromUser($user),
            'X-Device-ID' => 'test-device',
        ]);
    }
}
