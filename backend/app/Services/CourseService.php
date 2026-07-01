<?php

namespace App\Services;

use App\Interfaces\AIProviderInterface;
use App\Models\ContentBlueprint;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Support\Facades\Log;

class CourseService
{
    protected $aiProvider;

    protected $creditService;

    protected $validator;

    protected $subscriptionService;

    protected $mediaResolver;

    public function __construct(
        AIProviderInterface $aiProvider,
        CreditService $creditService,
        CurriculumValidator $validator,
        SubscriptionService $subscriptionService,
        MediaResolverService $mediaResolver
    ) {
        $this->aiProvider = $aiProvider;
        $this->creditService = $creditService;
        $this->validator = $validator;
        $this->subscriptionService = $subscriptionService;
        $this->mediaResolver = $mediaResolver;
    }

    public function generateOutline(array $data, int $userId)
    {
        $user = \App\Models\User::findOrFail($userId);
        if (! $this->subscriptionService->canCreateCourse($user)) {
            throw new \Exception('You have reached your monthly course creation limit for your current plan.');
        }

        // 0. Pre-Validation: Safety Check on RAW Topic
        if (method_exists($this->aiProvider, 'validateTopicSafety')) {
            if (! $this->aiProvider->validateTopicSafety($data['topic'])) {
                throw new \Exception('common.content_policy_violation');
            }
        }

        // 1. Generate Outline via AI (With Validation & Retry)
        $extraContext = '';
        if (! empty($data['subtopics']) && is_array($data['subtopics'])) {
            $subtopicsList = implode(', ', $data['subtopics']);
            if (! empty(trim($subtopicsList))) {
                $extraContext = "Strictly include these specific subtopics: $subtopicsList.";
            }
        }

        $allowedLanguages = [
            'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean',
            'Arabic', 'Egyptian Arabic', 'Turkish', 'Dutch', 'Polish', 'Swedish', 'Danish', 'Norwegian', 'Finnish', 'Greek', 'Hindi',
            'Bengali', 'Indonesian', 'Vietnamese',
        ];

        $lang = $data['language'] ?? 'English';
        if (! in_array($lang, $allowedLanguages)) {
            $lang = 'English'; // Fallback for MVP stability
        }

        $blueprint = null;
        if (! empty($data['blueprint_slug'])) {
            $blueprint = ContentBlueprint::query()
                ->where('slug', $data['blueprint_slug'])
                ->where('enabled', true)
                ->firstOrFail();
        }
        $blueprintFields = $this->normalizeBlueprintFields($data['blueprint_fields'] ?? []);

        $outline = null;
        $maxRetries = 1;

        $attempts = 0;
        while ($attempts <= $maxRetries) {
            try {
                // Pass the combined topic + instructions, but safety check was already done on raw topic
                $outline = $this->aiProvider->generateCourseOutline(
                    $data['topic'].($extraContext ? '. '.$extraContext : ''),
                    $data['topics_count'] ?? 5,
                    $data['type'] ?? 'text',
                    $lang,
                    $data['level'] ?? 'Beginner',
                    $blueprint,
                    $blueprintFields
                );

                // VALIDATION CHECK
                $roadmap = $outline['roadmap'] ?? [];
                $validationResult = $this->validator->validate($roadmap, $outline);

                if ($validationResult['status'] === 'valid') {
                    // Success!
                    break;
                } else {
                    Log::warning("Course validation failed (Attempt $attempts)", $validationResult['violations']);
                    $attempts++;
                    if ($attempts > $maxRetries) {
                        Log::error('Validation failed after retries. Proceeding with best effort.', ['violations' => $validationResult['violations']]);
                    } else {
                        sleep(1);
                    }
                }
            } catch (\Exception $e) {
                // If it's a policy violation, don't retry, just bubble up
                if ($e->getMessage() === 'common.content_policy_violation') {
                    throw $e;
                }

                Log::error('AI Generation Error: '.$e->getMessage());
                $attempts++;
            }
        }

        if (! $outline) {
            throw new \Exception('Failed to generate course course after retries. Please try again.');
        }

        $outline = $this->validator->normalize($outline, [
            'topic' => $data['topic'] ?? 'Untitled Course',
        ]);

        // Token deduction removed - replaced by course-limit system
        /*
                if (method_exists($this->aiProvider, 'getLastUsage')) {
                    $usage = $this->aiProvider->getLastUsage();
                    $tokensUsed = $usage['total_tokens'] ?? 0;
                    if ($tokensUsed > 0) {
                        $this->creditService->deductCredits($user, $tokensUsed);
                    }
                }
        */

        // Generate Main Course Photo (Search Real Image)
        $courseTitle = $outline['title'] ?? $data['topic'];
        $photoUrl = method_exists($this->aiProvider, 'getCourseCoverImage')
            ? $this->aiProvider->getCourseCoverImage($courseTitle)
            : null;
        $photoUrl = $photoUrl ?: $this->fallbackCourseCoverImage($courseTitle);
        $outline['cover_image'] = $photoUrl;
        if ($blueprint) {
            $outline['blueprint_slug'] = $blueprint->slug;
            $outline['blueprint_name'] = $blueprint->name;
            $outline['blueprint_structure'] = $blueprint->output_structure;
            $outline['blueprint_fields'] = $blueprintFields;
            $outline['submitted_blueprint_fields'] = $blueprintFields;
            $outline['content_kind'] = $blueprint->slug;
            $outline['language_variant'] = $lang;
            $outline['display_terms'] = $this->displayTermsForBlueprint($blueprint->slug);
            $outline['output_sections'] = $blueprint->required_sections ?? [];
        }

        return $outline;
    }

