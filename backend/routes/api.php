<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;


Route::prefix('auth')->group(function () {
    // Social Login - Excluded from check_device because redirects don't send headers
    Route::get('/google', [AuthController::class, 'redirectToGoogle']);
    Route::get('/google/callback', [AuthController::class, 'handleGoogleCallback']);

    Route::middleware(['check_device', 'throttle:10,1'])->group(function () {
        // Public routes
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/register', [AuthController::class, 'register']);
        
        // Forgot Password
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
        Route::post('/reset-password', [AuthController::class, 'resetPassword']);
        Route::get('/validate-reset-token/{token}', [AuthController::class, 'validateResetToken']);

        // Email Verification
        Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
        Route::post('/resend-verification', [AuthController::class, 'resendVerificationCode']);
    });

    // Protected routes
    Route::middleware('auth:api')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/user-profile', [AuthController::class, 'userProfile']);
        Route::post('/user-profile', [AuthController::class, 'updateProfile']);
        Route::put('/user-profile', [AuthController::class, 'updateProfile']);
        Route::get('/profile', [AuthController::class, 'userProfile']); 
        Route::post('/profile', [AuthController::class, 'updateProfile']);
    });
});

// Create a mapping to old API routes if needed, or update Frontend.
// Frontend expects /api/signin and /api
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/


Route::middleware('auth:api')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Flag for Dark Mode
    Route::post('/user/dark-mode', function(Request $request) {
        $request->validate(['dark_mode' => 'required|boolean']);
        $request->user()->update(['dark_mode' => $request->dark_mode]);
        return response()->json(['success' => true]);
    });

    // Course Management
    Route::get('/courses', [\App\Http\Controllers\CourseController::class, 'index']);
    Route::post('/courses', [\App\Http\Controllers\CourseController::class, 'store']);
    Route::post('/generate-course', [\App\Http\Controllers\CourseController::class, 'generateCourse'])->middleware('check_device');
    Route::put('/courses/{id}', [\App\Http\Controllers\CourseController::class, 'update']); // Update course metadata
    Route::get('/courses/{id}', [\App\Http\Controllers\CourseController::class, 'show']);
    Route::delete('/courses/{id}', [\App\Http\Controllers\CourseController::class, 'destroy']);
    Route::get('/courses/{courseId}/lessons/{lessonId}', [\App\Http\Controllers\CourseController::class, 'getLesson']);
    Route::post('/courses/{id}/share', [\App\Http\Controllers\CourseController::class, 'createShareLink']); // Generate Share Link
    
    // Quiz & Chat & Notes
    Route::post('/courses/{id}/quiz', [\App\Http\Controllers\CourseController::class, 'createQuiz']);
    Route::get('/courses/{id}/quiz', [\App\Http\Controllers\CourseController::class, 'getQuizzes']);
    Route::post('/chat', [\App\Http\Controllers\ChatController::class, 'sendMessage']);
    Route::post('/courses/{id}/certificate', [\App\Http\Controllers\CertificateController::class, 'generate']); // Generate & Download
    Route::post('/translate-title', [\App\Http\Controllers\AIController::class, 'translateTitle']);
    Route::get('/courses/{courseId}/chat/history', [\App\Http\Controllers\ChatController::class, 'getHistory']);
    
    // Personal Notes
    Route::apiResource('notes', \App\Http\Controllers\NoteController::class);

    // Payment Checkout
    Route::post('/payment/checkout', [\App\Http\Controllers\PaymentController::class, 'initCheckout']);
    Route::post('/payment/cancel-subscription', [\App\Http\Controllers\PaymentController::class, 'cancelSubscription']);
    Route::get('/offline-payments/instructions', [\App\Http\Controllers\OfflinePaymentController::class, 'instructions']);
    Route::get('/offline-payments', [\App\Http\Controllers\OfflinePaymentController::class, 'index']);
    Route::post('/offline-payments', [\App\Http\Controllers\OfflinePaymentController::class, 'store'])->middleware('throttle:5,1');
    Route::get('/offline-payments/{offlinePaymentRequest}', [\App\Http\Controllers\OfflinePaymentController::class, 'show']);
    Route::post('/offline-payments/{offlinePaymentRequest}/cancel', [\App\Http\Controllers\OfflinePaymentController::class, 'cancel']);
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllRead']);
    Route::post('/notifications/{notification}/read', [\App\Http\Controllers\NotificationController::class, 'markRead']);
    Route::post('/notification-devices', [\App\Http\Controllers\NotificationController::class, 'registerDevice']);
});

// Public Share Route (via Token)
Route::get('/share/{token}', [\App\Http\Controllers\CourseController::class, 'getSharedCourse']); 

