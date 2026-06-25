<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\AI\DeepSeekService;
use Illuminate\Support\Facades\Auth;
use App\Models\Course;
use App\Models\User;

class ChatController extends Controller
{
    protected $aiService;
    protected $creditService;

    public function __construct(DeepSeekService $aiService, \App\Services\CreditService $creditService)
    {
        $this->aiService = $aiService;
        $this->creditService = $creditService;
    }

    public function sendMessage(Request $request)
    {
        // 1. Validate Input
        $request->validate([
            'message' => 'required|string',
            'context' => 'nullable|string',
            'topic' => 'nullable|string',
            'courseId' => 'nullable', // Allow int or string
            'history' => 'array'
        ]);

        $user = Auth::user();
        
        // 2. Resolve Course ID from Input
        $courseId = null;
        if ($request->has('courseId')) {
            $inputCourseId = $request->input('courseId');
            $course = Course::where('id', $inputCourseId)->orWhere('public_id', $inputCourseId)->first();
            if ($course && ($course->user_id === $user->id || $user->role === 'admin')) {
                $courseId = $course->id;
            } elseif ($course) {
                return response()->json(['error' => 'common.unauthorized'], 403);
            }
        }

        // 3. Build Context (System Prompt)
        $contextInfo = $this->buildContext($request, $user);
        
        // 4. Retrieve History: Prefer Database (Persistent) -> Fallback to Request
        $historyToUse = $request->input('history', []);
        
        if ($user && $courseId) {
            // Load last 10 messages from DB to maintain context
            $persistentHistory = \App\Models\Chat::where('user_id', $user->id)
                ->where('course_id', $courseId)
                ->orderBy('created_at', 'desc') // Get latest
                ->take(10)
                ->get()
                ->sortBy('created_at') // Reorder for AI
                ->map(function ($chat) {
                    return ['role' => $chat->role, 'content' => $chat->message];
                })->values()->toArray();
            
            if (!empty($persistentHistory)) {
                $historyToUse = $persistentHistory;
            }
        }
        
        // 5. Check Credits
        if ($user && $user->remaining_credits <= 0) {
            return response()->json(['reply' => 'common.insufficient_credits'], 403);
        }

        // 6. Save User Message to Database
        if ($user && $courseId) {
            \App\Models\Chat::create([
                'user_id' => $user->id,
                'course_id' => $courseId,
                'role' => 'user',
                'message' => $request->message
            ]);
        }

        // 7. Call AI Service
        $reply = $this->aiService->chatWithContext(
            $request->message,
            $historyToUse,
            $contextInfo
        );

        // 8. Save Assistant Reply to Database
        if ($user && $courseId) {
            \App\Models\Chat::create([
                'user_id' => $user->id,
                'course_id' => $courseId,
                'role' => 'assistant',
                'message' => $reply
            ]);
        }

        // 9. Deduct Credits
        if ($user) {
            $usage = $this->aiService->getLastUsage();
            $tokensUsed = $usage['total_tokens'] ?? 0;
            if ($tokensUsed > 0) {
                $this->creditService->deductCredits($user, $tokensUsed);
            }
        }

        return response()->json([
            'success' => true,
            'reply' => $reply
        ]);
    }

    public function getHistory(Request $request, $courseId)
    {
        $user = Auth::user();
        $course = Course::where('id', $courseId)->orWhere('public_id', $courseId)->firstOrFail();
        if ($course->user_id !== $user->id && $user->role !== 'admin') {
            return response()->json(['error' => 'common.unauthorized'], 403);
        }

        $history = \App\Models\Chat::where('user_id', $user->id)
            ->where('course_id', $course->id)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($chat) {
                return [
                    'role' => $chat->role,
                    'content' => $chat->message,
                    'is_persistent' => true
                ];
            });

        return response()->json($history);
    }

    protected function buildContext(Request $request, $user)
    {
        $context = [
            'platform' => [
                'name' => 'NOVAIS',
                'description' => 'AI-powered educational platform for creating and learning courses',
                'pricing' => [
                    'free' => ['price' => 0, 'limit' => '500 Credits'],
                    'pro_monthly' => ['price' => 50, 'currency' => 'EGP', 'features' => '3,000 Credits, Pro Badge, Advanced AI'],
                    'pro_yearly' => ['price' => 500, 'currency' => 'EGP', 'features' => '40,000 Credits, Save 20%, Pro Badge'],
                    'elite_monthly' => ['price' => 80, 'currency' => 'EGP', 'features' => '10,000 Credits, Elite Support, Expert AI'],
                    'elite_yearly' => ['price' => 800, 'currency' => 'EGP', 'features' => '150,000 Credits, Best Value, Elite Support']
                ],
                'features' => [
                    'certificates' => 'Available upon 100% course completion and passing the final quiz.',
                    'exports' => 'Export courses to PDF or PPT (PowerPoint) once content is generated.',
                    'audio_player' => 'Listen to lesson content using our AI Audio Player.'
                ],
                'total_courses' => Course::count()
            ],
            'user' => [
                'name' => $user ? $user->name : 'Learner',
                'email' => $user ? $user->email : null,
                'role' => $user ? $user->role : 'learner',
                'subscription' => $user ? $user->sub_status : 'free',
                'credits' => $user ? $user->remaining_credits : 0,
                'my_courses' => $user ? $user->courses()->withCount('lessons')->get()->map(function($c) {
                    $total = $c->lessons_count;
                    $completed = $c->lessons()->where('is_completed', true)->count();
                    $progress = $total > 0 ? round(($completed / $total) * 100) : 0;
                    return [
                        'title' => $c->title,
                        'progress' => $progress . '%',
                        'id' => $c->public_id ?? $c->id
                    ];
                }) : []
            ]
        ];

        // Add current course context if available
        if ($request->has('courseId')) {
            $courseId = $request->input('courseId');
            $course = Course::where('id', $courseId)->orWhere('public_id', $courseId)->first();
            if ($course && ($course->user_id === $user->id || $user->role === 'admin')) {
                $context['current_course'] = [
                    'title' => $course->title,
                    'level' => $course->level ?? 'Beginner',
                    'type' => $course->type,
                    'lessons_count' => $course->lessons->count(),
                    'content' => $request->input('context', '')
                ];
            }
        } elseif ($request->has('topic')) {
            $context['current_course'] = [
                'title' => $request->topic,
                'content' => $request->input('context', '')
            ];
        }

        return $context;
    }
}