    private function displayTermsForBlueprint(string $slug): array
    {
        return [
            'normal-course' => ['item' => 'Lesson', 'group' => 'Module', 'structure' => 'Modules'],
            'leveled-course' => ['item' => 'Lesson', 'group' => 'Level', 'structure' => 'Levels'],
            'interactive-practical-course' => ['item' => 'Lesson', 'group' => 'Module', 'structure' => 'Modules'],
            'academic-course' => ['item' => 'Lecture', 'group' => 'Lecture Pack', 'structure' => 'Lectures'],
            'study-review' => ['item' => 'Review Section', 'group' => 'Study Guide', 'structure' => 'Summary Sections'],
            'question-bank' => ['item' => 'Question', 'group' => 'Question Group', 'structure' => 'Questions'],
            'exam-builder' => ['item' => 'Exam Question', 'group' => 'Exam Section', 'structure' => 'Exam Sections'],
            'book' => ['item' => 'Chapter', 'group' => 'Book Part', 'structure' => 'Chapters'],
            'story' => ['item' => 'Scene', 'group' => 'Chapter', 'structure' => 'Chapters / Scenes'],
            'graduation-project' => ['item' => 'Document Section', 'group' => 'Chapter', 'structure' => 'Document Sections'],
            'master-thesis' => ['item' => 'Research Section', 'group' => 'Chapter', 'structure' => 'Research Sections'],
            'lesson-plan' => ['item' => 'Activity', 'group' => 'Lesson Plan', 'structure' => 'Lesson Plan Sections'],
            'assignment-builder' => ['item' => 'Task', 'group' => 'Assignment Section', 'structure' => 'Tasks'],
            'project-based-learning' => ['item' => 'Milestone', 'group' => 'Project Phase', 'structure' => 'Milestones'],
        ][$slug] ?? ['item' => 'Section', 'group' => 'Content', 'structure' => 'Sections'];
    }

    private function normalizeBlueprintFields(mixed $fields): array
    {
        if (! is_array($fields)) {
            return [];
        }

        $normalized = [];
        foreach ($fields as $key => $value) {
            $key = preg_replace('/[^a-zA-Z0-9_-]/', '', (string) $key);
            if ($key === '') {
                continue;
            }

            if (is_array($value)) {
                $normalized[$key] = array_values(array_filter(array_map(
                    fn ($item) => is_scalar($item) ? trim((string) $item) : null,
                    $value
                ), fn ($item) => $item !== null && $item !== ''));

                continue;
            }

            if (is_bool($value)) {
                $normalized[$key] = $value;

                continue;
            }

            if (is_scalar($value)) {
                $normalized[$key] = trim((string) $value);
            }
        }

        return $normalized;
    }

