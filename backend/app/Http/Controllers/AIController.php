<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Interfaces\AIProviderInterface;
use App\Services\MediaResolverService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;

class AIController extends Controller
{
    protected $aiService;
    protected $creditService;
    protected $mediaResolver;

    public function __construct(
        AIProviderInterface $aiService, 
        \App\Services\CreditService $creditService,
        MediaResolverService $mediaResolver
    ) {
        $this->aiService = $aiService;
        $this->creditService = $creditService;
        $this->mediaResolver = $mediaResolver;
    }

    /**
     * Helper to normalize strings for comparison (removes punctuation, extra whitespace, lowercases).
     */
    private function normalizeString($str): string
    {
        if (is_null($str)) return '';
        $str = mb_strtolower(trim($str));
        $str = preg_replace('/[[:punct:]]/u', '', $str);
        $str = preg_replace('/\s+/', ' ', $str);
        return $str;
    }

    /**
     * Extract the core topic keywords from a course title - WORKS WITH ANY SUBJECT.
     * Extracts 2-3 most important words, removing filler words.
     * e.g., "مدخل شامل إلى برمجة بايثون: من الصفر إلى بناء التطبيقات" → "برمجة بايثون"
     * e.g., "العلامات التجارية المحلية للملابس: من الفكرة إلى المشروع" → "العلامات التجارية الملابس"
     */
    private function extractCoreTopic(string $courseTitle): string
    {
        $titleLower = mb_strtolower($courseTitle);
        
        // Remove common filler words (Arabic + English)
        $fillerWords = [
            // Arabic fillers
            'مدخل', 'شامل', 'إلى', 'من', 'الصفر', 'كورس', 'دورة', 'تعلم', 'للمبتدئين', 
            'المتقدمين', 'الكامل', 'بناء', 'التطبيقات', 'كيفية', 'طريقة', 'أساسيات',
            'مقدمة', 'دليل', 'خطوة', 'بخطوة', 'الفكرة', 'المشروع', 'الناجح', 'نحو',
            // English fillers
            'introduction', 'complete', 'beginner', 'advanced', 'tutorial', 'guide', 
            'course', 'learn', 'how', 'step', 'by', 'mastering', 'ultimate', 'comprehensive',
            'basics', 'fundamentals', 'from', 'scratch', 'building', 'creating', 'the', 'a', 'an',
            'to', 'for', 'of', 'and', 'or', 'with', 'in', 'on', 'at',
        ];
        
        // Split title into words, removing punctuation and extra characters
        $words = preg_split('/[\s:،,\-–—]+/u', $titleLower);
        
        // Filter: keep words that are meaningful (length > 2, not filler)
        $meaningfulWords = [];
        foreach ($words as $word) {
            $word = trim($word);
            if (mb_strlen($word) > 2 && !in_array($word, $fillerWords)) {
                $meaningfulWords[] = $word;
            }
        }
        
        // Take first 2-3 meaningful words as the core topic
        $coreWords = array_slice($meaningfulWords, 0, 3);
        
        if (count($coreWords) > 0) {
            return implode(' ', $coreWords);
        }
        
        // Fallback: return first 30 chars of title
        return mb_substr($courseTitle, 0, 30);
    }

    private function fallbackMediaImage(string $topic, string $label = 'Course visual'): array
    {
        $text = trim($topic) !== '' ? $topic : $label;

        return [
            'url' => 'https://placehold.co/1200x675/1d4ed8/ffffff.png?text=' . rawurlencode($text),
            'title' => $text,
            'description' => 'Safe topic fallback visual',
            'source' => 'placeholder',
            'metadata' => [],
            'verified' => false,
            'score' => 0.0,
        ];
    }

