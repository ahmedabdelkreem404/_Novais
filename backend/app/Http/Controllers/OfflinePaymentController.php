<?php

namespace App\Http\Controllers;

use App\Models\OfflinePaymentRequest;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class OfflinePaymentController extends Controller
{
    public function instructions()
    {
        return response()->json([
            'methods' => [
                'vodafone_cash' => [
                    'receiver' => config('services.offline_payments.vodafone_cash_receiver'),
                    'instructions' => 'Send the exact plan amount, then upload a screenshot or receipt reference.',
                ],
                'instapay' => [
                    'receiver' => config('services.offline_payments.instapay_receiver'),
                    'instructions' => 'Transfer the exact plan amount, then upload a screenshot or receipt reference.',
                ],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'plan_id' => ['required', 'integer', 'exists:plans,id'],
            'billing_cycle' => ['nullable', Rule::in(['monthly', 'yearly'])],
            'method' => ['required', Rule::in(['vodafone_cash', 'instapay'])],
            'sender_phone' => ['nullable', 'string', 'max:30'],
            'sender_name' => ['nullable', 'string', 'max:255'],
            'transaction_reference' => ['nullable', 'string', 'max:255', 'unique:offline_payment_requests,transaction_reference'],
            'proof_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $plan = Plan::findOrFail($validated['plan_id']);
        if ((float) $plan->price_egp <= 0) {
            return response()->json(['message' => 'offline_payment.invalid_paid_plan'], 422);
        }

        $billingCycle = $validated['billing_cycle'] ?? 'monthly';
        $amount = $billingCycle === 'yearly' ? ((float) $plan->price_egp) * 10 : (float) $plan->price_egp;

        $proofPath = null;
        if ($request->hasFile('proof_image')) {
            $proofPath = $request->file('proof_image')->store('offline-payment-proofs');
        }

        $offlinePayment = OfflinePaymentRequest::create([
            'user_id' => Auth::id(),
            'plan_id' => $plan->id,
            'billing_cycle' => $billingCycle,
            'amount' => $amount,
            'currency' => 'EGP',
            'method' => $validated['method'],
            'sender_phone' => $validated['sender_phone'] ?? null,
            'sender_name' => $validated['sender_name'] ?? null,
            'transaction_reference' => $validated['transaction_reference'] ?? null,
            'proof_image_path' => $proofPath,
            'status' => OfflinePaymentRequest::STATUS_PENDING,
        ]);

        return response()->json(['data' => $offlinePayment->load('plan')], 201);
    }

    public function index()
    {
        return response()->json([
            'data' => OfflinePaymentRequest::with('plan')
                ->where('user_id', Auth::id())
                ->latest()
                ->get(),
        ]);
    }

    public function show(OfflinePaymentRequest $offlinePaymentRequest)
    {
        abort_unless($offlinePaymentRequest->user_id === Auth::id(), 403);

        return response()->json(['data' => $offlinePaymentRequest->load('plan')]);
    }

    public function cancel(OfflinePaymentRequest $offlinePaymentRequest)
    {
        abort_unless($offlinePaymentRequest->user_id === Auth::id(), 403);

        if ($offlinePaymentRequest->status !== OfflinePaymentRequest::STATUS_PENDING) {
            return response()->json(['message' => 'offline_payment.cannot_cancel'], 422);
        }

        $offlinePaymentRequest->update(['status' => OfflinePaymentRequest::STATUS_CANCELLED]);

        return response()->json(['data' => $offlinePaymentRequest->fresh('plan')]);
    }

    public function adminIndex(Request $request)
    {
        $validated = $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected', 'cancelled'])],
            'method' => ['nullable', Rule::in(['vodafone_cash', 'instapay'])],
        ]);

        $query = OfflinePaymentRequest::with(['user:id,name,email', 'plan', 'admin:id,name,email'])->latest();

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['method'])) {
            $query->where('method', $validated['method']);
        }

        return response()->json(['data' => $query->paginate(25)]);
    }

    public function adminShow(OfflinePaymentRequest $offlinePaymentRequest)
    {
        return response()->json([
            'data' => $offlinePaymentRequest->load(['user:id,name,email', 'plan', 'admin:id,name,email']),
        ]);
    }

    public function proof(OfflinePaymentRequest $offlinePaymentRequest)
    {
        abort_unless($offlinePaymentRequest->proof_image_path, 404);
        abort_unless(Storage::exists($offlinePaymentRequest->proof_image_path), 404);

        return Storage::download($offlinePaymentRequest->proof_image_path);
    }

    public function approve(Request $request, OfflinePaymentRequest $offlinePaymentRequest)
    {
        $validated = $request->validate([
            'admin_note' => ['nullable', 'string', 'max:2000'],
        ]);

        $updated = DB::transaction(function () use ($offlinePaymentRequest, $validated) {
            $offlinePaymentRequest = OfflinePaymentRequest::whereKey($offlinePaymentRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($offlinePaymentRequest->status === OfflinePaymentRequest::STATUS_APPROVED) {
                return $offlinePaymentRequest;
            }

            if ($offlinePaymentRequest->status !== OfflinePaymentRequest::STATUS_PENDING) {
                abort(422, 'offline_payment.not_pending');
            }

            $plan = $offlinePaymentRequest->plan()->firstOrFail();
            $user = $offlinePaymentRequest->user()->firstOrFail();
            $billingCycle = $offlinePaymentRequest->billing_cycle ?: 'monthly';
            $planSlug = $plan->slug . '_' . $billingCycle;

            Subscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            Subscription::updateOrCreate(
                ['payment_reference' => 'offline-' . $offlinePaymentRequest->id],
                [
                    'user_id' => $user->id,
                    'plan_id' => $planSlug,
                    'status' => 'active',
                    'payment_method' => $offlinePaymentRequest->method,
                    'card_last4' => null,
                    'start_date' => now(),
                    'end_date' => $billingCycle === 'yearly' ? now()->addYear() : now()->addMonth(),
                    'plan_limit' => $plan->course_limit,
                    'plan_price' => $plan->price_egp,
                ]
            );

            $user->update([
                'sub_status' => $planSlug,
                'role' => $user->role === 'admin' ? 'admin' : 'premium',
                'subscription_started_at' => now(),
                'monthly_spent_egp' => ((float) $user->monthly_spent_egp) + ((float) $offlinePaymentRequest->amount),
            ]);

            $offlinePaymentRequest->update([
                'status' => OfflinePaymentRequest::STATUS_APPROVED,
                'admin_id' => Auth::id(),
                'admin_note' => $validated['admin_note'] ?? null,
                'approved_at' => now(),
                'rejected_at' => null,
            ]);

            Log::info('Offline payment approved.', [
                'offline_payment_request_id' => $offlinePaymentRequest->id,
                'admin_id' => Auth::id(),
                'user_id' => $user->id,
            ]);

            return $offlinePaymentRequest->fresh(['user:id,name,email', 'plan', 'admin:id,name,email']);
        });

        return response()->json(['data' => $updated]);
    }

    public function reject(Request $request, OfflinePaymentRequest $offlinePaymentRequest)
    {
        $validated = $request->validate([
            'admin_note' => ['required', 'string', 'max:2000'],
        ]);

        $updated = DB::transaction(function () use ($offlinePaymentRequest, $validated) {
            $offlinePaymentRequest = OfflinePaymentRequest::whereKey($offlinePaymentRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($offlinePaymentRequest->status === OfflinePaymentRequest::STATUS_REJECTED) {
                return $offlinePaymentRequest;
            }

            if ($offlinePaymentRequest->status !== OfflinePaymentRequest::STATUS_PENDING) {
                abort(422, 'offline_payment.not_pending');
            }

            $offlinePaymentRequest->update([
                'status' => OfflinePaymentRequest::STATUS_REJECTED,
                'admin_id' => Auth::id(),
                'admin_note' => $validated['admin_note'],
                'rejected_at' => now(),
            ]);

            Log::info('Offline payment rejected.', [
                'offline_payment_request_id' => $offlinePaymentRequest->id,
                'admin_id' => Auth::id(),
                'user_id' => $offlinePaymentRequest->user_id,
            ]);

            return $offlinePaymentRequest->fresh(['user:id,name,email', 'plan', 'admin:id,name,email']);
        });

        return response()->json(['data' => $updated]);
    }
}