    public function fallbackCourseCoverImage(string $title): string
    {
        $text = strtolower(trim($title));

        // Technology / Software / AI / CS
        if (str_contains($text, 'novais') || str_contains($text, 'ai') || str_contains($text, 'ذكاء') || str_contains($text, 'حاسب') || str_contains($text, 'برمج') || str_contains($text, 'computer') || str_contains($text, 'software') || str_contains($text, 'code') || str_contains($text, 'system')) {
            return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop';
        }

        // Medical / Healthcare
        if (str_contains($text, 'عياد') || str_contains($text, 'طب') || str_contains($text, 'medical') || str_contains($text, 'clinic') || str_contains($text, 'health') || str_contains($text, 'مستشفى')) {
            return 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=800&auto=format&fit=crop';
        }

        // General Academic / Books / Research
        return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop';
    }

    public function extractPersistableLessonMedia(array $lessonData, string $courseType): array
    {
        $metadata = $lessonData['metadata'] ?? [];
        if (! is_array($metadata)) {
            $metadata = [];
        }

        $images = $metadata['images'] ?? $lessonData['images'] ?? [];
        $videos = $metadata['videos'] ?? $lessonData['videos'] ?? [];
        $mediaUrl = $lessonData['media_url'] ?? null;
        $mediaType = $lessonData['media_type'] ?? null;

        if (! $mediaUrl && $this->isVideoCourse($courseType)) {
            $video = $this->firstMediaItem($videos);
            $mediaUrl = $video['url'] ?? null;
            $mediaType = $mediaUrl ? 'video' : $mediaType;
        }

        if (! $mediaUrl) {
            $image = $this->firstMediaItem($images);
            $mediaUrl = $image['url'] ?? null;
            $mediaType = $mediaUrl ? 'image' : $mediaType;
        }

        if (! $mediaUrl && ! $this->isVideoCourse($courseType)) {
            $directImage = $lessonData['image'] ?? $lessonData['image_url'] ?? null;
            $mediaUrl = is_string($directImage) ? $directImage : null;
            $mediaType = $mediaUrl ? 'image' : $mediaType;
        }

        if (! $mediaUrl && $this->isVideoCourse($courseType)) {
            $directVideo = $lessonData['video'] ?? $lessonData['video_url'] ?? null;
            $mediaUrl = is_string($directVideo) ? $directVideo : null;
            $mediaType = $mediaUrl ? 'video' : $mediaType;
        }

        return [
            'media_url' => $mediaUrl,
            'media_type' => in_array($mediaType, ['image', 'video'], true) ? $mediaType : 'none',
            'metadata' => $metadata,
        ];
    }

    public function createCourse(array $data, int $userId)
    {
        // Use the new generateOutline method
        $outline = $this->generateOutline($data, $userId);

        $outline = $this->validator->normalize($outline, [
            'topic' => $data['topic'] ?? 'Untitled Course',
        ]);

        $courseTitle = $outline['title'] ?? ($data['topic'] ?? 'Untitled Course');
        $photoUrl = $outline['cover_image'] ?? null;

        // 2. Create Course Record
        $course = Course::create([
            'user_id' => $userId,
            'title' => $courseTitle,
            'type' => $data['type'] ?? 'text',
            'blueprint_slug' => $data['blueprint_slug'] ?? ($outline['blueprint_slug'] ?? null),
            'language' => $data['language'] ?? 'English',
            'photo' => $photoUrl, // Nullable
            'level' => $data['level'] ?? 'Beginner', // Save Level to DB
            'metadata' => $outline,
        ]);

        // 3. Create Lesson Placeholders
        if (isset($outline['chapters']) && is_array($outline['chapters'])) {
            foreach ($outline['chapters'] as $chapter) {
                $chapterTitle = $chapter['title'] ?? 'Untitled Chapter';
                if (isset($chapter['subtopics']) && is_array($chapter['subtopics'])) {
                    foreach ($chapter['subtopics'] as $subtopic) {
                        $subtopicTitle = $subtopic['title'] ?? 'Untitled Lesson';
                        $this->createLesson($course, $chapterTitle, $subtopicTitle);
                    }
                }
            }
        }

        return $course->load('lessons');
    }

