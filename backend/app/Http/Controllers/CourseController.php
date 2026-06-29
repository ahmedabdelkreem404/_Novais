<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use App\Models\CourseShare;
use App\Services\CourseService;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\CurriculumValidator;

class CourseController extends Controller
{
    protected $courseService;
    protected $curriculumValidator;

    public function __construct(CourseService $courseService, CurriculumValidator $curriculumValidator)
    {
        $this->courseService = $courseService;
        $this->curriculumValidator = $curriculumValidator;
    }

    private function applyCourseIdentifier($query, $id)
    {
        return $query->where(function($q) use ($id) {
            $q->where('public_id', $id);
            if (ctype_digit((string) $id)) {
                $q->orWhere('id', (int) $id);
            }
        });
    }

    public function index()
    {
        return response()->json(auth('api')->user()->courses);
    }

    public function generateCourse(Request $request)
    {
        // Increase execution time for initial AI outline generation
        set_time_limit(300);

        $request->validate([
            'topic' => 'required|string',
            'type' => 'required|string',
            'language' => 'required|string',
            'numModules' => 'required|integer',
            'subTopics' => 'nullable|array',
            'level' => 'sometimes|string' // New Parameter
        ]);

        try {
            \Log::info('Triggering Course Generation', [
                'topic' => $request->topic,
                'user_id' => auth('api')->id(),
                'level' => $request->level ?? 'Beginner'
            ]);

            // Map frontend keys to CourseService expectations
            $data = [
                'topic' => $request->topic,
                'subtopics' => $request->subTopics,
                'topics_count' => $request->numModules,
                'type' => $request->type === 'Video & Theory Course' ? 'video' : 'image',
                'language' => $request->language,
                'level' => $request->level ?? 'Beginner' // Pass Level
            ];

            $outline = $this->courseService->generateOutline($data, auth('api')->id());

            return response()->json([
                'success' => true,
                'data' => $outline // This contains the generated structure
            ]);

        } catch (\Exception $e) {
            if ($e->getMessage() === 'common.content_policy_violation') {
                return response()->json(['success' => false, 'message' => 'common.content_policy_violation'], 422);
            }

            \Log::error('Course Generation Failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        // Frontend sends: user (id), content (json string), type, mainTopic
        $request->validate([
            'mainTopic' => 'required|string',
            'type' => 'required|string',
            'language' => 'nullable|string',
            'content' => 'required|json', // The full course structure
        ]);

        try {
            // If content is provided, we just save it.
            // But we need to create the Course record and Lessons.
            
            $contentData = json_decode($request->content, true);
            if (!is_array($contentData)) {
                $contentData = [];
            }
            $contentData = $this->curriculumValidator->normalize($contentData, [
                'mainTopic' => $request->mainTopic,
            ]);
            $userId = auth('api')->id(); // Use Auth::id instead of request->user for security
            
            $courseTitle = $contentData['title'] ?? $request->mainTopic;
            $courseCover = $contentData['cover_image']
                ?? $contentData['photo']
                ?? $contentData['image']
                ?? null;

            $course = Course::create([
                'user_id' => $userId,
                'title' => $courseTitle,
                'type' => $request->type,
                'language' => $request->language ?? 'English',
                'photo' => $courseCover ?: $this->courseService->fallbackCourseCoverImage($courseTitle),
                'level' => $request->level ?? 'Beginner', // Save Level
                'metadata' => $contentData // Save full JSON structure
            ]);
            
            // We should also populate lessons table for better querying/management
            // Iterate topics: check mainTopic key OR standardized keys like 'chapters' or 'topics'
            $topics = $contentData['chapters'] ?? null;

            if ($topics && is_array($topics)) {
                 foreach ($topics as $topic) {
                     $subtopics = $topic['subtopics'] ?? ($topic['sections'] ?? []);
                     if (is_array($subtopics)) {
                         foreach ($subtopics as $sub) {
                             $media = $this->courseService->extractPersistableLessonMedia($sub, $request->type);

                             $lesson = Lesson::create([
                                 'course_id' => $course->id,
                                 'topic_title' => $topic['title'] ?? 'General',
                                 'title' => $sub['title'] ?? 'Untitled Lesson',
                                 'content' => $sub['theory'] ?? ($sub['content'] ?? ''),
                                 'media_url' => $media['media_url'],
                                 'media_type' => $media['media_type'],
                                 'metadata' => $media['metadata'],
                             ]);
                         }
                     }
                 }
            }

            return response()->json([
                'success' => true,
                'message' => 'common.course_saved',
                'courseId' => $course->public_id, // Return public_id
                'completed' => true
            ], 201);
            
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        // Accept both array and string (as it might be arriving as JSON string in some setups)
        $request->validate([
            'metadata' => 'required'
        ]);

        try {
            $user = auth('api')->user();
            $query = $this->applyCourseIdentifier(Course::query(), $id);

            if ($user->role !== 'admin') {
                $query->where('user_id', $user->id);
            }

            $course = $query->firstOrFail();
            
            $metadata = $request->metadata;
            if (is_string($metadata)) {
                $metadata = json_decode($metadata, true);
            }

            $course->update(['metadata' => $metadata]);
            
            \Log::info('Course metadata updated successfully', [
                'courseId' => $id, 
                'metadata_keys' => array_keys($metadata),
                'size' => strlen(json_encode($metadata))
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'common.course_updated'
            ]);
        } catch (\Exception $e) {
            \Log::error('Course update failed', [
                'courseId' => $id,
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = auth('api')->user();
            $query = $this->applyCourseIdentifier(Course::query(), $id);

            if ($user->role !== 'admin') {
                $query->where('user_id', $user->id);
            }

            $course = $query->firstOrFail();
            $course->delete();
            return response()->json(['success' => true, 'message' => 'common.course_deleted']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'common.failed_to_delete', 'message' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $user = auth('api')->user();
        $query = $this->applyCourseIdentifier(Course::with('lessons'), $id);

        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        $course = $query->firstOrFail();
        return response()->json($course);
    }

    public function getLesson($courseId, $lessonId)
    {
        $user = auth('api')->user();
        $course = $this->applyCourseIdentifier(Course::query(), $courseId)->firstOrFail();
        
        $lesson = Lesson::where('course_id', $course->id)->findOrFail($lessonId);
        
        // Check authorization
        if ($user->role !== 'admin' && $lesson->course->user_id !== $user->id) {
            return response()->json(['error' => 'common.unauthorized'], 403);
        }

        $lesson = $this->courseService->getLessonContent($lesson);
        return response()->json($lesson);
    }

    public function createQuiz($id)
    {
        $course = $this->applyCourseIdentifier(Course::where('user_id', auth('api')->id()), $id)->firstOrFail();
        
        // Logic inside createQuiz service might depend on ID. pass integer ID.
        $id = $course->id;
        
        try {
            $quiz = $this->courseService->createQuiz($id);
            if (!$quiz) {
                 return response()->json(['error' => 'common.failed_to_generate_quiz'], 500);
            }
            return response()->json($quiz, 201);
        } catch (\Exception $e) {
             return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getQuizzes($id)
    {
        $course = $this->applyCourseIdentifier(Course::where('user_id', auth('api')->id()), $id)->firstOrFail();
        return response()->json($course->quizzes()->with('questions')->get());
    }

    // Public Share Endpoint

    // Generate Share Link
    public function createShareLink($id)
    {
        $course = $this->applyCourseIdentifier(Course::where('user_id', auth('api')->id()), $id)->firstOrFail();

        // Check if there is already an active share link
        $existing = CourseShare::where('course_id', $course->id)
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return response()->json(['token' => $existing->token, 'expires_at' => $existing->expires_at]);
        }

        // Create new
        $token = Str::random(40);
        $share = CourseShare::create([
            'course_id' => $course->id,
            'token' => $token,
            'expires_at' => now()->addDays(30)
        ]);

        return response()->json(['token' => $share->token, 'expires_at' => $share->expires_at]);
    }

    // Public Access via Share Token
    public function getSharedCourse($token)
    {
        $share = CourseShare::where('token', $token)->first();

        if (!$share || $share->expires_at < now()) {
            return response()->json(['error' => 'common.link_expired'], 404);
        }

        $course = Course::with('lessons')->find($share->course_id);
        
        return response()->json($course);
    }
}
