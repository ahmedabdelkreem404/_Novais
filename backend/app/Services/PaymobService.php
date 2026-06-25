<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymobService
{
    protected $apiKey;
    protected $integrationId;
    protected $iframeId;
    protected $hmacSecret;
    protected $baseUrl = 'https://accept.paymob.com/api';

    public function __construct()
    {
        $this->apiKey = env('PAYMOB_API_KEY');
        $this->integrationId = env('PAYMOB_INTEGRATION_ID');
        $this->iframeId = env('PAYMOB_IFRAME_ID');
        $this->hmacSecret = env('PAYMOB_HMAC_SECRET');
    }

    /**
     * 1. Authentication Request
     */
    protected function getAuthToken()
    {
        $response = Http::post("{$this->baseUrl}/auth/tokens", [
            'api_key' => $this->apiKey
        ]);

        if ($response->successful()) {
            return $response->json()['token'];
        }

        Log::error('Paymob Auth Failed', $response->json());
        throw new \Exception('Paymob Authentication Failed');
    }

    /**
     * 2. Order Registration API
     */
    protected function registerOrder($token, $merchantOrderId, $amountCents)
    {
        $response = Http::post("{$this->baseUrl}/ecommerce/orders", [
            'auth_token' => $token,
            'delivery_needed' => 'false',
            'amount_cents' => $amountCents,
            'currency' => 'EGP',
            'merchant_order_id' => $merchantOrderId,
            'items' => [] // Optional
        ]);

        if ($response->successful()) {
            return $response->json()['id'];
        }

        Log::error('Paymob Order Registration Failed', $response->json());
        throw new \Exception('Paymob Order Registration Failed');
    }

    /**
     * Main function to initiate payment
     */
    public function initiatePayment($data)
    {
        try {
            // 1. Auth
            $authToken = $this->getAuthToken();

            // 2. Order
            $orderId = $this->registerOrder($authToken, $data['reference'], $data['amount'] * 100);

            // 3. Billing Data
            $billingData = [
                "apart_number" => "NA",
                "apartment" => "NA",
                "building" => "NA",
                "city" => "NA",
                "country" => "NA",
                "email" => $data['email'] ?? 'user@example.com',
                "first_name" => $data['first_name'] ?? 'User',
                "floor" => "NA",
                "last_name" => $data['last_name'] ?? 'Name',
                "street" => "NA",
                "phone_number" => $data['phone'] ?? '+201000000000',
                "shipping_method" => "NA",
                "postal_code" => "NA",
                "state" => "NA"
            ];

            // Determine Integration ID based on Method
            $method = $data['payment_method'] ?? 'card'; // card, wallet, fawry
            
            // Default to main integration ID if specific one is missing
            $cardIntId = env('PAYMOB_INTEGRATION_ID_CARD') ?: env('PAYMOB_INTEGRATION_ID');
            $walletIntId = env('PAYMOB_INTEGRATION_ID_WALLET') ?: env('PAYMOB_INTEGRATION_ID'); 
            $fawryIntId = env('PAYMOB_INTEGRATION_ID_FAWRY') ?: env('PAYMOB_INTEGRATION_ID');

            $integrationId = match ($method) {
                'wallet' => $walletIntId,
                'fawry'  => $fawryIntId,
                default  => $cardIntId,
            };

            if (!$integrationId) {
                throw new \Exception("Integration ID not found for method: $method");
            }
            
            Log::info("Paymob Init: Method=$method, IntegrationID=$integrationId");

            // 4. Payment Key
            $paymentKey = $this->getPaymentKey($authToken, $orderId, $data['amount'] * 100, $billingData, $integrationId);

            // 5. Handle Response based on Method
            $url = null;
            if ($method === 'card') {
                $url = "https://accept.paymob.com/api/acceptance/iframes/{$this->iframeId}?payment_token={$paymentKey}";
            } elseif ($method === 'wallet') {
                // For Wallet, we need to make a "Pay" request
                $url = $this->processWalletPayment($paymentKey, $data['phone']);
            }

            return [
                'url' => $url,
                'provider_order_id' => (string) $orderId,
            ];

        } catch (\Exception $e) {
            Log::error('Paymob Init Error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Process Wallet Payment (Vodafone Cash, etc.)
     */
    protected function processWalletPayment($paymentKey, $phone) {
        $payload = [
            'source' => [
                'identifier' => $phone,
                'subtype' => 'WALLET'
            ],
            'payment_token' => $paymentKey
        ];

        // Log::info('Paymob Wallet Request:', $payload); // Disabled for security

        $response = Http::post("{$this->baseUrl}/acceptance/payments/pay", $payload);

        // Log::info('Paymob Wallet Response:', $response->json());

        if ($response->successful()) {
            $data = $response->json();
            
            // Check for explicit failure
            if (isset($data['success']) && $data['success'] === false) {
                $msg = $data['data']['message'] ?? 'Wallet Payment Failed';
                Log::error("Paymob Wallet Failed: $msg", $data);
                throw new \Exception($msg);
            }

            if (!empty($data['redirect_url'])) {
                return $data['redirect_url'];
            }
             if (!empty($data['iframe_url'])) {
                return $data['iframe_url'];
            }
            
            Log::warning('Paymob Wallet Response missing redirect_url', $data);
            throw new \Exception('Payment provider declined the request.');
        }
        
        Log::error('Wallet Payment Failed', $response->json());
        throw new \Exception('Wallet Payment Request Failed');
    }

    /**
     * Updated getPaymentKey to accept Integration ID
     */
    protected function getPaymentKey($token, $orderId, $amountCents, $billingData, $integrationId = null)
    {
        $response = Http::post("{$this->baseUrl}/acceptance/payment_keys", [
            'auth_token' => $token,
            'amount_cents' => $amountCents,
            'expiration' => 3600,
            'order_id' => $orderId,
            'billing_data' => $billingData,
            'currency' => 'EGP',
            'integration_id' => $integrationId ?? $this->integrationId, // Use passed or default
            'lock_order_when_paid' => 'false'
        ]);

        if ($response->successful()) {
            return $response->json()['token'];
        }

        Log::error('Paymob Payment Key Failed', $response->json());
        throw new \Exception('Paymob Payment Key Generation Failed');
    }

    /**
     * Verify HMAC for secure callback
     */
    public function verifyWebhookPayload(array $payload): bool
    {
        if (!$this->hmacSecret) {
            Log::warning('Paymob webhook rejected because HMAC secret is not configured.');
            return false;
        }

        $obj = $payload['obj'] ?? $payload;
        if (!is_array($obj)) {
            return false;
        }

        $hmac = $payload['hmac'] ?? $obj['hmac'] ?? null;
        if (!$hmac) {
            return false;
        }

        $obj['hmac'] = $hmac;

        return $this->verifyHmac($obj);
    }

    /**
     * Verify HMAC for secure callback/webhook transaction payloads.
     */
    public function verifyHmac(array $data)
    {
        // Paymob sends HMAC parameters sorted by key, but specific keys are required in order
        // The order documentation specifies:
        // amount_cents, created_at, currency, error_occured, has_parent_transaction, id, integration_id, is_3d_secure, is_auth, is_capture, is_refunded, is_standalone_payment, is_voided, order, owner, pending, source_data.pan, source_data.sub_type, source_data.type, success
        
        $hmacKeys = [
            'amount_cents',
            'created_at',
            'currency',
            'error_occured',
            'has_parent_transaction',
            'id',
            'integration_id',
            'is_3d_secure',
            'is_auth',
            'is_capture',
            'is_refunded',
            'is_standalone_payment',
            'is_voided',
            'order',
            'owner',
            'pending',
            'source_data.pan',
            'source_data.sub_type',
            'source_data.type',
            'success'
        ];

        $concatenatedString = '';
        foreach ($hmacKeys as $key) {
             // Handle nested keys like source_data.type
             if (strpos($key, '.') !== false) {
                $parts = explode('.', $key);
                $value = $data[$parts[0]][$parts[1]] ?? '';
            } else {
                $value = $data[$key] ?? '';
            }
            if ($key === 'order' && is_array($value)) {
                $value = $value['id'] ?? '';
            }
            // Convert boolean to string "true"/"false"
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            if ($value === null) {
                $value = '';
            }
            $concatenatedString .= $value;
        }

        $calculatedHmac = hash_hmac('sha512', $concatenatedString, $this->hmacSecret);

        return hash_equals($calculatedHmac, (string) ($data['hmac'] ?? ''));
    }
}