// Dynamic Pages (Terms, Privacy, etc.)
Route::prefix('pages')->group(function () {
    Route::get('/{slug}', [\App\Http\Controllers\PageController::class, 'show']);
});

// Frontend Atomic Generation Endpoints (Protected)
Route::get('/test-auth', function () {
    $token = JWTAuth::getToken();
    if (!$token) {
        return response()->json(['error' => 'auth.no_token_provided'], 400);
    }
    try {
        $user = JWTAuth::parseToken()->authenticate();
        return response()->json([
            'user' => $user,
            'token' => (string) $token,
            'message' => 'auth.token_is_valid'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
            'token' => (string) $token
        ], 401);
    }
});

Route::middleware('auth:api')->group(function () {
    Route::post('/generate', [\App\Http\Controllers\AIController::class, 'generate']);
    Route::post('/image', [\App\Http\Controllers\AIController::class, 'generateImage']);
    Route::post('/yt', [\App\Http\Controllers\AIController::class, 'generateVideo']); // Mock
    Route::post('/transcript', [\App\Http\Controllers\AIController::class, 'generateTranscript']); // Mock
    Route::post('/generate-lesson', [\App\Http\Controllers\AIController::class, 'generateLesson']); // Lazy Loading Endpoint
    
    // Course Save Endpoint (Legacy frontend uses /api/course singular)
    Route::post('/course', [\App\Http\Controllers\CourseController::class, 'store']);
    
    // Certificate Routes
    Route::post('/courses/{id}/certificate', [\App\Http\Controllers\CertificateController::class, 'generate']);
    
    // Export Routes
    Route::get('/courses/{id}/export/pdf', [\App\Http\Controllers\ExportController::class, 'exportPdf']);
    Route::get('/courses/{id}/export/ppt', [\App\Http\Controllers\ExportController::class, 'exportPpt']);
    
    // User Settings
    Route::post('/user/dark-mode', [\App\Http\Controllers\UserController::class, 'toggleDarkMode']);

    // Desktop App
    Route::get('/download-app', [\App\Http\Controllers\DesktopAppController::class, 'download']);
});

// Public Certificate Download
Route::get('/certificate/{code}', [\App\Http\Controllers\CertificateController::class, 'download'])->name('certificate.download');

// Ad Config
Route::get('/config/ads', [\App\Http\Controllers\AdController::class, 'getAdsConfig']);

// Public / Webhook Routes
Route::post('/payment/webhook', [\App\Http\Controllers\PaymentController::class, 'webhook'])->name('payment.webhook');
Route::get('/payment/callback', [\App\Http\Controllers\PaymentController::class, 'callback'])->name('payment.callback');
Route::get('/payment/cancel', [\App\Http\Controllers\PaymentController::class, 'cancel'])->name('payment.cancel');

// Public CMS
Route::get('/blogs', [\App\Http\Controllers\CMSController::class, 'getBlogs']);
Route::get('/blogs/{slug}', [\App\Http\Controllers\CMSController::class, 'getBlog']);
Route::get('/pages/{slug}', [\App\Http\Controllers\CMSController::class, 'getPage']);
Route::post('/contact', [\App\Http\Controllers\ContactController::class, 'store']);
Route::get('/policies', [\App\Http\Controllers\PolicyController::class, 'index']);
Route::get('/social-links', [\App\Http\Controllers\SocialLinkController::class, 'index']);
Route::get('/plans', [\App\Http\Controllers\CMSController::class, 'getPlans']);
Route::get('/platform-config', [\App\Http\Controllers\PlatformConfigController::class, 'show']);
Route::get('/platform-settings', [\App\Http\Controllers\PlatformConfigController::class, 'show']);
Route::get('/content-blueprints', [\App\Http\Controllers\ContentBlueprintController::class, 'index']);