    private function isVideoRelevant(?array $video, string $courseTopic, string $subtopic): bool
    {
        if (!$video || empty($video['title'])) {
            return false;
        }

        $context = mb_strtolower($courseTopic . ' ' . $subtopic);
        $title = mb_strtolower($video['title']);
        $haystack = $title . ' ' . mb_strtolower($video['url'] ?? '');

        $domains = [
            'chess' => [
                'context' => '/(chess|شطرنج)/iu',
                'positive' => '/(chess|شطرنج|checkmate|board|pieces|opening)/iu',
                'negative' => '/(java|programming|software|kitchendraw|mblock|coding|excel|photoshop)/iu',
            ],
            'cooking' => [
                'context' => '/(cook|cooking|kitchen|recipe|chef|food|طبخ|طهي|مطبخ|وصفة|طعام)/iu',
                'positive' => '/(cook|cooking|kitchen|recipe|chef|food|knife|pan|طبخ|طهي|مطبخ|وصفة|طعام|شيف)/iu',
                'negative' => '/(java|programming|software|kitchendraw|mblock|coding|draw|autocad|excel|router|internet|wifi|network|روتر|راوتر|نت|انترنت)/iu',
            ],
            'crafts' => [
                'context' => '/(craft|handmade|diy|hand made|هاند|حرف|يدوي|يدوية)/iu',
                'positive' => '/(craft|handmade|diy|hand made|حرف|يدوي|يدوية|اشغال|أشغال)/iu',
                'negative' => '/(java|programming|software|kitchendraw|mblock|coding|gaming)/iu',
            ],
        ];

        foreach ($domains as $domain) {
            if (preg_match($domain['context'], $context)) {
                return preg_match($domain['positive'], $haystack) === 1
                    && preg_match($domain['negative'], $haystack) !== 1;
            }
        }

        return ($video['score'] ?? 0) >= 0.25;
    }

    private function findCourseByIdentifier($courseId): \App\Models\Course
    {
        return \App\Models\Course::where('public_id', $courseId)
            ->when(ctype_digit((string) $courseId), fn($query) => $query->orWhere('id', (int) $courseId))
            ->firstOrFail();
    }

    // /api/generate
    public function generate(Request $request)
    {
        set_time_limit(300);
        
        $request->validate(['prompt' => 'required|string']);
        
        try {
            $user = auth('api')->user();
            if (!$this->creditService->hasEnoughCredits($user, 1)) {
                return response()->json([
                    'success' => false, 
                    'message' => 'common.insufficient_credits'
                ], 403);
            }

            $response = $this->aiService->chat($request->prompt, []);
            
            // Deduct tokens
            $usage = $this->aiService->getLastUsage();
            $tokensUsed = $usage['total_tokens'] ?? 0;
            if ($tokensUsed > 0) {
                $this->creditService->deductCredits($user, $tokensUsed);
            }
            
            // Clean markdown code blocks if present
            $cleanResponse = trim($response);
            if (strpos($cleanResponse, '```') !== false) {
                $cleanResponse = preg_replace('/^```(?:json)?\s*|\s*```$/i', '', $cleanResponse);
            }
            $cleanResponse = trim($cleanResponse);

            return response()->json(['text' => $cleanResponse]);
        } catch (\Exception $e) {
             \Illuminate\Support\Facades\Log::error('AI Generation Failed in Controller', [
                'error' => $e->getMessage()
             ]);
             return response()->json([
                'success' => false, 
                'message' => 'common.ai_failed'
            ], 500);
        }
    }

    // /api/image - Legacy endpoint (deprecated, kept for backwards compatibility)
    public function generateImage(Request $request)
    {
        $request->validate(['prompt' => 'required|string']);
        
        // Use MediaResolverService
        $media = $this->mediaResolver->resolveImages(
            query: $request->prompt,
            intent: 'educational',
            constraints: ['orientation' => 'landscape']
        );
        
        if ($media && $media['score'] >= 0.6) {
            return response()->json(['url' => $media['url']]);
        }

        // Fallback to Pollinations (temporary)
        $prompt = urlencode($request->prompt . ", educational diagram, 4k");
        $seed = rand(1, 99999);
        $imageUrl = "https://image.pollinations.ai/prompt/{$prompt}?width=1280&height=720&model=flux-realism&seed={$seed}&nologo=true";

        return response()->json(['url' => $imageUrl]);
    }

    // /api/yt - Deprecated (returns empty)
    public function generateVideo(Request $request)
    {
        return response()->json(['url' => '']);
    }

    // /api/transcript - Deprecated (returns mock)
    public function generateTranscript(Request $request)
    {
        return response()->json([
            'url' => [
                ['text' => 'common.transcripts_not_supported']
            ]
        ]);
    }

