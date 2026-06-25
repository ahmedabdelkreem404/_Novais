<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Http;
use App\Models\User;
use App\Models\Course;
use App\Models\Subscription;
use Illuminate\Support\Str;

// Configuration
$baseUrl = env('APP_URL') . '/api';
$email = 'proof@example.com';
$password = 'password123';

echo "--- STARTING PROOF OF WORK VERIFICATION ---\n\n";

// 1. Authentication
echo "1. AUTHENTICATION\n";
// Register
$response = Http::post("$baseUrl/auth/register", [
    'name' => 'Proof User',
    'email' => $email,
    'password' => $password
]);
echo "Register Response: " . $response->status() . "\n";
$token = $response->json()['token'] ?? null;

if (!$token) {
    // Login if exists
    $response = Http::post("$baseUrl/auth/login", [
        'email' => $email,
        'password' => $password
    ]);
    $token = $response->json()['access_token'] ?? null;
    echo "Login Response: " . $response->status() . "\n";
}

if (!$token) die("Failed to get token. Aborting.\n");

// Helper to safely log response
function logRes($label, $res) {
    echo "$label: " . $res->status() . "\n";
    if ($res->failed()) {
        echo "ERROR BODY: " . substr($res->body(), 0, 200) . "\n";
    } else {
        $json = $res->json();
        if ($json) echo "DATA: " . json_encode($json) . "\n";
    }
    echo "\n";
    return $res->json();
}

$headers = ['Authorization' => "Bearer $token"];
echo "Token Acquired.\n\n";

// 2. AI & Course System
echo "2. AI & COURSE SYSTEM\n";
// Toggle Dark Mode
$res = Http::withHeaders($headers)->post("$baseUrl/user/dark-mode");
logRes("Dark Mode Toggle", $res);

// Generate Text
$res = Http::withHeaders($headers)->post("$baseUrl/generate", ['prompt' => 'Explain Laravel']);
logRes("AI Text Generation", $res);

// Generate Image
$res = Http::withHeaders($headers)->post("$baseUrl/image", ['prompt' => 'Technology']);
logRes("AI Image Generation", $res);

// Restricted APIs (Mock)
$res = Http::withHeaders($headers)->post("$baseUrl/yt", ['prompt' => 'Laravel Tutorial']);
logRes("YouTube Mock", $res);

// Course Saving
$courseData = [
    'mainTopic' => 'Laravel Mastery',
    'type' => 'text',
    'content' => json_encode([
        'Laravel Mastery' => [[
            'title' => 'Laravel Mastery',
            'subtopics' => [
                ['title' => 'Routing', 'theory' => 'Routing is essential.', 'image' => 'http://img.url']
            ]
        ]]
    ])
];
$res = Http::withHeaders($headers)->post("$baseUrl/course", $courseData);
$data = logRes("Course Save", $res);
$courseId = $data['courseId'] ?? null;

// 3. Learning & Export
echo "\n3. LEARNING & EXPORT\n";
if ($courseId) {
    // Certificate
    $res = Http::withHeaders($headers)->post("$baseUrl/courses/$courseId/certificate");
    logRes("Certificate Generation", $res);
    
    // PDF Export
    $res = Http::withHeaders($headers)->get("$baseUrl/courses/$courseId/export/pdf");
    echo "PDF Export Status: " . $res->status() . "\n";
    echo "PDF Size: " . strlen($res->body()) . " bytes\n\n";
}

// 4. Monetization (Webhook Simulation)
echo "\n4. MONETIZATION\n";
$webhookPayload = [
    'payload' => [
        'status' => 'SUCCESS',
        'reference' => 'TRANS_' . Str::random(10),
        'amount' => '1000' // 10.00
    ]
];
// We need to create a payment record first to simulate a real match, 
// OR just verify the webhook logic handles missing payment gracefully or add a dummy payment first.
// For proof, let's just trigger it and see the log output or response.
$res = Http::post("$baseUrl/payment/webhook", $webhookPayload);
logRes("Webhook Response", $res);

// 5. Admin Panel
echo "\n5. ADMIN PANEL\n";
// Promote user to admin
$user = User::where('email', $email)->first();
if ($user) {
    $user->role = 'admin';
    $user->save();
}

// Access Admin Route
$res = Http::withHeaders($headers)->get("$baseUrl/admin/ai-stats"); 
logRes("Admin Stats Access", $res);

// Admin: Promote User 
// (Already done manually above via DB, verifying API access)
$res = Http::withHeaders($headers)->get("$baseUrl/admin/users");
logRes("Admin Get Users", $res);

// 6. Extra Features (Quiz, Chat, Notes)
echo "6. EXTRA FEATURES\n";

// Chatbot
$res = Http::withHeaders($headers)->post("$baseUrl/chat", ['message' => 'Hello AI']);
logRes("Chatbot Response", $res);

if ($courseId) {
    // Quiz Generation
    $res = Http::withHeaders($headers)->post("$baseUrl/courses/$courseId/quiz");
    logRes("Quiz Generation", $res);

    // Personal Notes
    $res = Http::withHeaders($headers)->post("$baseUrl/notes", [
        'course_id' => $courseId,
        'content' => 'My verify note'
    ]);
    logRes("Create Personal Note", $res);

    // Course Sharing
    $res = Http::get("$baseUrl/share/$courseId");
    logRes("Public Share Link check", $res);
}

echo "\n--- VERIFICATION COMPLETE ---\n";
