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
use App\Models\PlatformSetting;
use App\Models\ContentBlueprint;
use App\Models\AppNotification;
use App\Services\SubscriptionService;

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
            'level' => 'sometimes|string',
            'blueprint_slug' => 'sometimes|string',
            'blueprint_fields' => 'sometimes|array',
            'content_type' => 'sometimes|string',
        ]);

        if ($response = $this->platformGateResponse($request)) {
            return $response;
        }

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
                'level' => $request->level ?? 'Beginner',
                'blueprint_slug' => $request->input('blueprint_slug', $request->input('content_type')),
                'blueprint_fields' => $request->input('blueprint_fields', []),
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
            'blueprint_slug' => 'sometimes|string',
            'blueprint_fields' => 'sometimes|array',
            'content_type' => 'sometimes|string',
        ]);

        if ($response = $this->platformGateResponse($request)) {
            return $response;
        }

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
            $blueprintFields = $request->input('blueprint_fields', $contentData['blueprint_fields'] ?? []);
            if (isset($contentData['translated_fields']) && is_array($contentData['translated_fields'])) {
                $blueprintFields = array_merge($blueprintFields, $contentData['translated_fields']);
            }
            if (is_array($blueprintFields) && !empty($blueprintFields)) {
                $contentData['blueprint_fields'] = $blueprintFields;
            }
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
                'blueprint_slug' => $request->input('blueprint_slug', $request->input('content_type', $contentData['blueprint_slug'] ?? null)),
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

            AppNotification::create([
                'user_id' => $userId,
                'title' => 'Course created',
                'body' => "\"{$courseTitle}\" is ready in your dashboard.",
                'type' => 'course',
                'data' => [
                    'trigger' => 'course_created',
                    'course_id' => $course->public_id,
                    'localized' => [
                        'en' => ['title' => 'Course created', 'body' => "\"{$courseTitle}\" is ready in your dashboard."],
                        'ar' => ['title' => 'تم إنشاء الدورة', 'body' => "الدورة \"{$courseTitle}\" جاهزة في لوحة التحكم."],
                    ],
                ],
                'published_at' => now(),
                'scheduled_at' => now(),
            ]);

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

    private function isPaidUser($user): bool
    {
        return $user->role === 'admin'
            || $user->role === 'premium'
            || (new SubscriptionService())->isPaidStatus($user->sub_status);
    }

    private function platformGateResponse(Request $request)
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['message' => 'unauthorized'], 401);
        }

        $config = PlatformSetting::currentConfig();
        $blueprintSlug = $request->input('blueprint_slug', $request->input('content_type'));
        if ($blueprintSlug) {
            $blueprint = ContentBlueprint::query()
                ->where('slug', $blueprintSlug)
                ->first();

            if (!$blueprint) {
                return response()->json(['message' => 'platform.blueprint_not_found'], 404);
            }
            if (!$blueprint->enabled) {
                return response()->json(['message' => 'platform.blueprint_disabled'], 403);
            }

            // Validate required fields from the blueprint's form schema
            $formSchema = $blueprint->form_schema ?? ContentBlueprint::defaultFormSchema($blueprint->slug, is_array($blueprint->name) ? ($blueprint->name['en'] ?? 'course') : $blueprint->name);
            $fields = $formSchema['fields'] ?? [];
            $submittedFields = $request->input('blueprint_fields', []);
            foreach ($fields as $field) {
                if (!empty($field['required'])) {
                    $key = $field['key'];
                    if (!isset($submittedFields[$key]) || $submittedFields[$key] === '' || $submittedFields[$key] === []) {
                        $label = $field['label']['en'] ?? $key;
                        return response()->json([
                            'message' => "The field '{$label}' is required for this content type."
                        ], 422);
                    }
                }
            }
        }

        $language = ucwords(strtolower($request->input('language', 'English')));
        
        $rawType = $request->input('type', 'Theory & Image Course');
        $type = str_contains(strtolower($rawType), 'video') ? 'Video & Theory Course' : 'Theory & Image Course';
        
        $isVideo = str_contains(strtolower($type), 'video');
        $isPaid = $this->isPaidUser($user);

        if (!$config['course_creation_enabled']) {
            return response()->json(['message' => 'platform.course_creation_disabled'], 403);
        }

        if (!in_array($language, $config['enabled_languages'], true)) {
            return response()->json(['message' => 'platform.language_disabled'], 403);
        }

        if (!in_array($type, $config['enabled_course_types'], true)) {
            return response()->json(['message' => 'platform.course_type_disabled'], 403);
        }

        if ($isVideo && !$config['video_courses_enabled']) {
            return response()->json(['message' => 'platform.video_courses_disabled'], 403);
        }

        if (!$isPaid && !$config['all_languages_free'] && !in_array($language, $config['free_languages'], true)) {
            return response()->json(['message' => 'platform.language_requires_upgrade'], 403);
        }

        $freeTypes = $config['free_course_types'];
        if ($isVideo && $config['video_courses_free'] && !in_array($type, $freeTypes, true)) {
            $freeTypes[] = $type;
        }

        if (!$isPaid && !in_array($type, $freeTypes, true)) {
            return response()->json(['message' => 'platform.course_type_requires_upgrade'], 403);
        }

        // Level validation
        if ($request->has('level')) {
            $level = ucfirst(strtolower($request->input('level')));
            $enabledLevels = $config['enabled_levels'] ?? ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
            if (!in_array($level, $enabledLevels, true)) {
                return response()->json(['message' => 'platform.level_disabled'], 403);
            }
            $freeLevels = $config['free_levels'] ?? ['Beginner', 'Intermediate', 'Advanced'];
            if (!$isPaid && !in_array($level, $freeLevels, true)) {
                return response()->json(['message' => 'platform.level_requires_upgrade'], 403);
            }
        }

        // Depth validation
        if ($request->has('numModules')) {
            $depth = (int) $request->input('numModules');
            $blueprintSlug = $request->input('blueprint_slug', $request->input('content_type'));
            
            // Only enforce strict enabled_depths array and free depth limits if it is NOT a custom blueprint
            if (!$blueprintSlug || $blueprintSlug === 'normal-course' || $blueprintSlug === 'leveled-course') {
                $enabledDepths = $config['enabled_depths'] ?? [5, 10];
                if (!in_array($depth, $enabledDepths, true)) {
                    return response()->json(['message' => 'platform.depth_disabled'], 403);
                }
                $freeDepthLimit = (int) ($config['free_depth_limit'] ?? 5);
                if (!$isPaid && $depth > $freeDepthLimit) {
                    return response()->json(['message' => 'platform.depth_requires_upgrade'], 403);
                }
            }
        }

        return null;
    }
}