    // /api/generate-lesson (Lazy Loading) - PRODUCTION VERSION
    public function generateLesson(Request $request)
    {
        set_time_limit(300);

        $request->validate([
            'course_id' => 'required', // Allow int or string
            'chapter_title' => 'required|string',
            'subtopic_title' => 'required|string',
            'language' => 'required|string',
            'level' => 'sometimes|string'
        ]);

        $courseId = $request->course_id;
        $chapterTitle = $request->chapter_title;
        $subtopicTitle = $request->subtopic_title;
        $language = $request->language;
        
        $normSubtopicTitle = $this->normalizeString($subtopicTitle);

        try {
            // 1. Fetch Course (Support both numeric ID and public_id)
            $course = $this->findCourseByIdentifier($courseId);

            $user = Auth::user();
            if ($course->user_id !== $user->id && $user->role !== 'admin') {
                return response()->json(['error' => 'common.unauthorized'], 403);
            }

            $metadata = $course->metadata;

            // 2. Find Subtopic & Update
            $updated = false;
            $newContent = [];

            $possibleKeys = ['chapters', 'topics', 'content'];
            // Add dynamic course title keys as fallback
            if (!empty($course->title)) {
                $possibleKeys[] = $course->title;
                $possibleKeys[] = strtolower($course->title);
                // Also handle common variations if title has spaces
                $possibleKeys[] = str_replace(' ', '_', strtolower($course->title));
            }
            
            foreach ($possibleKeys as $mainKey) {
                if (isset($metadata[$mainKey]) && is_array($metadata[$mainKey])) {
                    foreach ($metadata[$mainKey] as &$section) {
                        $subsKey = isset($section['subtopics']) ? 'subtopics' : (isset($section['sections']) ? 'sections' : null);
                        
                        if ($subsKey && isset($section[$subsKey]) && is_array($section[$subsKey])) {
                            foreach ($section[$subsKey] as &$subtopic) {
                                $currentTitle = $subtopic['title'] ?? '';
                                
                                if ($this->normalizeString($currentTitle) === $normSubtopicTitle) {
                                    \Log::info('Subtopic found', ['title' => $currentTitle, 'key' => $mainKey]);
                                    
                                    // 3. Generate Content if empty
                                    if (empty($subtopic['theory']) && empty($subtopic['content'])) {
                                         $courseType = $course->type ?? 'Text'; 
                                         $cleanType = str_contains(strtolower($courseType), 'video') ? 'Video' : 'Image';

                                         // Call AI Service
                                         $aiContent = $this->aiService->generateLessonContent(
                                            $metadata['title'] ?? ($course->title ?? 'Course'), 
                                            $subtopicTitle, 
                                            $language,
                                            $cleanType,
                                            $request->level ?? ($course->level ?? 'Beginner')
                                         );

                                         // Deduct Credits (Fixed Cost logic)
                                         // User wants a "credit" system, not raw token usage.
                                         // Let's assume 1 lesson = 50 credits (default free is 500, so 10 lessons).
                                         $lessonCost = 50;
                                         
                                         $user = auth('api')->user();
                                         $this->creditService->deductCredits($user, $lessonCost);
                                         
                                         // Map Content
                                         $subtopic['content'] = $aiContent['content'] ?? '';
                                         $subtopic['examples'] = $aiContent['examples'] ?? '';
                                         $subtopic['theory'] = $aiContent['content'] ?? ''; 

                                          // === IMAGE RESOLUTION: Prioritize AI Suggestions ===
                                          $frontendImages = [];
                                          $frontendVideos = [];

                                              if ($cleanType === 'Image') {
                                                  $allCandidates = [];
                                                  $courseLevel = $request->level ?? ($course->level ?? '');
                                                  $isProfessional = ($courseLevel === 'Professional' || $courseLevel === 'Professional Bootcamp');
                                                  $minThreshold = $isProfessional ? 0.35 : 0.20; // Slightly lower thresholds since we validate URLs now

                                                  // 1. AI-Suggested Queries
                                                  $aiImageQueries = $aiContent['media_queries']['images'] ?? [];
                                                  foreach ($aiImageQueries as $suggested) {
                                                      $sQuery = $suggested['query'] ?? null;
                                                      if ($sQuery) {
                                                          $resolved = $this->mediaResolver->resolveImagesMultiple($sQuery, $suggested['intent'] ?? 'educational', $suggested['constraints'] ?? [], 3);
                                                          foreach ($resolved as $r) {
                                                              if ($r['score'] >= $minThreshold) $allCandidates[] = $r;
                                                          }
                                                          if (count($allCandidates) >= 3) break;
                                                      }
                                                  }

                                                  // 2. Direct Fallback
                                                  if (count($allCandidates) < 2) {
                                                      $fullCourseTitle = $metadata['title'] ?? ($course->title ?? '');
                                                      $coreTopic = $this->extractCoreTopic($fullCourseTitle);
                                                      
                                                      $isArt = preg_match('/(drawing|painting|art|sketch|sketching|رسم|فن)/i', $fullCourseTitle);
                                                      $negativeArtFilter = $isArt ? " -fitness -workout -gym -muscle" : "";
                                                      
                                                      $directQuery = $subtopicTitle . ' , ' . $coreTopic . ' infographic diagram' . $negativeArtFilter;
                                                      $resolved = $this->mediaResolver->resolveImagesMultiple($directQuery, 'educational', [], 2);
                                                      foreach ($resolved as $r) {
                                                          if ($r['score'] >= ($minThreshold * 0.8)) $allCandidates[] = $r;
                                                      }
                                                  }

                                                  // Remove duplicates by URL
                                                  $allCandidates = array_values(array_reduce($allCandidates, function($carry, $item) {
                                                      if (!isset($carry[$item['url']])) $carry[$item['url']] = $item;
                                                      return $carry;
                                                  }, []));

                                                  if (!empty($allCandidates)) {
                                                      $primary = $allCandidates[0];
                                                      $fallbacks = array_slice($allCandidates, 1);
                                                      
                                                      $frontendImages[] = [
                                                          'url' => $primary['url'],
                                                          'title' => $primary['title'],
                                                          'source' => $primary['source'],
                                                          'verified' => ($primary['score'] >= $minThreshold),
                                                          'score' => $primary['score'],
                                                          'fallbacks' => array_map(fn($f) => [
                                                              'url' => $f['url'],
                                                              'title' => $f['title'],
                                                              'source' => $f['source'],
                                                              'score' => $f['score']
                                                          ], $fallbacks)
                                                      ];
                                                      \Log::info('Images resolved with fallbacks', ['count' => count($allCandidates)]);
                                                  } else {
                                                      $fallbackTopic = trim(($metadata['title'] ?? ($course->title ?? '')) . ' ' . $subtopicTitle);
                                                      $frontendImages[] = $this->fallbackMediaImage($fallbackTopic, $subtopicTitle);
                                                  }
                                              }
                                         
                                         // ============================================================
                                         // GUARANTEED MEDIA RESOLUTION - Using Lesson Title Directly
                                         // ============================================================
                                         
                                         if ($cleanType === 'Video') {
                                             // Get course title and extract core topic keyword
                                             $fullCourseTitle = $metadata['title'] ?? ($course->title ?? '');
                                             
                                             // Extract the core topic from the course title
                                             // Look for technology/topic keywords in the title
                                             $coreTopic = $this->extractCoreTopic($fullCourseTitle);
                                             
                                             \Log::info('Starting guaranteed video resolution', [
                                                 'subtopic' => $subtopicTitle, 
                                                 'fullCourseTitle' => $fullCourseTitle,
                                                 'coreTopic' => $coreTopic,
                                                 'language' => $language
                                             ]);
                                             
                                             $videoFound = false;
                                             $minScore = 0.10; // Very low threshold to guarantee media
                                             $bestVideo = null;
                                             $bestScore = 0;
                                             
                                             // Helper to track best video across all stages
                                             $trackBestVideo = function($video) use (&$bestVideo, &$bestScore) {
                                                 if ($video && $video['score'] > $bestScore) {
                                                     $bestVideo = $video;
                                                     $bestScore = $video['score'];
                                                 }
                                             }; 

                                             $appendVideo = function($video, bool $verified) use (&$frontendVideos, $coreTopic, $subtopicTitle) {
                                                 if (!$this->isVideoRelevant($video, $coreTopic, $subtopicTitle)) {
                                                     if ($video) {
                                                         \Log::warning('Rejected irrelevant video candidate', [
                                                             'title' => $video['title'] ?? '',
                                                             'score' => $video['score'] ?? null,
                                                             'coreTopic' => $coreTopic,
                                                             'subtopic' => $subtopicTitle,
                                                         ]);
                                                     }
                                                     return false;
                                                 }

                                                 $frontendVideos[] = [
                                                     'url' => $video['url'],
                                                     'title' => $video['title'],
                                                     'platform' => $video['source'],
                                                     'metadata' => $video['metadata'],
                                                     'verified' => $verified,
                                                     'score' => $video['score']
                                                 ];

                                                 return true;
                                             };
                                             
                                             // === STAGE 1: Search with LESSON TITLE ONLY (no course topic) ===
                                             // This avoids irrelevant videos that match course topic but not lesson
                                             // e.g., for "اختيار الأقمشة" we don't want videos about "العلامات التجارية"
                                             $lessonWords = preg_split('/[\s:،,\-]+/u', $subtopicTitle);
                                             $shortLesson = implode(' ', array_slice(array_filter($lessonWords, fn($w) => mb_strlen($w) > 2), 0, 4));
                                             $stage1Query = $shortLesson;
                                             if (strtolower($language) === 'ar' || str_contains(strtolower($language), 'arabic')) {
                                                 $stage1Query .= ' شرح';
                                             } else {
                                                 $stage1Query .= ' tutorial';
                                             }
                                             
                                             $resolvedVideo = $this->mediaResolver->resolveVideos($stage1Query, 'educational', [
                                                 'language' => $language,
                                                 'subtopic' => $subtopicTitle,
                                                 'courseTopic' => null // Don't use course topic in Stage 1
                                             ]);
                                             $trackBestVideo($resolvedVideo);
                                             
                                             if ($resolvedVideo && $resolvedVideo['score'] >= $minScore && $appendVideo($resolvedVideo, true)) {
                                                 $videoFound = true;
                                                 \Log::info('Stage 1: Video found (lesson only)', ['query' => $stage1Query, 'score' => $resolvedVideo['score']]);
                                             }
                                             
                                             // === STAGE 2: Add course topic if Stage 1 didn't find good match ===
                                             if (!$videoFound) {
                                                 $stage2Query = $coreTopic . ' ' . $shortLesson;
                                                 if (strtolower($language) === 'ar' || str_contains(strtolower($language), 'arabic')) {
                                                     $stage2Query .= ' شرح';
                                                 } else {
                                                     $stage2Query .= ' tutorial';
                                                 }
                                                 
                                                 $resolvedVideo = $this->mediaResolver->resolveVideos($stage2Query, 'educational', [
                                                     'language' => $language,
                                                     'subtopic' => $subtopicTitle,
                                                     'courseTopic' => $coreTopic
                                                 ]);
                                                 $trackBestVideo($resolvedVideo);
                                                 
                                                 if ($resolvedVideo && $resolvedVideo['score'] >= $minScore && $appendVideo($resolvedVideo, true)) {
                                                     $videoFound = true;
                                                     \Log::info('Stage 2: Video found (with course topic)', ['query' => $stage2Query, 'score' => $resolvedVideo['score']]);
                                                 }
                                             }
                                             
                                             // === STAGE 3: Search in English with core topic ===
                                             if (!$videoFound && strtolower($language) !== 'en' && strtolower($language) !== 'english') {
                                                 // Use core topic + subtopic for English search
                                                 $stage3Query = $coreTopic . ' ' . $subtopicTitle . ' tutorial';
                                                 
                                                 $resolvedVideo = $this->mediaResolver->resolveVideos($stage3Query, 'educational', [
                                                     'language' => 'English',
                                                     'subtopic' => $subtopicTitle,
                                                     'courseTopic' => $coreTopic
                                                 ]);
                                                 $trackBestVideo($resolvedVideo);
                                                 
                                                 if ($resolvedVideo && $resolvedVideo['score'] >= $minScore && $appendVideo($resolvedVideo, true)) {
                                                     $videoFound = true;
                                                     \Log::info('Stage 3: English video found', ['query' => $stage3Query, 'score' => $resolvedVideo['score']]);
                                                 }
                                             }
                                             
                                             // === STAGE 4: Use best video found across all stages ===
                                             // Only if score is decent (>= 0.05) or if we really need a fallback
                                             if (!$videoFound && $bestVideo && $bestScore >= 0.05 && $appendVideo($bestVideo, false)) {
                                                 \Log::info('Using best video found with low score', ['score' => $bestScore, 'title' => $bestVideo['title']]);
                                                 $videoFound = true;
                                             }
                                             
                                             // === STAGE 5: Get an image as fallback ===
                                             if (!$videoFound) {
                                                 \Log::warning('No video found, falling back to image', ['subtopic' => $subtopicTitle]);
                                                 
                                                 $imageQuery = $coreTopic . ' ' . $shortLesson . ' infographic';
                                                 $resolvedImage = $this->mediaResolver->resolveImages($imageQuery, 'educational', []);
                                                 
                                                 if ($resolvedImage && $resolvedImage['score'] >= 0.20) {
                                                     $frontendImages[] = [
                                                         'url' => $resolvedImage['url'],
                                                         'title' => $resolvedImage['title'],
                                                         'description' => $resolvedImage['description'] ?? '',
                                                         'source' => $resolvedImage['source'],
                                                         'metadata' => $resolvedImage['metadata'],
                                                         'verified' => true,
                                                         'score' => $resolvedImage['score']
                                                     ];
                                                     \Log::info('Stage 6: Fallback image found', ['score' => $resolvedImage['score']]);
                                                  } else {
                                                      \Log::info('Stage 6: No lesson-specific image found. Trying generic course image.');
                                                      
                                                      // === STAGE 6.5: Generic Course Image Fallback ===
                                                      // If lesson image fails, get a generic image for the course topic
                                                      $courseImageQuery = $coreTopic . ' infographic';
                                                      $genericImage = $this->mediaResolver->resolveImages($courseImageQuery, 'educational', []);
                                                      
                                                      if ($genericImage) {
                                                           $frontendImages[] = [
                                                              'url' => $genericImage['url'],
                                                              'title' => $genericImage['title'],
                                                              'description' => 'Course topic visual',
                                                              'source' => $genericImage['source'],
                                                              'metadata' => $genericImage['metadata'],
                                                              'verified' => false,
                                                              'score' => 0.15 
                                                          ];
                                                          \Log::info('Stage 6.5: Generic course image found', ['query' => $courseImageQuery]);
                                                      }
                                                  }
                                             }
                                             
                                             // === STAGE 7: Placeholder (last resort) ===
                                             if (empty($frontendVideos) && empty($frontendImages)) {
                                                 \Log::error('All media stages failed, using placeholder', ['subtopic' => $subtopicTitle]);
                                                 $frontendImages[] = $this->fallbackMediaImage($coreTopic . ' ' . $subtopicTitle, $subtopicTitle);
                                             }
                                         }
                                         
                                         // Construct Metadata for Frontend
                                         $subtopic['metadata'] = [
                                             'images' => $frontendImages,
                                             'videos' => $frontendVideos
                                         ];

                                         // Map Quiz
                                         if (!empty($aiContent['quiz'])) {
                                             $subtopic['quiz'] = $aiContent['quiz'];
                                         }
                                         
                                         $section[$subsKey] = $section[$subsKey];
                                         $newContent = $subtopic;
                                         $updated = true;

                                    } else {
                                        // Content exists, just return it
                                        $newContent = $subtopic;
                                        $updated = true; 
                                    }
                                    break 3;
                                }
                            }
                        }
                    }
                }
            }

            if ($updated) {
                // 4. Save to DB
                $course->metadata = $metadata;
                $course->save();

                $lesson = \App\Models\Lesson::where('course_id', $course->id)
                    ->where('topic_title', $chapterTitle)
                    ->where('title', $subtopicTitle)
                    ->first();

                if ($lesson) {
                    $lesson->update([
                        'content' => $newContent['content'] ?? ($newContent['theory'] ?? $lesson->content),
                        'metadata' => $newContent['metadata'] ?? ($lesson->metadata ?? []),
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'data' => $newContent
                ]);
            }

            \Log::warning('Subtopic not found during generation', [
                'searched' => $subtopicTitle,
                'normalized' => $normSubtopicTitle,
                'course_id' => $courseId
            ]);

            return response()->json(['success' => false, 'message' => 'common.subtopic_not_found'], 404);

        } catch (\Exception $e) {
            \Log::error('Generate Lesson Failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function translateTitle(Request $request)
    {
        $request->validate(['title' => 'required|string']);
        try {
            $translated = $this->aiService->translateTitle($request->title);
            return response()->json(['translated' => trim($translated)]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