// Admin Routes
Route::middleware(['auth:api', 'is_admin'])->prefix('admin')->group(function () {
    // Social Links Admin
    Route::get('/social-links', [\App\Http\Controllers\SocialLinkController::class, 'adminIndex']);
    Route::post('/social-links', [\App\Http\Controllers\SocialLinkController::class, 'store']);
    Route::put('/social-links/{id}', [\App\Http\Controllers\SocialLinkController::class, 'update']);
    Route::delete('/social-links/{id}', [\App\Http\Controllers\SocialLinkController::class, 'destroy']);
    Route::get('/stats', [\App\Http\Controllers\AdminController::class, 'stats']);
    Route::get('/ai-stats', [\App\Http\Controllers\AdminController::class, 'getAiStats']);
    Route::get('/users', [\App\Http\Controllers\AdminController::class, 'getUsers']);
    Route::get('/admins', [\App\Http\Controllers\AdminController::class, 'getAdmins']);
    Route::get('/paid-users', [\App\Http\Controllers\AdminController::class, 'getPaidUsers']);
    Route::post('/users/{id}/premium', [\App\Http\Controllers\AdminController::class, 'assignPremium']);
    Route::delete('/users/{id}', [\App\Http\Controllers\AdminController::class, 'deleteUser']);
    
    // Plan Management
    Route::get('/plans', [\App\Http\Controllers\AdminController::class, 'getPlans']);
    Route::put('/plans/{id}', [\App\Http\Controllers\AdminController::class, 'updatePlan']);

    // Offline Payment Management
    Route::get('/offline-payments', [\App\Http\Controllers\OfflinePaymentController::class, 'adminIndex']);
    Route::get('/offline-payments/{offlinePaymentRequest}', [\App\Http\Controllers\OfflinePaymentController::class, 'adminShow']);
    Route::get('/offline-payments/{offlinePaymentRequest}/proof', [\App\Http\Controllers\OfflinePaymentController::class, 'proof']);
    Route::post('/offline-payments/{offlinePaymentRequest}/approve', [\App\Http\Controllers\OfflinePaymentController::class, 'approve']);
    Route::post('/offline-payments/{offlinePaymentRequest}/reject', [\App\Http\Controllers\OfflinePaymentController::class, 'reject']);

    Route::get('/courses', [\App\Http\Controllers\AdminController::class, 'getCourses']);
    Route::put('/courses/{id}', [\App\Http\Controllers\AdminController::class, 'updateCourse']);
    Route::get('/courses/{id}/lessons', [\App\Http\Controllers\AdminController::class, 'getCourseLessons']);
    Route::put('/lessons/{id}', [\App\Http\Controllers\AdminController::class, 'updateLesson']);
    Route::post('/media/upload', [\App\Http\Controllers\MediaController::class, 'upload']);
    Route::get('/contacts', [\App\Http\Controllers\ContactController::class, 'index']); // Admin Get Contacts
    Route::post('/contacts/{id}/reply', [\App\Http\Controllers\ContactController::class, 'reply']);
    Route::delete('/contacts/{id}', [\App\Http\Controllers\ContactController::class, 'destroy']);
    Route::put('/contacts/{id}/read', [\App\Http\Controllers\ContactController::class, 'updateStatus']);
    Route::post('/users/promote', [\App\Http\Controllers\AdminController::class, 'promoteUser']);
    Route::post('/users/demote', [\App\Http\Controllers\AdminController::class, 'demoteUser']);
    Route::post('/admins/promote/{id}', [\App\Http\Controllers\AdminController::class, 'promoteUserById']);
    Route::post('/admins/demote/{id}', [\App\Http\Controllers\AdminController::class, 'demoteUserById']);
    Route::delete('/courses/{id}', [\App\Http\Controllers\AdminController::class, 'deleteCourse']);

    // CMS Admin
    Route::post('/blogs', [\App\Http\Controllers\CMSController::class, 'storeBlog']);
    Route::put('/blogs/{id}', [\App\Http\Controllers\CMSController::class, 'updateBlog']);
    Route::delete('/blogs/{id}', [\App\Http\Controllers\CMSController::class, 'deleteBlog']);
    Route::put('/pages/{slug}', [\App\Http\Controllers\CMSController::class, 'updatePage']);
    
    // Policy Pages Management (Dynamic route handles terms, privacy, etc.)
    Route::get('/pages/{slug}', [\App\Http\Controllers\PageController::class, 'show']);
    Route::put('/pages/{slug}', [\App\Http\Controllers\PageController::class, 'update']);
    Route::post('/pages/{slug}', [\App\Http\Controllers\PageController::class, 'update']);

    // Platform Config Admin
    Route::get('/platform-config', [\App\Http\Controllers\PlatformConfigController::class, 'adminShow']);
    Route::put('/platform-config', [\App\Http\Controllers\PlatformConfigController::class, 'update']);
    Route::get('/platform-settings', [\App\Http\Controllers\PlatformConfigController::class, 'adminShow']);
    Route::put('/platform-settings', [\App\Http\Controllers\PlatformConfigController::class, 'update']);
    Route::get('/content-blueprints', [\App\Http\Controllers\ContentBlueprintController::class, 'adminIndex']);
    Route::post('/content-blueprints', [\App\Http\Controllers\ContentBlueprintController::class, 'store']);
    Route::put('/content-blueprints/{contentBlueprint}', [\App\Http\Controllers\ContentBlueprintController::class, 'update']);
    Route::delete('/content-blueprints/{contentBlueprint}', [\App\Http\Controllers\ContentBlueprintController::class, 'destroy']);
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'adminIndex']);
    Route::post('/notifications', [\App\Http\Controllers\NotificationController::class, 'adminStore']);
});