    protected function createLesson(Course $course, string $topic, string $subtopic)
    {
        $content = null;
        // Pre-fill content for non-text types to avoid lazy loading lag?
        // Or keep lazy loading. Let's keep lazy loading for text, but setup media structures.

        $course->lessons()->create([
            'topic_title' => $topic,
            'title' => $subtopic,
            'content' => null,
            'is_completed' => false,
        ]);
    }

    public function getLessonContent(Lesson $lesson)
    {
        if ($lesson->content) {
            return $lesson;
        }

        $course = $lesson->course;

        $blueprint = null;
        if (! empty($course->blueprint_slug)) {
            $blueprint = \App\Models\ContentBlueprint::query()
                ->where('slug', $course->blueprint_slug)
                ->where('enabled', true)
                ->first();
        }
        $blueprintFields = $this->normalizeBlueprintFields($course->metadata['blueprint_fields'] ?? []);

        // 1. Generate Content via AI -> Returns Array [content, media, quiz, etc]
        $aiResponse = $this->aiProvider->generateLessonContent(
            $lesson->topic_title,
            $lesson->title,
            $course->language,
            $course->type,
            $course->level ?? 'Beginner',
            $blueprint,
            $blueprintFields
        );

        $textContent = $aiResponse['content'] ?? 'Content generation failed.';
        $mediaData = $this->resolveLessonMedia($aiResponse, $course, $lesson);

        // 2. Update Lesson
        $lesson->update([
            'content' => $textContent,
            'media_url' => $mediaData['media_url'],
            'media_type' => $mediaData['media_type'],
            'metadata' => $mediaData['metadata'],
        ]);

        return $lesson;
    }

    private function resolveLessonMedia(array $aiResponse, Course $course, Lesson $lesson): array
    {
        $metadata = [
            'images' => [],
            'videos' => [],
        ];

        $courseType = $course->type ?? 'text';
        $courseTitle = $course->title ?? 'Course';
        $lessonTitle = $lesson->title ?? 'Lesson';

        if ($this->isVideoCourse($courseType)) {
            $queries = $aiResponse['media_queries']['videos'] ?? [];
            foreach ($queries as $queryData) {
                $query = is_array($queryData) ? ($queryData['query'] ?? null) : (string) $queryData;
                if (! $query) {
                    continue;
                }

                $constraints = is_array($queryData) ? ($queryData['constraints'] ?? []) : [];
                $constraints['language'] = $constraints['language'] ?? ($course->language ?? 'English');

                $video = $this->mediaResolver->resolveVideos(
                    $query,
                    is_array($queryData) ? ($queryData['intent'] ?? 'educational') : 'educational',
                    $constraints
                );

                if ($video && ! empty($video['url'])) {
                    $metadata['videos'][] = $this->normalizeVideoMedia($video);

                    return [
                        'media_url' => $video['url'],
                        'media_type' => 'video',
                        'metadata' => $metadata,
                    ];
                }
            }
        }

        $queries = $aiResponse['media_queries']['images'] ?? [];
        foreach ($queries as $queryData) {
            $query = is_array($queryData) ? ($queryData['query'] ?? null) : (string) $queryData;
            if (! $query) {
                continue;
            }

            $images = $this->mediaResolver->resolveImagesMultiple(
                $query,
                is_array($queryData) ? ($queryData['intent'] ?? 'educational') : 'educational',
                is_array($queryData) ? ($queryData['constraints'] ?? []) : [],
                3
            );

            foreach ($images as $image) {
                if (! empty($image['url'])) {
                    $metadata['images'][] = $this->normalizeImageMedia($image);
                }
            }

            if (! empty($metadata['images'])) {
                return [
                    'media_url' => $metadata['images'][0]['url'],
                    'media_type' => 'image',
                    'metadata' => $metadata,
                ];
            }
        }

        $fallback = $this->fallbackCourseCoverImage(trim($courseTitle.' '.$lessonTitle));
        $metadata['images'][] = [
            'url' => $fallback,
            'title' => $lessonTitle,
            'source' => 'placeholder',
            'verified' => false,
            'score' => 0.0,
        ];

        return [
            'media_url' => $fallback,
            'media_type' => 'image',
            'metadata' => $metadata,
        ];
    }

    private function isVideoCourse(string $courseType): bool
    {
        return str_contains(strtolower($courseType), 'video');
    }

    private function firstMediaItem($items): ?array
    {
        return is_array($items) && isset($items[0]) && is_array($items[0]) ? $items[0] : null;
    }

