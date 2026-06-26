<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Course;
use App\Models\Certificate;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateController extends Controller
{
    public function generate($courseId)
    {
        $user = Auth::user();
        $course = Course::with('lessons')
            ->where('id', $courseId)
            ->orWhere('public_id', $courseId)
            ->firstOrFail();

        if ($course->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['error' => 'common.unauthorized'], 403);
        }

        // 1. Verify Quiz Completion and Score (Strict check: 60% minimum)
        $metadata = is_string($course->metadata) ? json_decode($course->metadata, true) : $course->metadata;
        $quizResult = $metadata['quizResult'] ?? null;
        
        if (!$quizResult || ($quizResult['score'] ?? 0) < 60) {
            return response()->json([
                'error' => 'certificate.incomplete_requirement',
                'message' => 'certificate.quiz_failed_msg'
            ], 403);
        }
        
        // 2. Check if certificate already exists
        $existing = Certificate::where('user_id', $user->id)
                               ->where('course_id', $course->id)
                               ->first();
        
        if ($existing) {
             return response()->json([
                'message' => 'Certificate already issued',
                'url' => route('certificate.download', $existing->certificate_code)
             ]);
        }

        // 3. Create Certificate Record
        $certificate = Certificate::create([
            'user_id' => $user->id,
            'course_id' => $course->id,
            'certificate_code' => strtoupper(uniqid('CERT-')),
            'issued_at' => now(),
        ]);

        // 4. Generate PDF
        $pdf = Pdf::loadView('certificates.template', compact('user', 'course', 'certificate'));
        
        // 5. Send Email
        try {
            Mail::to($user->email)->send(new \App\Mail\CertificateMail($user, $course, $pdf->output()));
        } catch (\Exception $e) {
            // Log email failure but continue
        }

        return response()->json([
            'message' => 'certificate.generated_and_sent',
            'url' => route('certificate.download', $certificate->certificate_code)
        ], 201);
    }

    public function download($code)
    {
        $certificate = Certificate::where('certificate_code', $code)->firstOrFail();
        $user = $certificate->user;
        $course = $certificate->course;

        $pdf = Pdf::loadView('certificates.template', compact('user', 'course', 'certificate'));
        return $pdf->download('certificate.pdf');
    }
}
