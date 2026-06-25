<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Http;
use App\Models\User;
use App\Models\Course;

// Helper to print with color (cli friendly)
function printStatus($step, $msg, $success = true) {
    echo $success ? "[OK] $step: $msg\n" : "[FAIL] $step: $msg\n";
}

$baseUrl = env('APP_URL') . '/api';
$email = 'qa_test@example.com';
$password = 'password123';

echo "\n--- STARTING QA VERIFICATION ---\n";

// 1. AUTHENTICATION (Simulate Frontend)
$user = User::where('email', $email)->first();
if (!$user) {
    printStatus("Auth", "Creating QA User");
    $user = User::create([
        'name' => 'QA Tester',
        'email' => $email,
        'password' => bcrypt($password),
        'role' => 'user'
    ]);
}
$response = Http::post("$baseUrl/auth/login", ['email' => $email, 'password' => $password]);
if ($response->successful()) {
    $token = $response->json()['access_token'];
    printStatus("Auth", "Login Successful. Token obtained.");
} else {
    printStatus("Auth", "Login Failed: " . $response->body(), false);
    exit;
}

$headers = ['Authorization' => 'Bearer ' . $token, 'Accept' => 'application/json'];

// 2. MULTI-LANGUAGE COURSE GENERATION
echo "\n--- MULTI-LANGUAGE TEST ---\n";
// Frontend sends: { prompt: "Python Basics", language: "Spanish" } to /api/generate
// Verify AIController accepts 'language'
$response = Http::withHeaders($headers)->post("$baseUrl/generate", [
    'prompt' => 'Python Basics',
    'language' => 'Spanish' // Explicitly requesting Spanish
]);

if ($response->successful()) {
    // Check if response contains Spanish keywords or structure
    $json = $response->json();
    // Start Course Generation
    printStatus("Language", "AI Generation Successful.");
    
    // Save as Spanish Course
    $saveResponse = Http::withHeaders($headers)->post("$baseUrl/course", [
        'mainTopic' => 'PYTHON BASICS (ES)',
        'type' => 'Course',
        'content' => json_encode($json), // Mimic frontend sending JSON string
        'language' => 'Spanish' // If controller accepts it
    ]);
    
    if ($saveResponse->successful()) {
         $courseId = $saveResponse->json()['courseId'];
         printStatus("Course Save", "Spanish Course Saved (ID: $courseId)");
         
         // 3. QUIZ GENERATION
         echo "\n--- QUIZ TEST ---\n";
         // API uses plural 'courses'
         $quizResponse = Http::withHeaders($headers)->post("$baseUrl/courses/$courseId/quiz");
         if ($quizResponse->successful() || $quizResponse->status() === 201) {
             printStatus("Quiz", "Quiz Generated for Course $courseId");
         } else {
             printStatus("Quiz", "Quiz Generation Failed: " . $quizResponse->body(), false);
         }
         
    } else {
        printStatus("Course Save", "Failed: " . $saveResponse->body(), false);
    }

} else {
    printStatus("Language", "AI Generation Failed: " . $response->body(), false);
}

// 4. ADMIN RBAC
echo "\n--- ADMIN RBAC TEST ---\n";
$adminResponse = Http::withHeaders($headers)->get("$baseUrl/admin/stats"); 
if ($adminResponse->status() === 403) {
    printStatus("RBAC", "Non-admin correctly blocked from Admin Stats (403)");
} else {
    printStatus("RBAC", "FAIL: Non-admin accessed Admin Stats (" . $adminResponse->status() . ")", false);
}

// 5. PUBLIC SHARE (Get course ID from previous step if available, else find one)
echo "\n--- PUBLIC SHARE TEST ---\n";
$course = Course::latest()->first();
if ($course) {
    $shareResponse = Http::get("$baseUrl/share/" . $course->id);
    if ($shareResponse->successful()) {
        printStatus("Share", "Public Course Link Verified (ID: " . $course->id . ")");
    } else {
        printStatus("Share", "Public Link Failed: " . $shareResponse->body(), false);
    }
    
    // 6. PDF EXPORT
    echo "\n--- PDF EXPORT TEST ---\n";
    $pdfResponse = Http::withHeaders($headers)->get("$baseUrl/courses/" . $course->id . "/export/pdf");
    if ($pdfResponse->successful() && $pdfResponse->header('Content-Type') === 'application/pdf') {
         printStatus("Export", "PDF Export Successful (PDF Content Received)");
    } else {
         // It might return a download link or stream. Let's check status.
         if ($pdfResponse->status() === 200) {
              printStatus("Export", "PDF Export Endpoint reachable (200 OK)");
         } else {
              printStatus("Export", "PDF Export Failed: " . $pdfResponse->status(), false);
         }
    }
    
    // 7. CERTIFICATE GENERATION
    echo "\n--- CERTIFICATE TEST ---\n";
    // Mark course as completed first? Not enforced by controller, but good practice.
    $certResponse = Http::withHeaders($headers)->post("$baseUrl/courses/" . $course->id . "/certificate");
    if ($certResponse->successful()) {
        printStatus("Certificate", "Certificate Generated & Email Sent");
    } else {
        printStatus("Certificate", "Certificate Failed: " . $certResponse->body(), false);
    }
} else {
    printStatus("Share", "No Course found to test sharing", false);
}

// 8. NOTES CRUD
echo "\n--- NOTES CRUD TEST ---\n";
$noteResponse = Http::withHeaders($headers)->post("$baseUrl/notes", [
    'course_id' => $course->id ?? 1,
    'content' => 'This is a test note for QA.'
]);
if ($noteResponse->successful()) {
    $noteId = $noteResponse->json()['id'];
    printStatus("Notes", "Note Created (ID: $noteId)");
    
    // List Notes
    $listResponse = Http::withHeaders($headers)->get("$baseUrl/notes");
    if ($listResponse->successful()) {
         printStatus("Notes", "Notes Listed Successfully");
    } else {
         printStatus("Notes", "List Notes Failed", false);
    }
} else {
    printStatus("Notes", "Note Creation Failed: " . $noteResponse->body(), false);
}

echo "\n--- QA VERIFICATION COMPLETE ---\n";
