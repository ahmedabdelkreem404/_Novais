<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PaymobService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    private const PAID_STATUSES = ['pro_monthly', 'pro_yearly', 'elite_monthly', 'elite_yearly'];

    protected $paymobService;

    public function __construct(PaymobService $paymobService)
    {
        $this->paymobService = $paymobService;
    }

    public function initCheckout(Request $request)
    {
        $request->validate([
            'plan_id' => ['required', 'string', Rule::in(self::PAID_STATUSES)],
            'payment_method' => ['nullable', 'string', Rule::in(['card', 'wallet'])],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'common.unauthorized'], 401);
        }
        
        $subscriptionService = app(\App\Services\SubscriptionService::class);
        $configs = $subscriptionService->getPlanConfigs();

        $planId = $request->plan_id;
        $planKey = str_replace(['_monthly', '_yearly'], '', $planId);
        $plan = $configs[$planKey] ?? $configs['pro'];
        $amount = str_contains($planId, 'yearly') ? ((int) $plan['price']) * 10 : (int) $plan['price'];

        $reference = 'ORD-' . uniqid() . '-' . $user->id;

        // Create Payment Record (Pending)
        $payment = Payment::create([
            'user_id' => $user->id,
            'transaction_id' => $reference,
            'plan_id' => $planId,
            'amount' => $amount,
            'currency' => 'EGP',
            'status' => 'pending',
        ]);

        try {
            // Initiate Paymob Payment
            $session = $this->paymobService->initiatePayment([
                'reference' => $reference, // Acts as merchant_order_id
                'amount' => $amount,
                'email' => $user->email,
                'first_name' => explode(' ', $user->name)[0] ?? 'User',
                'last_name' => explode(' ', $user->name)[1] ?? 'Name',
                'phone' => $request->phone ?? '01000000000', // Take phone from request for Wallets
                'payment_method' => $request->payment_method ?? 'card' // card, wallet
            ]);

            $url = is_array($session) ? ($session['url'] ?? null) : $session;
            $providerOrderId = is_array($session) ? ($session['provider_order_id'] ?? null) : null;

            if ($providerOrderId) {
                $payment->update(['provider_order_id' => (string) $providerOrderId]);
            }

            return response()->json([
                'url' => $url,
                'checkout_url' => $url,
                'reference' => $reference,
            ]);

        } catch (\Exception $e) {
            Log::error('Payment Init Failed: ' . $e->getMessage()); 
            // Return the specific error message to the user if possible
            $msg = $e->getMessage();
            // Basic sanitization: ensure it's not a system error
            if (str_contains($msg, 'SQLstate') || str_contains($msg, 'defined')) {
                $msg = 'common.payment_init_failed';
            }
            return response()->json(['message' => $msg, 'error' => 'common.payment_init_failed'], 500);
        }
    }

    public function webhook(Request $request)
    {
        // Handle Paymob Webhook (Transaction Processed)
        $data = $request->all();

        if (!$this->paymobService->verifyWebhookPayload($data)) {
            Log::warning('Rejected Paymob webhook with invalid HMAC.', [
                'merchant_order_id' => $data['obj']['order']['merchant_order_id'] ?? null,
                'transaction_id' => $data['obj']['id'] ?? null,
            ]);

            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $type = $data['type'] ?? '';
        $obj = $data['obj'] ?? [];

        if ($type !== 'TRANSACTION') {
            return response()->json(['status' => 'ignored']);
        }

        $merchantOrderId = $obj['order']['merchant_order_id'] ?? null;
        $providerOrderId = $obj['order']['id'] ?? null;
        $transactionId = isset($obj['id']) ? (string) $obj['id'] : null;

        if (!$merchantOrderId) {
            return response()->json(['status' => 'ignored']);
        }

        DB::transaction(function () use ($merchantOrderId, $providerOrderId, $transactionId, $obj) {
            $payment = Payment::where('transaction_id', $merchantOrderId)->lockForUpdate()->first();
            if (!$payment || $payment->status === 'paid') {
                return;
            }

            if ($providerOrderId && $payment->provider_order_id && (string) $payment->provider_order_id !== (string) $providerOrderId) {
                Log::warning('Paymob webhook provider order mismatch.', [
                    'payment_id' => $payment->id,
                    'expected' => $payment->provider_order_id,
                    'actual' => $providerOrderId,
                ]);
                return;
            }

            $amountCents = (int) ($obj['amount_cents'] ?? 0);
            if ($amountCents > 0 && $amountCents !== (int) round(((float) $payment->amount) * 100)) {
                Log::warning('Paymob webhook amount mismatch.', [
                    'payment_id' => $payment->id,
                    'expected' => (int) round(((float) $payment->amount) * 100),
                    'actual' => $amountCents,
                ]);
                return;
            }

            if (($obj['success'] ?? false) === true) {
                $payment->update([
                    'status' => 'paid',
                    'provider_order_id' => $providerOrderId ? (string) $providerOrderId : $payment->provider_order_id,
                    'provider_transaction_id' => $transactionId,
                    'paid_at' => now(),
                    'payload' => $obj,
                ]);
                $this->activateSubscription($payment->fresh(), $transactionId);
                return;
            }

            $payment->update([
                'status' => ($obj['pending'] ?? false) ? 'pending' : 'failed',
                'provider_order_id' => $providerOrderId ? (string) $providerOrderId : $payment->provider_order_id,
                'provider_transaction_id' => $transactionId,
                'failed_at' => ($obj['pending'] ?? false) ? null : now(),
                'payload' => $obj,
            ]);
        });

        return response()->json(['status' => 'ok']);
    }

    protected function activateSubscription(Payment $payment, $paymentReference)
    {
        $userId = $payment->user_id;
        $planId = $payment->plan_id ?: 'pro_monthly';

        // Cancel any existing active subscriptions
        Subscription::where('user_id', $userId)->where('status', 'active')->update(['status' => 'cancelled']);
        $subscriptionService = app(\App\Services\SubscriptionService::class);
        $configs = $subscriptionService->getPlanConfigs();
        $planKey = str_replace(['_monthly', '_yearly'], '', $planId);
        $planConfig = $configs[$planKey] ?? $configs['free'];
        $isYearly = str_contains($planId, 'yearly');

        // Add subscription logic
        $subscription = Subscription::create([
            'user_id' => $userId,
            'payment_reference' => $paymentReference,
            'plan_id' => $planId,
            'status' => 'active',
            'payment_method' => 'Paymob',
            'card_last4' => '****', // Simplified as payload structure changed
            'start_date' => now(),
            'end_date' => $isYearly ? now()->addYear() : now()->addMonth(),
        ]);
        
        $user = User::find($userId);
        if ($user) {
            $user->update([
                'sub_status' => $planId,
                'role' => $user->role === 'admin' ? 'admin' : 'premium',
                'subscription_started_at' => now(),
                'monthly_spent_egp' => ((float) $user->monthly_spent_egp) + ((float) $payment->amount),
            ]);

            $subscription->update([
                'plan_limit' => $planConfig['limit'],
                'plan_price' => $isYearly ? ((int) $planConfig['price']) * 10 : (int) $planConfig['price'],
            ]);
            
            // Generate Invoice PDF
            // ... (rest of the code)
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('invoices.template', ['payment' => $payment]);
            
            // Send Email
            try {
                \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\PaymentSuccessMail($user, $payment, $pdf->output()));
            } catch (\Exception $e) {
                Log::error("Failed to send payment email: " . $e->getMessage());
            }
        }
    }
    
    public function callback(Request $request)
    {
        $reference = $request->query('reference');

        if ($reference) {
            $payment = Payment::where('transaction_id', $reference)->first();
            if ($payment && $payment->status === 'paid') {
                // Redirect to frontend success page
                $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
                return redirect($frontendUrl . '/payment-success?reference=' . $reference);
            }
        }

        // Redirect to frontend failure/cancel page
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
        return redirect($frontendUrl . '/payment-failed');
    }
    
    public function cancel(Request $request)
    {
        $reference = $request->query('reference');
        if ($reference) {
            Payment::where('transaction_id', $reference)
                ->where('status', 'pending')
                ->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                    'payload' => ['cancelled_from' => 'return_url'],
                ]);
        }

        return response()->json(['message' => 'common.payment_cancelled']);
    }

    public function cancelSubscription(Request $request)
    {
        $user = Auth::user();

        if ($user->role === 'admin') {
            return response()->json(['success' => true, 'message' => 'common.subscription_cancelled']);
        }

        // Logic to cancel at Paymob end if recurring, or just local
        $user->update(['sub_status' => 'free', 'role' => 'user']);
        
        Subscription::where('user_id', $user->id)->where('status', 'active')->update(['status' => 'cancelled']);

        // Send Email
        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\SubscriptionCancelledMail($user));
        } catch (\Exception $e) {
             Log::error("Failed to send cancellation email: " . $e->getMessage());
        }

        return response()->json(['success' => true, 'message' => 'common.subscription_cancelled']);
    }
}
