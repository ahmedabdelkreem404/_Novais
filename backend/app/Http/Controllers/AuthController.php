<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeMail;
use App\Mail\VerificationCodeMail;
use App\Models\VerificationCode;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     *
     * @return void
     */
    protected $deviceManager;
    protected $subscriptionService;

    public function __construct(\App\Services\DeviceManager $deviceManager, \App\Services\SubscriptionService $subscriptionService)
    {
        $this->deviceManager = $deviceManager;
        $this->subscriptionService = $subscriptionService;
    }

    /**
     * Register a User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'nullable|string|between:2,100', 
            'first_name' => 'nullable|string|max:50',
            'last_name' => 'nullable|string|max:50',
            'email' => 'required|string|email|max:100',
            'password' => 'required|string|min:6',
            'device_id' => 'required|string'
        ]);

        if($validator->fails()){
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors()
            ], 400);
        }

        $existingUser = User::where('email', $request->email)->first();
        
        // If email is taken and VERIFIED, block registration
        if ($existingUser && $existingUser->email_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'auth.email_taken',
                'errors' => ['email' => ['auth.email_taken']]
            ], 400);
        }

        // Anti-Fraud: Block multiple free accounts from same device
        if (!$this->deviceManager->canRegisterFree($request->device_id)) {
            return response()->json([
                'success' => false,
                'message' => 'auth.device_limit_reached'
            ], 403);
        }

        // If user exists but unverified, update. Otherwise create.
        if ($existingUser) {
            $existingUser->update([
                'name' => $request->get('name') ?: ($request->first_name . ' ' . $request->last_name),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'password' => Hash::make($request->get('password')),
                'registration_device_id' => $request->device_id,
                'preferred_locale' => $request->header('Accept-Language', 'en')
            ]);
            $user = $existingUser;
        } else {
            $user = User::create([
                'name' => $request->get('name') ?: ($request->first_name . ' ' . $request->last_name),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->get('email'),
                'password' => Hash::make($request->get('password')),
                'role' => 'user',
                'sub_status' => 'free',
                'registration_device_id' => $request->device_id,
                'preferred_locale' => $request->header('Accept-Language', 'en')
            ]);
        }

        $this->deviceManager->trackDevice($user, $request->device_id);

        // Delete old codes if any
        VerificationCode::where('email', $user->email)->delete();

        // Generate Verification Code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        VerificationCode::create([
            'email' => $user->email,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinutes(10)
        ]);

        try {
            Mail::to($user->email)->send((new VerificationCodeMail($code))->locale($user->preferred_locale));
        } catch (\Exception $e) {
            \Log::error('Verification Email failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'auth.registration_success_verify',
            'verification_required' => true,
            'email' => $user->email
        ], 201);
    }

    /**
     * Verify Email Address.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $verification = VerificationCode::where('email', $request->email)
            ->where('code', $request->code)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$verification) {
            return response()->json([
                'success' => false,
                'message' => 'auth.invalid_code'
            ], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->email_verified_at = Carbon::now();
        $user->save();

        // Delete used code
        $verification->delete();

        // Send Welcome Mail
        try {
            Mail::to($user->email)->send((new WelcomeMail($user))->locale($user->preferred_locale));
        } catch (\Exception $e) {
             \Log::error('Welcome Email failed: ' . $e->getMessage());
        }

        $token = auth('api')->login($user);
        return $this->createNewToken($token);
    }

    /**
     * Resend Verification Code.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendVerificationCode(Request $request)
    {
        $request->validate(['email' => 'required|email|exists:users,email']);

        $user = User::where('email', $request->email)->first();

        if ($user->email_verified_at) {
            return response()->json([
                'success' => false,
                'message' => 'auth.email_already_verified'
            ], 400);
        }

        // Delete old codes
        VerificationCode::where('email', $request->email)->delete();

        // Generate New Code
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        VerificationCode::create([
            'email' => $request->email,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinutes(10)
        ]);

        // Update preferred locale if header is provided
        $currentLocale = $request->header('Accept-Language', $user->preferred_locale);
        if ($user->preferred_locale !== $currentLocale) {
            $user->update(['preferred_locale' => $currentLocale]);
        }

        try {
            Mail::to($request->email)->send((new VerificationCodeMail($code))->locale($currentLocale));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to send verification email'], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'auth.new_code_sent'
        ]);
    }

    /**
     * Get a JWT via given credentials.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $credentials = [
            'email' => strtolower(trim($request->email)),
            'password' => $request->password,
        ];

        \Log::info('Login Attempt Normalised', ['email' => $credentials['email']]);

        $validator = Validator::make($credentials, [
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $credentials['email'])->first();
        $invalidLoginResponse = ['error' => 'Unauthorized', 'success' => false, 'message' => 'auth.invalid_credentials'];

        if (!$user) {
            \Log::warning('Login Failed: User not found', ['email' => $credentials['email']]);
            return response()->json($invalidLoginResponse, 401);
        }

        if (!Hash::check($credentials['password'], $user->password)) {
            \Log::warning('Login Failed: Password mismatch', ['email' => $credentials['email']]);
            return response()->json($invalidLoginResponse, 401);
        }

        // Check if email is verified
        if (!$user->email_verified_at) {
            return response()->json([
                'success' => false,
                'verification_required' => true,
                'email' => $user->email,
                'message' => 'auth.verification_required'
            ], 403);
        }

        if (! $token = auth('api')->login($user)) {
            \Log::warning('Login Failed: Could not generate token', ['email' => $credentials['email']]);
            return response()->json(['error' => 'Unauthorized', 'success' => false, 'message' => 'Token generation failed'], 401);
        }

        // Track Device
        if ($request->has('device_id')) {
            $this->deviceManager->trackDevice($user, $request->device_id);
        }

        return $this->createNewToken($token);
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json(['message' => 'User successfully signed out']);
    }

    /**
     * Refresh a token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        return $this->createNewToken(JWTAuth::refresh());
    }

    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function userProfile()
    {
        $user = auth('api')->user();
        $subscription = $user->subscriptions()->where('status', 'active')->latest()->first();
        
        $userData = $this->clientUserData($user);
        $userData['current_subscription'] = $subscription;
        $userData['subscription_usage'] = $this->subscriptionService->getUserUsage($user);

        return response()->json($userData);
    }

    /**
     * Update the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        $user = auth('api')->user();
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|between:2,100',
            'email' => 'required|string|email|max:100|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:6',
        ]);

        if($validator->fails()){
            return response()->json($validator->errors(), 400);
        }

        $user->name = $request->name;
        $user->email = $request->email;
        
        if($request->has('password') && $request->password){
            $user->password = Hash::make($request->password);
        }

        if ($request->has('language')) $user->language = $request->language;
        if ($request->has('country')) $user->country = $request->country;
        if ($request->has('timezone')) $user->timezone = $request->timezone;
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = '/storage/' . $path;
        } elseif ($request->has('avatar') && is_string($request->avatar)) {
            $user->avatar = $request->avatar;
        }
        
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
            'success' => true
        ]);
    }

    /**
     * Get the token array structure.
     *
     * @param  string $token
     *
     * @return \Illuminate\Http\JsonResponse
     */
    protected function createNewToken($token)
    {
        $user = auth('api')->user();
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth('api')->factory()->getTTL() * 60,
            'user' => $this->clientUserData($user),
            'success' => true,
            'message' => 'auth.login_success' // Frontend expects this message
        ]);
    }

    private function clientUserData(User $user): array
    {
        $data = $user->toArray();
        $data['subscription_type'] = $this->clientSubscriptionType($user);
        $data['course_limit'] = $this->subscriptionService->getUserUsage($user)['limit'] ?? null;
        $data['is_admin'] = $user->role === 'admin';
        $data['email_verified'] = (bool) $user->email_verified_at;

        return $data;
    }

    private function clientSubscriptionType(User $user): string
    {
        if ($user->role === 'admin') {
            return 'elite';
        }

        $status = strtolower((string) ($user->sub_status ?: 'free'));

        if (str_contains($status, 'elite')) {
            return 'elite';
        }

        if (str_contains($status, 'pro') || str_contains($status, 'premium')) {
            return 'pro';
        }

        return 'free';
    }
    /**
     * Google Login
     */
    public function redirectToGoogle(Request $request)
    {
        $platform = $request->query('platform', 'web');
        $deviceId = $request->query('device_id', '');

        return \Laravel\Socialite\Facades\Socialite::driver('google')
            ->with(['state' => "platform=$platform&device_id=$deviceId"])
            ->stateless()
            ->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $state = $request->query('state');
            parse_str($state, $stateParams);
            $platform = $stateParams['platform'] ?? 'web';
            $deviceId = $stateParams['device_id'] ?? '';

            $googleUser = \Laravel\Socialite\Facades\Socialite::driver('google')->stateless()->user();
            
            $user = User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                $user = User::create([
                    'name' => $googleUser->getName(),
                    'email' => $googleUser->getEmail(),
                    'password' => Hash::make(\Illuminate\Support\Str::random(16)), // Random password
                    'social_id' => $googleUser->getId(),
                    'social_type' => 'google',
                    'avatar' => $googleUser->getAvatar(),
                    'role' => 'user',
                    'sub_status' => 'free',
                    'registration_device_id' => $deviceId,
                    'preferred_locale' => $request->header('Accept-Language', 'en')
                ]);
            } else {
                // Link account if not linked
                if (!$user->social_id) {
                    $user->update([
                        'social_id' => $googleUser->getId(),
                        'social_type' => 'google',
                        'avatar' => $googleUser->getAvatar()
                    ]);
                }
            }

            // Track Device if ID is present
            if ($deviceId) {
                $this->deviceManager->trackDevice($user, $deviceId);
            }

            $token = JWTAuth::fromUser($user);

            // Frontend redirection with token
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            
            // Fix: Add hash for desktop/HashRouter environments
            $redirectPath = ($platform === 'desktop') 
                ? "/#/auth/social/callback?token=$token" 
                : "/auth/social/callback?token=$token";

            return redirect($frontendUrl . $redirectPath);

        } catch (\Exception $e) {
            \Log::error('Google Login Error: ' . $e->getMessage());
            return response()->json(['error' => 'Google Login Failed', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Forgot Password
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();
        $genericResponse = ['message' => 'If this email exists, a reset link will be sent.'];

        if (!$user) {
            return response()->json($genericResponse);
        }

        $token = \Illuminate\Support\Str::random(60);
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            ['token' => $token, 'created_at' => now()]
        );

        // Send Email
        $currentLocale = $request->header('Accept-Language', $user->preferred_locale ?? 'en');
        
        // Update user preference if requested from a different language
        if ($user && $user->preferred_locale !== $currentLocale) {
            $user->update(['preferred_locale' => $currentLocale]);
        }

        try {
            \Illuminate\Support\Facades\Mail::to($request->email)->send((new \App\Mail\ResetPasswordMail($token))->locale($currentLocale));
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to send email'], 500);
        }

        return response()->json($genericResponse);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed'
        ]);

        $record = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->where('token', $request->token)
            ->first();

        if (!$record) {
             return response()->json(['error' => 'Invalid token'], 400);
        }

        $user = User::where('email', $request->email)->first();
        $user->update(['password' => Hash::make($request->password)]);

        // Delete token
        \Illuminate\Support\Facades\DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json(['message' => 'Password reset successfully']);
    }

    public function validateResetToken($token)
    {
        $record = \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('token', $token)
            ->first();

        if (!$record) {
             return response()->json(['valid' => false, 'message' => 'Invalid token'], 404);
        }

        return response()->json(['valid' => true, 'email' => $record->email]);
    }
}