    private function normalizeImageMedia(array $image): array
    {
        return [
            'url' => $image['url'],
            'title' => $image['title'] ?? 'Lesson image',
            'source' => $image['source'] ?? 'media',
            'metadata' => $image['metadata'] ?? [],
            'verified' => (bool) ($image['verified'] ?? (($image['score'] ?? 0) >= 0.25)),
            'score' => $image['score'] ?? 0.0,
        ];
    }

    private function normalizeVideoMedia(array $video): array
    {
        return [
            'url' => $video['url'],
            'title' => $video['title'] ?? 'Lesson video',
            'platform' => $video['platform'] ?? ($video['source'] ?? 'video'),
            'metadata' => $video['metadata'] ?? [],
            'verified' => (bool) ($video['verified'] ?? (($video['score'] ?? 0) >= 0.25)),
            'score' => $video['score'] ?? 0.0,
        ];
    }

    public function createQuiz(int $courseId)
    {
        set_time_limit(180); // Increase timeout for AI generation
        $course = Course::findOrFail($courseId);

        // Extract subtopics for context
        $metadata = $course->metadata;
        if (is_string($metadata)) {
            $metadata = json_decode($metadata, true);
        }

        $subtopics = [];
        $topics = (is_array($metadata) && isset($metadata['chapters']))
            ? $metadata['chapters']
            : ((is_array($metadata) && isset($metadata['topics'])) ? $metadata['topics'] : []);

        foreach ($topics as $topic) {
            $sections = $topic['subtopics'] ?? ($topic['sections'] ?? []);
            foreach ($sections as $sub) {
                $subtopics[] = $sub['title'] ?? ($sub['name'] ?? '');
            }
        }
        // Calculate balanced question count: Aim for 10-13 questions with slight randomness for visual change
        $qCount = rand(10, 13);

        // Randomize subtopics list to confuse AI cache and force fresh generation
        shuffle($subtopics);
        $context = implode(', ', array_slice(array_filter($subtopics), 0, 15));

        // Generate Quiz Questions via AI
        $rawResponse = $this->aiProvider->generateQuiz($course->title, $qCount, $course->language, $context, $course->level ?? 'Beginner');

        // The AI returns {"questions": [...]}, so we need to access the inner array
        $questions = $rawResponse['questions'] ?? $rawResponse;

        // Token deduction removed - replaced by course-limit system
        /*
                if (method_exists($this->aiProvider, 'getLastUsage')) {
                    try {
                        $usage = $this->aiProvider->getLastUsage();
                        $tokensUsed = $usage['total_tokens'] ?? 0;
                        if ($tokensUsed > 0) {
                            $user = \App\Models\User::find($course->user_id) ?? auth('api')->user();
                            if ($user) {
                                $this->creditService->deductCredits($user, $tokensUsed);
                            }
                        }
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::warning("Token deduction failed but continuing: " . $e->getMessage());
                    }
                }
        */
        // Mark course as completed if all lessons and quizzes are present
        $this->subscriptionService->markCourseAsCompleted($course);

        if (empty($questions) || ! is_array($questions)) {
            return null;
        }

        // Calculate Time Limit (Seconds) based on difficulty & question count
        // Beginner: 60s, Intermediate: 90s, Advanced: 120s per question
        $baseTimePerQ = 60;
        $level = strtolower($course->level ?? 'beginner');
        if ($level === 'intermediate') {
            $baseTimePerQ = 90;
        }
        if ($level === 'advanced') {
            $baseTimePerQ = 120;
        }

        $totalTime = count($questions) * $baseTimePerQ;

        // Delete all previous quizzes for this course to ensure a clean slate (Replacement)
        $course->quizzes()->delete();

        $quiz = $course->quizzes()->create([
            'title' => $course->title.' - Final Quiz',
        ]);

        foreach ($questions as $q) {
            $quiz->questions()->create([
                'question' => $q['question'] ?? 'Untitled Question',
                'options' => $q['options'] ?? [],
                'correct_answer' => $q['correct_answer'] ?? ($q['answer'] ?? 'N/A'),
            ]);
        }

        $result = $quiz->load('questions')->toArray();
        $result['time_limit'] = $totalTime;

        return $result;
    }
}
