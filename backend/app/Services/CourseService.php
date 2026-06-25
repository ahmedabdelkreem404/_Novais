<?php

namespace App\Services;

use App\Interfaces\AIProviderInterface;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Support\Facades\Log;

class CourseService
{
    protected $validator;
    protected $subscriptionService;

    public function __construct(AIProviderInterface $aiProvider, CreditService $creditService, CurriculumValidator $validator, SubscriptionService $subscriptionService)
    {
        $this->aiProvider = $aiProvider;
        $this->creditService = $creditService;
        $this->validator = $validator;
        $this->subscriptionService = $subscriptionService;
    }

    public function generateOutline(array $data, int $userId)
    {
        $user = \App\Models\User::findOrFail($userId);
        if (!$this->subscriptionService->canCreateCourse($user)) {
            throw new \Exception("You have reached your monthly course creation limit for your current plan.");
        }

        // 0. Pre-Validation: Safety Check on RAW Topic
        if (method_exists($this->aiProvider, 'validateTopicSafety')) {
            if (!$this->aiProvider->validateTopicSafety($data['topic'])) {
                throw new \Exception('common.content_policy_violation');
            }
        }

        // 1. Generate Outline via AI (With Validation & Retry)
        $extraContext = "";
        if (!empty($data['subtopics']) && is_array($data['subtopics'])) {
            $subtopicsList = implode(', ', $data['subtopics']);
            if (!empty(trim($subtopicsList))) {
                $extraContext = "Strictly include these specific subtopics: $subtopicsList.";
            }
        }

        $allowedLanguages = [
            'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean',
            'Arabic', 'Turkish', 'Dutch', 'Polish', 'Swedish', 'Danish', 'Norwegian', 'Finnish', 'Greek', 'Hindi',
            'Bengali', 'Indonesian', 'Vietnamese'
        ];

        $lang = $data['language'] ?? 'English';
        if (!in_array($lang, $allowedLanguages)) {
            $lang = 'English'; // Fallback for MVP stability
        }

        $outline = null;
        $maxRetries = 1;

        $attempts = 0;
        while ($attempts <= $maxRetries) {
            try {
                // Pass the combined topic + instructions, but safety check was already done on raw topic
                $outline = $this->aiProvider->generateCourseOutline(
                    $data['topic'] . ($extraContext ? ". " . $extraContext : ""),
                    $data['topics_count'] ?? 5,
                    $data['type'] ?? 'text',
                    $lang,
                    $data['level'] ?? 'Beginner' // Pass Level
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
                        Log::error("Validation failed after retries. Proceeding with best effort.", ['violations' => $validationResult['violations']]);
                    } else {
                        sleep(1);
                    }
                }
            } catch (\Exception $e) {
                // If it's a policy violation, don't retry, just bubble up
                if ($e->getMessage() === 'common.content_policy_violation') {
                    throw $e;
                }

                Log::error("AI Generation Error: " . $e->getMessage());
                $attempts++;
            }
        }
        
        if (!$outline) {
            throw new \Exception("Failed to generate course course after retries. Please try again.");
        }

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
        $photoUrl = $this->aiProvider->getCourseCoverImage($courseTitle);
        $outline['cover_image'] = $photoUrl;

        return $outline;
    }

    public function createCourse(array $data, int $userId)
    {
        // Use the new generateOutline method
        $outline = $this->generateOutline($data, $userId);

        $courseTitle = $outline['title'] ?? ($data['topic'] ?? 'Untitled Course');
        $photoUrl = $outline['cover_image'] ?? null;

        // 2. Create Course Record
        $course = Course::create([
            'user_id' => $userId,
            'title' => $courseTitle,
            'type' => $data['type'] ?? 'text',
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
        
        // 1. Generate Content via AI -> Returns Array [content, media, quiz, etc]
        $aiResponse = $this->aiProvider->generateLessonContent(
            $lesson->topic_title,
            $lesson->title,
            $course->language,
            $course->type,
            $course->level ?? 'Beginner'
        );

        $textContent = $aiResponse['content'] ?? 'Content generation failed.';
        $mediaData = $aiResponse['media'] ?? [];
        
        // 2. Update Lesson
        $lesson->update([
            'content' => $textContent,
            'metadata' => $mediaData // Store media in JSON metadata
        ]);

        return $lesson;
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

        if (empty($questions) || !is_array($questions)) {
            return null;
        }

        // Calculate Time Limit (Seconds) based on difficulty & question count
        // Beginner: 60s, Intermediate: 90s, Advanced: 120s per question
        $baseTimePerQ = 60; 
        $level = strtolower($course->level ?? 'beginner');
        if ($level === 'intermediate') $baseTimePerQ = 90;
        if ($level === 'advanced') $baseTimePerQ = 120;

        $totalTime = count($questions) * $baseTimePerQ;

        // Delete all previous quizzes for this course to ensure a clean slate (Replacement)
        $course->quizzes()->delete();

        $quiz = $course->quizzes()->create([
            'title' => $course->title . " - Final Quiz"
        ]);

        foreach ($questions as $q) {
            $quiz->questions()->create([
                'question' => $q['question'] ?? 'Untitled Question',
                'options' => $q['options'] ?? [],
                'correct_answer' => $q['correct_answer'] ?? ($q['answer'] ?? 'N/A')
            ]);
        }

        $result = $quiz->load('questions')->toArray();
        $result['time_limit'] = $totalTime;

        return $result;
    }
}
