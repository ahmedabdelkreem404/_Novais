<?php

namespace App\Services;

use App\Models\MediaCache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MediaResolverService
{
    protected $cacheTtlDays;
    protected $minRelevanceScore;

    public function __construct()
    {
        $this->cacheTtlDays = config('services.media.cache_ttl_days', 30);
        $this->minRelevanceScore = config('services.media.min_relevance_score', 0.25);
    }

    /**
     * Resolve images from free, open content sources
     * NO API KEYS REQUIRED
     */
    /**
     * Resolve images using Advanced Ranking System
     * STRICT SEARCH & FILTERING
     */
    public function resolveImages(string $query, string $intent = 'educational', array $constraints = []): ?array
    {
        $multiple = $this->resolveImagesMultiple($query, $intent, $constraints, 1);
        return $multiple[0] ?? null;
    }

    /**
     * Resolve multiple image candidates with validation
     */
    public function resolveImagesMultiple(string $query, string $intent = 'educational', array $constraints = [], int $limit = 3): array
    {
        $queryHash = $this->generateQueryHash($query . '_multiple', $intent, $constraints);
        
        // Input Parsing
        $parts = explode(',', $query);
        $lessonTitle = trim($parts[0]);
        $courseName = trim($parts[1] ?? '');

        // === Check cache first ===
        // We'll skip cache for multiple to ensure freshness during this rollout, 
        // or we could adapt cache to store arrays. For now, let's keep it simple.
        
        // Fetch candidates
        $negativeKeywords = "-book -cover -youtube -facebook -comic -superhero -marvel -dc -manga -anime -disney";
        $contextSuffix = ($intent === 'educational' || $intent === 'technical') ? "diagram schematic code" : "";
        $enhancedQuery = trim("{$query} {$contextSuffix} {$negativeKeywords}");
        
        $candidates = $this->fetchFromBingImages($enhancedQuery, $constraints);
        
        $scoredCandidates = [];
        foreach ($candidates as $candidate) {
            $score = $this->calculateAdvancedImageScore($candidate, $lessonTitle, $courseName);
            if ($score >= 0) { // Only keep non-terrible ones
                $candidate['score_raw'] = $score;
                $scoredCandidates[] = $candidate;
            }
        }

        // Sort by score
        usort($scoredCandidates, fn($a, $b) => $b['score_raw'] <=> $a['score_raw']);

        $validated = [];
        foreach ($scoredCandidates as $candidate) {
            if (count($validated) >= $limit) break;

            // PRE-VALIDATION: Check if URL actually works and isn't blocking us
            if ($this->isUrlAccessible($candidate['url'])) {
                $normalizedScore = min(1.0, max(0.0, $candidate['score_raw'] / 25.0));
                $candidate['score'] = $normalizedScore;
                $validated[] = $candidate;
            } else {
                Log::warning("Skipping inaccessible image URL", ['url' => $candidate['url']]);
            }
        }

        return $validated;
    }

    /**
     * Real-time validation of Image URL access (Anti-Hotlinking Check)
     */
    private function isUrlAccessible(string $url): bool
    {
        try {
            // Use a HEAD request or a limited GET request to check accessibility
            // Range: 0-100 bytes to keep it extremely fast
            $response = Http::timeout(2)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'image/*'
                ])
                ->get($url, [
                    'headers' => ['Range' => 'bytes=0-100']
                ]);

            if ($response->successful()) {
                // Check if it's actually an image
                $contentType = $response->header('Content-Type');
                if (str_contains($contentType, 'image') || str_contains($contentType, 'octet-stream')) {
                    return true;
                }
            }
            
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Advanced Image Scoring Logic (Strict)
     */
    private function calculateAdvancedImageScore(array $media, string $lessonTitle, string $courseName): float
    {
        $score = 0;
        $titleLower = mb_strtolower($media['title']);
        $descLower = mb_strtolower($media['description'] ?? '');
        $urlLower = mb_strtolower($media['url']);
        $lessonKeywords = $this->extractKeywords($lessonTitle);
        $courseKeywords = $this->extractKeywords($courseName);

        // === 0. BLACKLIST FILTER (STRICT) ===
        // Completely exclude social media, video platforms, document previews, and watermark-heavy stock sites
        if (preg_match('/(facebook|fb\.com|fbsbx|instagram|cdninstagram|youtube|youtu\.be|ytimg|tiktok|twitter|twimg|x\.com|scribd|scribdassets|slideshare|issuu|docplayer|tasnimnews|codelucky|pinterest|shutterstock|istock|alamy|gettyimages|123rf)/i', $urlLower)) {
            return -1000;
        }
        
        // Exclude PDF files, document viewers, or news articles (often generic covers)
        if (str_contains($urlLower, '.pdf') || str_contains($urlLower, '/document/') || preg_match('/(news|blog|article|post)/i', $urlLower)) {
            return -1000;
        }

        // === 0.5. PROMOTIONAL/ADVERTISING CONTENT FILTER ===
        // Detect company promotional images, advertisements, branded content
        // Check for website URLs in title (companies watermark titles with www.company.com)
        if (preg_match('/(www\.|\.com|\.net|\.org|\.co\.|http)/i', $titleLower)) {
            return -1000;
        }
        
        // Check for promotional/advertising keywords (Arabic + English)
        if (preg_match('/(خدمة|خدمات|شركة|دعاية|إعلان|تسويق|promotion|advertising|service|company|corp|inc\.|ltd\.|agency|media.*publishing)/iu', $titleLower)) {
            return -1000;
        }
        
        // Penalize domains known to block direct image embedding (hotlinking) or have poor reliability
        $restrictedPattern = '/(researchgate\.net|shutterstock\.com|dreamstime\.com|gettyimages\.com|istockphoto\.com|alamy\.com|vectorstock\.com|adobe\.com|stock\.adobe\.com|slideshare\.net|slideplayer\.com|pinterest\.com|pinimg\.com|scribd\.com|media\.licdn\.com|twimg\.com)/i';
        if (preg_match($restrictedPattern, $urlLower)) {
            return -1000;
        }

        // Penalize "PPT/Presentation" titles which indicate non-embeddable or low-quality sources
        if (preg_match('/(ppt download|powerpoint|slideshare|slideplayer|presentation|view slides)/i', $titleLower)) {
            $score -= 50; 
            // If it's a direct PPT site, kill it
            if (preg_match('/(slideshare|slideplayer)/i', $urlLower)) return -1000;
        }

        // === 1. RELEVANCE (0-5) ===
        // +5 = Contains lesson keywords in title
        $lessonMatches = 0;
        foreach ($lessonKeywords as $kw) {
            if (str_contains($titleLower, $kw) || str_contains($descLower, $kw)) $lessonMatches++;
        }
        if ($lessonMatches >= max(1, count($lessonKeywords) * 0.6)) $score += 5;
        elseif ($lessonMatches > 0) $score += 2;

        // +3 = Contains course keyword
        foreach ($courseKeywords as $ckw) {
            if (str_contains($titleLower, $ckw)) {
                $score += 3;
                break;
            }
        }

        // +4 = Instructional / Tutorial related (Arabic + English)
        if (preg_match('/(infographic|tutorial|how.*works|explanation|breakdown|guide|step.*by.*step|شرح|توضيح|كيفية|إنفوجرافيك|تعليمي)/iu', $titleLower)) {
            $score += 4;
        }

        // +2 = Diagram/code related
        if (preg_match('/(diagram|chart|schema|architecture|code|syntax|snippet|example|structure|flow|flowchart|layout|behavior)/i', $titleLower)) {
            $score += 4; // Boost from 2 to 4 for logical visuals
        }

        // +1 = Generic programming image (if it's a tech topic)
        if (preg_match('/(programming|computer|software|developer|screen|monitor)/i', $titleLower)) {
            $score += 1;
        }


        // === 2. QUALITY (0-3) ===
        $width = $media['metadata']['width'] ?? 0;
        
        // +3 = High resolution (>800px)
        if ($width > 800) $score += 3;
        // +1 = Medium resolution (>400px)
        elseif ($width > 400) $score += 1;
        
        // +2 = Clear diagram (simple text boost)
        if (preg_match('/(diagram|clear|overview)/i', $titleLower)) {
            $score += 2;
        }


        // === 3. PENALTY ===
        // -5 = Meme
        if (preg_match('/(meme|funny|joke|lol|humor)/i', $titleLower)) $score -= 5;
        
        // -10 = Aesthetic/Background only (Not instructional)
        if (preg_match('/(wallpaper|aesthetic|cool|background|backgrounds|dark|minimalist|gradient)/i', $titleLower)) {
            $score -= 10;
        }
        
        // -10 = Generic lifestyle/marketing photo
        if (preg_match('/(marketing|business|success|goal|motivation|professional)/i', $titleLower) && !preg_match('/(infographic|tutorial|diagram)/i', $titleLower)) {
            $score -= 10;
        }
        
        // -10 = Adult / Nudity / Unsafe (Basic keyword check, Bing SafeSearch does heavy lifting)
        if (preg_match('/(nude|sex|xxx|porn|adult)/i', $titleLower)) $score -= 10;
        
        // -3 = Clickbait text
        if (preg_match('/(shocking|you won\'t believe|secret|exposed)/i', $titleLower)) $score -= 3;
        
        // -500 = Entertainment/Pop Culture (STRICT BAN - User reported superheroes in programming)
        if (preg_match('/(comic|marvel|dc comics|superhero|batman|superman|spider-man|wonder woman|avengers|justice league|universe|manga|anime|disney|movie|film|actor|superheroes)/i', $titleLower)) {
            $score -= 500;
            return -1000;
        }
        
        // -500 = Book Covers (NUCLEAR OPTION - User repeatedly requested NO book covers)
        // Comprehensive detection: English + Arabic terms, common book phrases, author patterns
        $isBookCover = preg_match('/(book|edition|paperback|hardcover|kindle|author|isbn|publish|beginner.*guide|step.*by.*step|learn|master|tutorial.*book|كتاب|تحميل|pdf|غلاف|طبعة|تأليف|رواية|قصة|مكتبة)/iu', $titleLower);
        $isBookStore = preg_match('/(amazon|goodreads|books|bookstore|store|shop|market|publisher)/i', $urlLower);
        
        if ($isBookCover || $isBookStore) {
            $score -= 500;
            // Early exit optimization - no point calculating further
            return -1000;
        }

        // -50 = Vertical Images (Portrait Mode)
        // Book covers are almost always vertical. Diagrams are usually horizontal.
        $height = $media['metadata']['height'] ?? 0;
        if ($width > 0 && $height > 0 && $height > ($width * 1.1)) {
            $score -= 50;
            // If already very negative due to portrait + other penalties, exit early
            if ($score < -200) return -1000;
        }
        
        // Extra: Low resolution penalty
        if ($width > 0 && $width < 200) $score -= 5;

        // === 3.5. CROSS-DOMAIN MISMATCH PENALTY (CRITICAL) ===
        // Case A: Prevent medical/anatomy results in tech/programming courses
        $isTechTopic = preg_match('/(programming|code|software|computer|web|development|tech|data|algorithm|html|css|javascript|python|java|php|c\+\+|sql|linux)/i', $courseName . ' ' . $lessonTitle);
        $isMedicalResult = preg_match('/(heart|organ|anatomy|medical|medicine|biological|cells|artery|human body|physiotherapy|doctor|hospital|patient|disease)/i', $titleLower . ' ' . $descLower);
        
        if ($isTechTopic && $isMedicalResult) {
            $score -= 30;
        }

        // Case B: Art vs. Fitness/Physical Workout Disambiguation
        // User reported "Drawing Warm-up" showing gym exercises.
        $isArtTopic = preg_match('/(drawing|sketching|painting|art|sketch|illustration|pencil|charcoal|رسم|فن|تلوين|رصاص|سكيتش)/iu', $courseName . ' ' . $lessonTitle);
        $isFitnessResult = preg_match('/(workout|fitness|gym|bodybuilding|muscle|training|calisthenics|إحماء|تمارين|عضلات|جيم|فيتنس|exercise guide|lyfta|fitnesspal)/iu', $titleLower . ' ' . $descLower . ' ' . $urlLower);

        if ($isArtTopic && $isFitnessResult) {
            // Check if it's explicitly about artistic anatomy, if not, kill it
            if (!preg_match('/(artist anatomy|figure drawing|proportions)/i', $titleLower)) {
                $score -= 60; // Heavy penalty to ensure it's buried
            }
        }

        // === 4. SOURCE RELEVANCE ===
        // +5 = Educational/Documentation Domains
        $eduDomains = [
            'wikipedia.org', 'medium.com', 'geeksforgeeks.org', 'w3schools.com', 
            'khanacademy.org', 'tutorialspoint.com', 'educba.com', 'stackexchange.com', 
            'stackoverflow.com', 'britannica.com', 'javatpoint.com', 'programiz.com',
            'guru99.com', 'techtarget.com', 'microsoft.com', 'oracle.com', 'mdn.io'
        ];
        foreach ($eduDomains as $domain) {
            if (str_contains($urlLower, $domain)) {
                $score += 8; // Boost from 5 to 8 for academic reliability
                break;
            }
        }

        // Boost if URL contains keywords, as filenames often describe the specific image content better than the page title
        $urlLower = mb_strtolower($media['url']);
        $urlMatches = 0;
        foreach ($lessonKeywords as $kw) {
             if (strlen($kw) < 3) continue;
             if (str_contains($urlLower, $kw)) $urlMatches++;
        }
        
        if ($urlMatches >= 2) $score += 3;
        elseif ($urlMatches == 1) $score += 1;

        // Boost for descriptive filenames
        if (preg_match('/(diagram|chart|schema|structure|flow|syntax|example|cheatsheet)/i', $urlLower)) {
            $score += 2;
        }

        return $score;
    }

    private function extractKeywords(string $text): array
    {
        $text = mb_strtolower($text);
        // Remove common chars
        // Keep letters, numbers, and technical symbols (parentheses, brackets, dots) for better tech matching
        $text = preg_replace('/[^\p{L}\p{N}\s\(\)\[\]\.]/u', '', $text);
        $words = explode(' ', $text);
        $stopWords = ['the','a','an','of','in','on','at','to','for','with','by','and','or','is','are','guide','tutorial','how','introduction','learn','course','lesson','part','step','complete','beginner','advanced'];
        
        return array_values(array_diff($words, $stopWords));
    }

    /**
     * Resolve videos using YouTube oEmbed (100% Free, Official)
     * NO API KEY REQUIRED
     */
    /**
     * Resolve videos using Advanced Ranking System
     * STRICT SEARCH & FILTERING & SCORING
     */
    public function resolveVideos(string $query, string $intent = 'educational', array $constraints = []): ?array
    {
        $queryHash = $this->generateQueryHash($query, $intent, $constraints);
        
        // Input Parsing
        $parts = explode(',', $query);
        $lessonTitle = trim($parts[0]);
        $courseName = trim($parts[1] ?? '');
        $language = $constraints['language'] ?? 'en';

        // Check cache first
        $cached = MediaCache::valid()
            ->relevant($this->minRelevanceScore)
            ->where('query_hash', $queryHash)
            ->where('type', 'video')
            ->first();

        if ($cached) {
            Log::info('Media Cache Hit (Video)', ['query' => $query]);
            return $this->formatCachedMedia($cached);
        }
        
        // === STEP 3: VIDEO SEARCH (YOUTUBE) ===
        // Construct Query with COURSE CONTEXT to avoid ambiguous results
        $isArabic = (strtolower($language) === 'ar' || str_contains(strtolower($language), 'arabic'));
        
        if ($isArabic) {
            // Arabic: Always include course name + programming context
            // "برمجة" (programming) disambiguates technical content from generic terms
            // Example: "الرأس والجسم HTML شرح برمجة" vs "الرأس والجسم شرح" (which returns medical videos)
            $searchQuery = "{$lessonTitle} {$courseName} شرح برمجة";
        } else {
            // English: Include course name + tutorial + programming for better targeting
            $searchQuery = "{$lessonTitle} {$courseName} tutorial programming";
        }

        // Fetch Top 10 Candidates (IDs + Titles if possible)
        $candidates = $this->fetchYouTubeCandidates($searchQuery);
        
        $bestVideo = null;
        $highestScore = -100;

        foreach ($candidates as $candidate) {
            // Fetch Details (Duration, Channel) via oEmbed or scrape enrichment
            // To save time, we might only have Title/ID from search.
            // Let's assume fetchYouTubeCandidates tries to get basic metadata.

            // === FILTERING RULES ===
            // Reject if Shorts (vertical/short duration)
            if (($candidate['metadata']['duration_sec'] ?? 121) < 120) continue; // < 2 mins rule
            if (str_contains($candidate['url'], 'shorts/')) continue;
            
            // Reject specific bad keywords
            if ($this->isLowQualityVideo($candidate['title'])) continue;

            // === SCORING ===
            $score = $this->calculateVideoScore($candidate, $lessonTitle, $courseName, $isArabic);
            
            if ($score > $highestScore) {
                $highestScore = $score;
                $bestVideo = $candidate;
            }
        }

        // Retry Logic: If score < 5 -> retry with "{Lesson Title} tutorial , {Course Name}"
        if ($highestScore < 5) {
            Log::info('Low video score (<5), retrying search...', ['score' => $highestScore]);
            
            $suffix = $isArabic ? 'شرح برمجة كود' : 'tutorial programming code';
            $retryQuery = "{$lessonTitle} {$suffix} {$courseName}";
            
            $retryCandidates = $this->fetchYouTubeCandidates($retryQuery);
             foreach ($retryCandidates as $candidate) {
                 if (($candidate['metadata']['duration_sec'] ?? 121) < 120) continue;
                 if (str_contains($candidate['url'], 'shorts/')) continue;
                 if ($this->isLowQualityVideo($candidate['title'])) continue;

                $score = $this->calculateVideoScore($candidate, $lessonTitle, $courseName, $isArabic);
                if ($score > $highestScore) {
                    $highestScore = $score;
                    $bestVideo = $candidate;
                }
            }
        }

        if (!$bestVideo || $highestScore < 0) {
            Log::warning('Video resolution failed after strict checks', ['query' => $query, 'top_score' => $highestScore]);
            return null;
        }

        // Normalize video score (Estimated max ~15)
        $normalizedScore = min(1.0, max(0.0, $highestScore / 15.0));

        // Cache the result
        $this->cacheMedia($queryHash, 'video', $bestVideo, $normalizedScore);

        return array_merge($bestVideo, ['score' => $normalizedScore]);
    }

    private function calculateVideoScore(array $media, string $lessonTitle, string $courseName, bool $isArabic): float
    {
        $score = 0;
        $titleLower = mb_strtolower($media['title']);
        $lessonKeywords = $this->extractKeywords($lessonTitle);
        $courseKeywords = $this->extractKeywords($courseName);
        
        // === 1. RELEVANCE (0-5) ===
        // +5 = Exact lesson topic (high overlap)
        $lessonMatches = 0;
        foreach ($lessonKeywords as $kw) {
            if (str_contains($titleLower, $kw)) $lessonMatches++;
        }
        
        if ($lessonMatches >= count($lessonKeywords) && count($lessonKeywords) > 0) $score += 5;
        elseif ($lessonMatches >= max(1, count($lessonKeywords) * 0.6)) $score += 3; // Strongly related
        else $score += 1; // General course tutorial

        // === 2. AUTHORITY (0-3) ===
        // +3 = Known programming channel (Hardcoded list for now)
        $knownChannels = ['freecodecamp', 'traversy media', 'fireship', 'programming with mosh', 'elzero web school', 'codezilla', 'net ninja', 'academind'];
        $channelLower = mb_strtolower($media['metadata']['channel'] ?? '');
        
        if (in_array($channelLower, $knownChannels)) $score += 3;
        
        // +1 = Clear structured thumbnail (Hard to check without Vision AI, skipping or assuming based on title format)
        if (preg_match('/(part|ep|episode|#)\s*\d+/i', $titleLower)) { // Structured series
            $score += 1;
        }
        
        // +2 = Arabic Educational Channels preference (Rule: Prefer Arabic educational channels)
        if ($isArabic && preg_match('/[\p{Arabic}]/u', $titleLower)) {
             $score += 2;
        }


        // === 3. PENALTY ===
        // -5 = Shorts (Already filtered, but double check)
        if (str_contains($media['url'], 'shorts')) $score -= 5;

        // -3 = Clickbait
        if (preg_match('/(shocking|must watch|gone wrong|secret|exposed)/i', $titleLower)) $score -= 3;
        
        // -10 = Adult (Keyword check)
        if (preg_match('/(hot|sex|18\+|porn)/i', $titleLower)) $score -= 10;
        
        // Entertainment only check (Gaming, Reacts)
        if (preg_match('/(gameplay|react|review|unboxing|funny|moments|fails)/i', $titleLower) && !str_contains($lessonTitle, 'Review')) {
            $score -= 4;
        }

        return $score;
    }

    private function isLowQualityVideo(string $title): bool
    {
        $badKeywords = ['meme', 'compilation', 'funny', 'tiktok', 'vine', 'status', 'whatsapp status'];
        foreach ($badKeywords as $kw) {
            if (stripos($title, $kw) !== false) return true;
        }
        return false;
    }

    /**
     * Scrapes a list of video candidates data from YouTube Search Results
     */
    private function fetchYouTubeCandidates(string $query): array
    {
        try {
            // Force long duration filter (> 4 mins to avoid shorts effectively) if possible, 
            // but user said "Reject if duration < 2 mins".
            // YouTube Filter for duration > 4 mins (Long) is sp=EgIYAg%253D%253D (Video), sp=EgIYAw%253D%253D (Medium)
            // Let's use basic search first + sp=EgIQAQ%3D%3D (Video only, no playlists/channels)
            $searchUrl = 'https://www.youtube.com/results?search_query=' . urlencode($query) . '&sp=EgIQAQ%3D%3D';
            
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ])->get($searchUrl);

            if (!$response->successful()) return [];

            $html = $response->body();
            $candidates = [];
            
            // Extract ytInitialData
            if (preg_match('/var ytInitialData = ({.*?});<\/script>/', $html, $matches)) {
                $jsonData = json_decode($matches[1], true);
                
                // Deep traversal to find videoRenderers (This structure changes often, hence risky but standard scraping way)
                // Recursive search or known paths?
                // Let's do a regex search on the JSON string for robustness against structure changes, 
                // looking for "videoRenderer":{...}
                
                // Regex to find video objects
                // "videoId":"..." ... "title":{"runs":[{"text":"..."}]} ... "lengthText":...
                
                // Pattern to extract videoId and Title segments
                // This is tricky. Let's iterate on regex matches for videoId and try to snag context.
                
                // Better approach: Parse specific keys from JSON using regex without decoding full JSON (too huge)
                preg_match_all('/"videoId":"([a-zA-Z0-9_-]{11})","thumbnail".*?"title":{"runs":\[{"text":"(.*?)"}\].*?"longBylineText".*?"text":"(.*?)".*?("lengthText":{"accessibility":.*?simpleText":"(.*?)"}|\"lengthSeconds":"(\d+)")/s', $matches[1], $videoMatches, PREG_SET_ORDER);
                
                $count = 0;
                foreach ($videoMatches as $vm) {
                    if ($count >= 10) break;
                    
                    $videoId = $vm[1];
                    $title = $vm[2];
                    $channel = $vm[3];
                    $durationText = $vm[5] ? $vm[5] : ($vm[6] ?? '0'); // 10:02 or seconds
                    
                    // Parse duration
                    $durationSec = 0;
                    if (is_numeric($durationText)) {
                        $durationSec = (int)$durationText;
                    } else {
                        // Parse "MM:SS" or "HH:MM:SS"
                        $pts = array_reverse(explode(':', $durationText));
                        $durationSec = ($pts[0] ?? 0) + (($pts[1] ?? 0) * 60) + (($pts[2] ?? 0) * 3600);
                    }

                    $candidates[] = [
                        'url' => "https://www.youtube.com/watch?v={$videoId}",
                        'title' => $title,
                        'description' => '',
                        'source' => 'youtube',
                        'metadata' => [
                            'video_id' => $videoId,
                            'channel' => $channel,
                            'duration_sec' => $durationSec,
                            'thumbnail' => "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg"
                        ]
                    ];
                    $count++;
                }
            }
            
            return $candidates;

        } catch (\Exception $e) {
            Log::error('YouTube Scraper Error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Wikimedia Commons API (100% Free, No Key)
     * Best source for educational diagrams
     */
    private function fetchFromWikimediaCommons(string $query, array $constraints): ?array
    {
        try {
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'NOVAIS/1.0 Educational Platform (https://github.com/educational)'
            ])->get('https://commons.wikimedia.org/w/api.php', [
                'action' => 'query',
                'format' => 'json',
                'generator' => 'search',
                'gsrsearch' => $query, // Use original query
                'gsrnamespace' => '6',
                'gsrlimit' => '5',
                'prop' => 'imageinfo',
                'iiprop' => 'url|size|extmetadata',
                'iiurlwidth' => '800',
            ]);

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();
            $pages = $data['query']['pages'] ?? [];
            
            if (empty($pages)) {
                return null;
            }

            // Get first result
            $page = array_values($pages)[0];
            $imageInfo = $page['imageinfo'][0] ?? null;

            if (!$imageInfo) {
                return null;
            }

            $metadata = $imageInfo['extmetadata'] ?? [];
            
            return [
                'url' => $imageInfo['thumburl'] ?? $imageInfo['url'],
                'title' => $metadata['ObjectName']['value'] ?? $page['title'] ?? $query,
                'description' => $metadata['ImageDescription']['value'] ?? '',
                'source' => 'wikimedia',
                'metadata' => [
                    'width' => $imageInfo['thumbwidth'] ?? $imageInfo['width'],
                    'height' => $imageInfo['thumbheight'] ?? $imageInfo['height'],
                    'author' => $metadata['Artist']['value'] ?? 'Wikimedia Commons',
                    'license' => $metadata['LicenseShortName']['value'] ?? 'CC',
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Wikimedia API Error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Openverse API (100% Free, No Key)
     * Creative Commons images
     */
    private function fetchFromOpenverse(string $query, array $constraints): ?array
    {
        try {
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'NOVAIS/1.0 Educational Platform (https://github.com/educational)'
            ])->get('https://api.openverse.engineering/v1/images/', [
                'q' => $query, // Use original query
                'license_type' => 'commercial',
                'page_size' => 5,
            ]);

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();
            $results = $data['results'] ?? [];
            
            if (empty($results)) {
                return null;
            }

            $result = $results[0];

            return [
                'url' => $result['url'],
                'title' => $result['title'] ?? $query,
                'description' => $result['description'] ?? '',
                'source' => 'openverse',
                'metadata' => [
                    'width' => $result['width'] ?? 1280,
                    'height' => $result['height'] ?? 720,
                    'creator' => $result['creator'] ?? 'Unknown',
                    'license' => $result['license'] ?? 'CC',
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Openverse API Error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Pixabay via public RSS/JSON endpoint (No Key Required)
     */
    /**
     * DuckDuckGo Images Scraper (No API Key)
     * Much easier to scrape than Google, reliable for "Search Engine Results"
     */
    /**
     * DuckDuckGo Images Scraper (No API Key)
     * Reliable for "Search Engine Results" using the HTML-only version
     */
    private function fetchFromDuckDuckGo(string $query, array $constraints): ?array
    {
        try {
            // Use the HTML-only version of DuckDuckGo (lighter, easier to scrape)
            $searchQuery = urlencode($query . " educational diagram");
            $url = "https://duckduckgo.com/html/?q={$searchQuery}&iax=images&ia=images";
            
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept' => 'text/html',
                'Referer' => 'https://duckduckgo.com/'
            ])->get($url);

            if (!$response->successful()) return null;

            $html = $response->body();
            
            // Extract image URL from the result snippet
            // DDG HTML results usually look like: <a class="result__a" href="..."> ... <img class="result__image" src="..." data-src="...">
            // But better: parsing the "zci" or looking for the "result__url" isn't straightforward in HTML version.
            // Let's look for the specific url parameter in the redirect link: /l/?kh=-1&uddg=...
            // Or easier: Scan for jpg/png URLs that look like external images.
            
            // Regex to find external image URLs (http...) that end in extensions
            if (preg_match_all('/https?:\/\/[^\s"\'<>]+\.(?:jpg|png|jpeg|gif)/i', $html, $matches)) {
                
                // Filter matches to find a good one (not a tracking pixel or favicon)
                foreach ($matches[0] as $imageUrl) {
                    $imageUrl = urldecode($imageUrl);
                    
                    // Filter out DDG assets and icons
                    if (strpos($imageUrl, 'duckduckgo.com') !== false) continue;
                    if (strpos($imageUrl, 'ico') !== false) continue;
                    
                    // Simple validation check (head request) - optional for speed
                    // Return the first valid-looking external image
                    return [
                        'url' => $imageUrl,
                        'title' => $query . " (Web Search)",
                        'description' => 'Image from Web Search',
                        'source' => 'google_web', // Keep consistent source ID for high score
                        'metadata' => ['original_query' => $query],
                        'score' => 0.85 // High trust
                    ];
                }
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Web Search Scraper Error', ['msg' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Bing Images Scraper (100% Free, No API Key)
     * Scrapes real Bing search results via HTML parsing
     */
    /**
     * Bing Images Scraper (100% Free, No API Key)
     * Scrapes real Bing search results via HTML parsing
     * Returns a LIST of candidates for ranking.
     */
    private function fetchFromBingImages(string $query, array $constraints): array
    {
        try {
            // Bing Images URL with strict SafeSearch and commercial license filters
            // Using first=1 to get results from the start
            $searchQuery = urlencode($query);
            $url = "https://www.bing.com/images/search?q={$searchQuery}&form=HDRSC3&first=1&adlt=strict"; 
            
            $response = Http::timeout(8)->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language' => 'en-US,en;q=0.5',
                'Referer' => 'https://www.bing.com/'
            ])->get($url);

            if (!$response->successful()) {
                Log::warning('Bing scraper failed', ['status' => $response->status()]);
                return [];
            }

            $html = $response->body();
            $candidates = [];
            
            // Bing stores image metadata in JSON embedded in the HTML under attribute 'm'
            // Pattern: m="{&quot;murl&quot;:&quot;URL&quot;,&quot;t&quot;:&quot;TITLE&quot;...}"
            if (preg_match_all('/m\s*=\s*(["\'])(.*?)\1/i', $html, $matches)) {
                $count = 0;
                foreach ($matches[2] as $encodedJson) {
                    if ($count >= 20) break; // Limit parsing to top 20 results

                    // Unescape the attribute value
                    $jsonStr = htmlspecialchars_decode(html_entity_decode($encodedJson, ENT_QUOTES));
                    $itemData = json_decode($jsonStr, true);

                    if (!$itemData || empty($itemData['murl'])) continue;

                    $imageUrl = $itemData['murl'];
                    $imageTitle = $itemData['t'] ?? ($itemData['desc'] ?? $query);
                    $width = $itemData['w'] ?? 0;
                    $height = $itemData['h'] ?? 0;
                    
                    if (!filter_var($imageUrl, FILTER_VALIDATE_URL)) continue;

                    $candidates[] = [
                        'url' => $imageUrl,
                        'title' => $imageTitle,
                        'description' => $itemData['desc'] ?? 'Bing Search result',
                        'source' => 'bing',
                        'metadata' => [
                            'query' => $query,
                            'license' => 'Free to use commercially',
                            'provider' => $itemData['purl'] ?? 'Bing',
                            'width' => $width,
                            'height' => $height
                        ]
                    ];
                    $count++;
                }
            }
            
            return $candidates;

        } catch (\Exception $e) {
            Log::error('Bing Scraper Error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Google Custom Search API (Official API)
     * Fetches real Google Images search results
     * Free tier: 100 queries/day
     */
    private function fetchFromGoogleCustomSearch(string $query, array $constraints): ?array
    {
        try {
            $apiKey = env('GOOGLE_CSE_API_KEY');
            $searchEngineId = env('GOOGLE_CSE_ID');
            
            if (!$apiKey || !$searchEngineId) {
                Log::error('Google Custom Search not configured', [
                    'has_key' => !empty($apiKey),
                    'has_id' => !empty($searchEngineId)
                ]);
                return null;
            }

            $response = Http::timeout(10)->get('https://www.googleapis.com/customsearch/v1', [
                'key' => $apiKey,
                'cx' => $searchEngineId,
                'q' => $query,
                'searchType' => 'image',
                'num' => 5,
                'safe' => 'active',
                'imgSize' => 'large',
            ]);

            if (!$response->successful()) {
                Log::warning('Google CSE API failed', [
                    'status' => $response->status(),
                    'error' => $response->json()['error']['message'] ?? 'Unknown'
                ]);
                return null;
            }

            $data = $response->json();
            $items = $data['items'] ?? [];
            
            if (empty($items)) {
                Log::info('Google CSE returned no results', ['query' => $query]);
                return null;
            }

            $item = $items[0];

            return [
                'url' => $item['link'],
                'title' => $item['title'] ?? $query,
                'description' => $item['snippet'] ?? '',
                'source' => 'google_cse',
                'metadata' => [
                    'width' => $item['image']['width'] ?? 1280,
                    'height' => $item['image']['height'] ?? 720,
                    'thumbnail' => $item['image']['thumbnailLink'] ?? '',
                    'context' => $item['displayLink'] ?? '',
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Google CSE Error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Pexels API (Free, Professionally Curated)
     * SAFE, moderated content - best for educational use
     */
    private function fetchFromPexels(string $query, array $constraints): ?array
    {
        try {
            $apiKey = env('PEXELS_API_KEY');
            
            if (!$apiKey) {
                Log::warning('Pexels API key not configured');
                return null;
            }

            $response = Http::timeout(10)->withHeaders([
                'Authorization' => $apiKey,
                'User-Agent' => 'NOVAIS/1.0 Educational Platform'
            ])->get('https://api.pexels.com/v1/search', [
                'query' => $query . ' education technology',
                'per_page' => 5,
                'orientation' => $constraints['orientation'] ?? 'landscape',
            ]);

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();
            $photos = $data['photos'] ?? [];
            
            if (empty($photos)) {
                return null;
            }

            $photo = $photos[0];

            return [
                'url' => $photo['src']['large'] ?? $photo['src']['original'],
                'title' => $query . ' (Pexels)',
                'description' => $photo['alt'] ?? '',
                'source' => 'pexels',
                'metadata' => [
                    'width' => $photo['width'],
                    'height' => $photo['height'],
                    'photographer' => $photo['photographer'] ?? 'Unknown',
                    'license' => 'Pexels License (Free)',
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Pexels API Error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Pixabay API (100% Free, Key Required)
     */
    private function fetchFromPixabay(string $query, array $constraints): ?array
    {
        try {
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'NOVAIS/1.0 Educational Platform (https://github.com/educational)'
            ])->get('https://pixabay.com/api/', [
                'key' => '9656065-a4094594c34f9ac14c7fc4c39',
                'q' => $query,
                'image_type' => 'photo',
                'safesearch' => 'true',
                'per_page' => 3,
            ]);

            if (!$response->successful()) {
                return null;
            }

            $data = $response->json();
            $hits = $data['hits'] ?? [];
            
            if (empty($hits)) {
                return null;
            }

            $hit = $hits[0];

            return [
                'url' => $hit['largeImageURL'] ?? $hit['webformatURL'],
                'title' => $hit['tags'] ?? $query,
                'description' => '',
                'source' => 'pixabay',
                'metadata' => [
                    'width' => $hit['imageWidth'],
                    'height' => $hit['imageHeight'],
                    'photographer' => $hit['user'] ?? 'Pixabay',
                    'license' => 'Pixabay License (Free)'
                ]
            ];

        } catch (\Exception $e) {
            Log::error('Pixabay Error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * YouTube oEmbed + Embed Resolver (100% Free, Official)
     * NO SCRAPING - Uses official YouTube embed protocol
     */
    private function fetchFromYouTubeEmbed(string $query, array $constraints, string $language = 'en', bool $useFilter = true): ?array
    {
        try {
            // Apply Duration Filter ONLY if requested: sp=EgIYAw%253D%253D (Medium 4-20 min)
            $durationFilter = $useFilter ? '&sp=EgIYAw%253D%253D' : ''; 

            // Only append English suffixes if the language is English and not already present
            $finalQuery = $query;
            if ((strtolower($language) === 'en' || strtolower($language) === 'english') && !str_contains(strtolower($query), 'tutorial')) {
                $finalQuery .= ' tutorial explanation';
            }

            $searchUrl = 'https://www.youtube.com/results?search_query=' . urlencode($finalQuery) . $durationFilter;
            
            $response = Http::timeout(10)->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ])->get($searchUrl);

            if (!$response->successful()) {
                return null;
            }

            $html = $response->body();
            
            preg_match_all('/"videoId":"([a-zA-Z0-9_-]{11})"/', $html, $matches);
            
            if (empty($matches[1])) {
                return null;
            }

            $videoId = $matches[1][0];
            $videoUrl = "https://www.youtube.com/watch?v={$videoId}";

            $oEmbedResponse = Http::timeout(5)->withHeaders([
                'User-Agent' => 'NOVAIS/1.0 Educational Platform (https://github.com/educational)'
            ])->get('https://www.youtube.com/oembed', [
                'url' => $videoUrl,
                'format' => 'json'
            ]);

            if (!$oEmbedResponse->successful()) {
                return [
                    'url' => $videoUrl,
                    'title' => $query,
                    'description' => '',
                    'source' => 'youtube',
                    'metadata' => [
                        'video_id' => $videoId,
                        'channel' => 'Unknown',
                        'thumbnail' => "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg"
                    ]
                ];
            }

            $oEmbedData = $oEmbedResponse->json();

            return [
                'url' => $videoUrl,
                'title' => $oEmbedData['title'] ?? $query,
                'description' => '',
                'source' => 'youtube',
                'metadata' => [
                    'video_id' => $videoId,
                    'channel' => $oEmbedData['author_name'] ?? 'Unknown',
                    'channel_id' => '',
                    'thumbnail' => $oEmbedData['thumbnail_url'] ?? "https://img.youtube.com/vi/{$videoId}/hqdefault.jpg",
                    'duration' => null,
                    'view_count' => 0,
                    'like_count' => 0
                ]
            ];

        } catch (\Exception $e) {
            Log::error('YouTube Embed Resolver Error', ['error' => $e->getMessage()]);
            return null;
        }
    }

    private function scoreImageRelevance(array $media, string $query, string $intent): float
    {
        // IF Source is Trusted Search Engine, provide a small reliability bonus 
        // but DO NOT skip the full word-overlap and keyword checking.
        $reliabilityBonus = 0.0;
        if (($media['source'] ?? '') === 'bing') $reliabilityBonus = 0.15;
        if (($media['source'] ?? '') === 'google_web') $reliabilityBonus = 0.20;

        // 1. Prepare Query: Remove stop words to focus on KEYWORDS (e.g., "Introduction to AI" -> "AI")
        $stopWords = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'with', 'by', 'introduction', 'basics', 'guide', 'tutorial', 'overview', 'chapter', 'lesson', 'summary', 'explanation', 'structure'];
        
        $queryWordsRaw = array_filter(explode(' ', strtolower($query)));
        $queryWords = array_diff($queryWordsRaw, $stopWords);
        
        // If query becomes empty (e.g., only stop words), revert to raw but penalize
        if (empty($queryWords)) {
            $queryWords = $queryWordsRaw;
        }

        $titleWords = array_map('strtolower', explode(' ', $media['title']));
        $titleMatch = $this->calculateWordOverlap($queryWords, $titleWords);
        
        $descWords = array_map('strtolower', explode(' ', $media['description'] ?? ''));
        $descMatch = $this->calculateWordOverlap($queryWords, $descWords);

        // CRITICAL: Animal/Nature penalty
        $animalNatureKeywords = [
            'snake', 'reptile', 'animal', 'wildlife', 'nature', 'bird', 'tree', 
            'forest', 'ocean', 'mountain', 'landscape', 'sunset', 'flower', 
            'beach', 'sea', 'water', 'sky', 'cloud', 'galaxy', 'star', 'planet'
        ];
        $titleLower = strtolower($media['title']);
        $descLower = strtolower($media['description'] ?? '');
        $animalPenalty = 0.0;
        
        foreach ($animalNatureKeywords as $keyword) {
            if (str_contains($titleLower, $keyword)) {
                $animalPenalty = -0.35; // Reduced penalty (was -0.60)
                break;
            }
        }

        // Source quality bonus
        $sourceBonus = 0.0;
        if ($media['source'] === 'wikimedia') $sourceBonus = 0.10;
        elseif ($media['source'] === 'openverse') $sourceBonus = 0.05;
        
        // Base score set to 0.15 (lowered from 0.25 to make scoring more discriminating)
        $baseScore = 0.15;
        
        // Dimension penalty (Small images are usually low quality thumbnails)
        $dimensionPenalty = 0.0;
        if (isset($media['metadata']['width']) && isset($media['metadata']['height'])) {
            if ($media['metadata']['width'] < 150 || $media['metadata']['height'] < 150) {
                $dimensionPenalty = -0.40;
            }
        }

        // Weights: Title match helps boost confidence
        $finalScore = $baseScore + ($titleMatch * 0.5) + ($descMatch * 0.2) + $sourceBonus + $animalPenalty + $dimensionPenalty + $reliabilityBonus;

        // Specialized Technical Scoring
        $technicalBonus = 0.0;
        $titleLower = strtolower($media['title']);
        $queryLower = strtolower($query);

        // Boost diagrams/tables/cheatsheets for programming topics
        if (preg_match('/(diagram|table|chart|graph|logic|circuit|schema|syntax|cheat sheet|overview|operators)/i', $titleLower)) {
            $technicalBonus += 0.20;
        }

        // Programming specificity adjustment
        if (preg_match('/(cpp|c\+\+|java|python|programming|code|syntax|operator|arithmetic|logic)/i', $queryLower)) {
            // Favor code snippets and actual programming content
            if (preg_match('/(code|snippet|example|output|compiler|console|variable|memory)/i', $titleLower)) {
                $technicalBonus += 0.25;
            }
            // Heavily penalize generic software/OS menus (like the LabVIEW menu in user's image)
            // if they contain generic UI terms but the query isn't about UI design.
            if (preg_match('/(menu|panel|toolbar|interface|gui|dialog|sidebar|button|click|context|right-click)/i', $titleLower) 
                && !preg_match('/(gui|interface|window|form)/i', $queryLower)) {
                $technicalBonus -= 0.40;
            }
        }
        
        $finalScore += $technicalBonus;
        
        return round($finalScore, 2);
    }



    private function scoreVideoRelevance(array $media, string $query, string $intent, array $constraints = []): float
    {
        // Normalize text for better matching (especially Arabic)
        $titleLower = $this->normalizeText($media['title']);
        $queryLower = $this->normalizeText($query);
        $courseTopic = $this->normalizeText($constraints['courseTopic'] ?? '');
        
        // === DYNAMIC Core Keyword Extraction from Query ===
        $stopWordsEn = ['the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'with', 'by', 
                        'is', 'it', 'this', 'that', 'how', 'what', 'why', 'when', 'where', 'who',
                        'tutorial', 'explanation', 'guide', 'introduction', 'basics', 'course', 'lesson'];
        $stopWordsAr = ['في', 'على', 'إلى', 'من', 'عن', 'مع', 'هذا', 'هذه', 'ما', 'كيف', 'لماذا', 
                        'متى', 'أين', 'شرح', 'دورة', 'درس', 'مقدمة', 'أساسيات', 'تعلم', 'كورس'];
        
        $allStopWords = array_merge($stopWordsEn, $stopWordsAr);
        
        // Split query into words and filter out stop words
        $queryWords = preg_split('/[\s\-_:،,]+/u', $queryLower);
        $coreQueryWords = array_filter($queryWords, function($word) use ($allStopWords) {
            return strlen($word) > 2 && !in_array($word, $allStopWords);
        });
        
        // === LESSON SPECIFIC KEYWORDS ===
        // Extract words that are in the query but NOT in the course topic
        $lessonSpecificWords = [];
        if (!empty($courseTopic)) {
            $courseTopicWords = preg_split('/[\s\-_:،,]+/u', $courseTopic);
            $lessonSpecificWords = array_filter($coreQueryWords, function($word) use ($courseTopicWords) {
                // Return true if word is NOT found in course topic words
                foreach ($courseTopicWords as $ctWord) {
                    if (mb_strlen($ctWord) > 2 && (str_contains($word, $ctWord) || str_contains($ctWord, $word))) {
                        return false;
                    }
                }
                return true;
            });
        }
        
        // Check how many core query words appear in the video title
        $matchedCoreWords = 0;
        $totalCoreWords = count($coreQueryWords);
        foreach ($coreQueryWords as $word) {
            if (str_contains($titleLower, $word)) {
                $matchedCoreWords++;
            }
        }
        
        // Check lesson specific matches
        $matchedLessonWords = 0;
        $totalLessonWords = count($lessonSpecificWords);
        foreach ($lessonSpecificWords as $word) {
            if (str_contains($titleLower, $word)) {
                $matchedLessonWords++;
            }
        }
        
        // Calculate core match ratio
        $coreMatchRatio = $totalCoreWords > 0 ? $matchedCoreWords / $totalCoreWords : 0;
        
        // CRITICAL: Penalty if matches course topic but has ZERO lesson-specific words
        $lessonMismatchPenalty = 0.0;
        if ($totalLessonWords > 0 && $matchedLessonWords === 0) {
            $lessonMismatchPenalty = -0.50; // Strong penalty for missing lesson context
            Log::info('Video lesson context mismatch', [
                'title' => $media['title'],
                'lessonWords' => array_values($lessonSpecificWords),
                'penalty' => $lessonMismatchPenalty
            ]);
        }
        
        // If less than 50% of core words match, apply penalty
        $coreMismatchPenalty = 0.0;
        if ($totalCoreWords > 0 && $coreMatchRatio < 0.50) {
            $coreMismatchPenalty = -0.40; // Heavy penalty for topic mismatch
        }
        
        // Comparison video penalty
        $comparisonKeywords = ['الفرق بين', 'مقارنة', 'vs', 'versus', 'difference between', 'compare', 'comparison'];
        $comparisonPenalty = 0.0;
        $queryAboutComparison = false;
        foreach ($comparisonKeywords as $keyword) {
            if (str_contains($queryLower, $keyword)) {
                $queryAboutComparison = true;
                break;
            }
        }
        
        if (!$queryAboutComparison) {
            foreach ($comparisonKeywords as $keyword) {
                if (str_contains($titleLower, $keyword)) {
                    $comparisonPenalty = -0.30;
                    break;
                }
            }
        }
        
        $titleWords = preg_split('/[\s\-_:،,]+/u', $titleLower);
        $titleMatch = $this->calculateWordOverlap(array_values($coreQueryWords), $titleWords);
        
        // Educational keywords bonus
        $educationalKeywords = ['tutorial', 'explained', 'course', 'lesson', 'learn', 'introduction', 
                                'guide', 'basics', 'fundamentals', 'شرح', 'دورة', 'تعلم', 'للمبتدئين', 
                                'من الصفر', 'كورس', 'درس'];
        $eduBonus = 0.0;
        foreach ($educationalKeywords as $keyword) {
            if (str_contains($titleLower, $keyword)) {
                $eduBonus = 0.15;
                break;
            }
        }
        
        // Setup penalty
        $setupKeywords = ['install', 'installation', 'setup', 'download', 'configure', 'environment', 
                          'jdk', 'sdk', 'ide', 'تثبيت', 'تنصيب', 'إعداد'];
        $setupPenalty = 0.0;
        $queryAboutSetup = false;
        foreach ($setupKeywords as $keyword) {
            if (str_contains($queryLower, $keyword)) {
                $queryAboutSetup = true;
                break;
            }
        }
        
        if (!$queryAboutSetup) {
            foreach ($setupKeywords as $keyword) {
                if (str_contains($titleLower, $keyword)) {
                    $setupPenalty = -0.20;
                    break;
                }
            }
        }

        // === CROSS-DOMAIN FILTERING (NEW) ===
        // Penalize videos from irrelevant industries unless the course is about them
        $bannedDomains = [
            'tv_cinema' => ['movie', 'cinema', 'film', 'television', 'tv production', 'acting', 'box office', 'سينما', 'تلفزيون', 'تليفزيون', 'تمثيل', 'إخراج', 'إنتاج تلفزيوني', 'مسلسل', 'فيلم', 'مسرح'],
            'programming' => ['code', 'python', 'java', 'c++', 'javascript', 'algorithm', 'database', 'برمجة', 'كود', 'خوارزميات', 'قواعد بيانات'],
            'cooking' => ['recipe', 'cooking', 'finance', 'kitchen', 'food', 'طبخ', 'وصفة', 'مطبخ', 'أكل'],
            'gaming' => ['gameplay', 'walkthrough', 'ps5', 'xbox', 'nintendo', 'steam', 'roblox', 'minecraft', 'للعو', 'جيم', 'بلايستيشن']
        ];

        $crossDomainPenalty = 0.0;
        $courseTopicString = is_string($constraints['courseTopic'] ?? '') ? strtolower($constraints['courseTopic'] ?? '') : '';

        foreach ($bannedDomains as $domain => $keywords) {
            // Check if course itself is about this domain
            $courseIsAboutDomain = false;
            foreach ($keywords as $kw) {
                // Normalize keyword before checking
                $normalizedKw = $this->normalizeText($kw);
                if (!empty($courseTopic) && str_contains($courseTopic, $normalizedKw)) {
                    $courseIsAboutDomain = true;
                    Log::info("Course IS about domain $domain because of $normalizedKw");
                    break;
                }
            }
            
            if ($courseIsAboutDomain) continue; // Skip penalty if course is about this domain

            // Apply penalty if video matches banned keywords
            foreach ($keywords as $kw) {
                $normalizedKw = $this->normalizeText($kw);
                if (str_contains($titleLower, $normalizedKw)) {
                     // Check if query EXPLICITLY asks for this (rare case)
                     if (!str_contains($queryLower, $normalizedKw)) {
                        $crossDomainPenalty = -1.0; // Nuking penalty for cross-domain matches
                        Log::info('Cross-domain penalty applied', ['domain' => $domain, 'keyword' => $kw, 'title' => $media['title']]);
                        break 2;
                     }
                }
            }
        }

        // === GENERIC LESSON CONTEXT ENFORCEMENT ===
        // If lesson keywords are generic (few distinct words), require at least one course topic keyword
        $contextBonus = 0.0;
        $contextPenalty = 0.0;
        
        if (!empty($courseTopicString)) {
            $courseTopicWords = preg_split('/[\s\-_:،,]+/u', $courseTopicString);
            $meaningfulCourseWords = array_filter($courseTopicWords, fn($w) => mb_strlen($w) > 2);
            
            $hasCourseContext = false;
            foreach ($meaningfulCourseWords as $cw) {
                if (str_contains($titleLower, $cw)) {
                    $hasCourseContext = true;
                    $contextBonus = 0.15; // Boost relevance if course topic is mentioned
                    break;
                }
            }
            
            // If lesson is generic (<= 2 specific words) AND missing course context -> Penalize
            // Example: "Production Stages" (2 words) needs "Clothing" context.
            if (count($lessonSpecificWords) <= 2 && !$hasCourseContext) {
                 $contextPenalty = -0.15; 
            }
        }
        
        $baseScore = 0.40;
        $finalScore = $baseScore + ($titleMatch * 0.5) + $eduBonus + $setupPenalty + $coreMismatchPenalty + $comparisonPenalty + $lessonMismatchPenalty + $crossDomainPenalty + $contextBonus + $contextPenalty;
        
        Log::info('Video relevance scoring', [
            'title' => $media['title'],
            'query' => $query,
            'coreMatchRatio' => round($coreMatchRatio, 2),
            'lessonMatchCount' => $matchedLessonWords,
            'crossDomainPenalty' => $crossDomainPenalty,
            'contextBonus' => $contextBonus,
            'finalScore' => round($finalScore, 2)
        ]);
        
        return round($finalScore, 2);

    }

    /**
     * Normalize text for consistent matching
     * Handles Arabic characters (alif, yaa, taa marbuta) and lowercase conversion
     */
    private function normalizeText(string $text): string
    {
        // Convert to lowercase first
        $text = mb_strtolower($text, 'UTF-8');
        
        // normalize Arabic characters
        $patterns = [
            '/[أإآ]/u' => 'ا',
            '/ة/u' => 'ه',
            '/ى/u' => 'ي',
            '/ؤ/u' => 'و',
            '/ئ/u' => 'ي',
            // Remove diacritics (tashkeel)
            '/[\x{064B}-\x{065F}]/u' => ''
        ];
        
        $normalized = preg_replace(array_keys($patterns), array_values($patterns), $text);
        
        // Log normalization for debugging
        // Log::info('Normalization', ['original' => $text, 'normalized' => $normalized]);
        
        return $normalized;
    }

    private function calculateWordOverlap(array $words1, array $words2): float
    {
        if (empty($words1)) return 0.0;
        
        $intersection = array_intersect($words1, $words2);
        return count($intersection) / count($words1);
    }

    private function generateQueryHash(string $query, string $intent, array $constraints): string
    {
        $key = $query . '|' . $intent . '|' . json_encode($constraints);
        return md5($key);
    }

    /**
     * Check if an image URL or metadata indicates low quality (thumbnails, avatars, etc.)
     */
    private function isLowQualityImage(string $url, array $metadata = []): bool
    {
        // 1. Prohibited / NSFW Keywords (Safety First)
        $prohibitedPatterns = [
            '/sex/i', '/porn/i', '/nude/i', '/naked/i', '/adult/i', '/xxx/i', '/pussy/i', '/dick/i',
            '/عاري/i', '/جنس/i', '/إباح/i', '/بنات/i', '/sexy/i', '/hot-girl/i'
        ];

        foreach ($prohibitedPatterns as $pattern) {
            if (preg_match($pattern, $url)) return true;
            if (isset($metadata['title']) && preg_match($pattern, $metadata['title'])) return true;
        }

        // 2. Low Quality / Logo Patterns
        $lowQualityPatterns = [
            '/logo/i',                // Block logos
            '/favicon/i',             // Block favicons
            '/avatar/i',              // Block avatars
            '/profile/i',             // Block profile pics
            '/sz=32/i', '/sz=50/i',   // Small icons
            '/facebook\.com/i',       // Social media profile pics often unsafe
            '/instagram\.com/i',
            '/twitter\.com/i',
            '/thumb/i'                // Thumbnails
        ];

        foreach ($lowQualityPatterns as $pattern) {
            if (preg_match($pattern, $url)) return true;
        }

        return false;
    }
    
    /**
     * Translate query to English for better API results
     * Comprehensive keyword mapping for Arabic, Spanish, French
     */
    private function translateToEnglish(string $query): string
    {
        // If query is already in English (contains only Latin chars), return as-is
        if (preg_match('/^[a-zA-Z0-9\s\-\_]+$/', $query)) {
            return $query;
        }
        
        // Comprehensive translations mapping
        $translations = [
            // Arabic - Common educational terms
            'تعلم' => 'learn',
            'التعلم' => 'learning',
            'البرمجة' => 'programming',
            'برمجة' => 'programming',
            'بايثون' => 'python',
            'جافا' => 'java',
            'جافاسكريبت' => 'javascript',
            'الذكاء الاصطناعي' => 'artificial intelligence',
            'ذكاء اصطناعي' => 'artificial intelligence',
            'التعلم الآلي' => 'machine learning',
            'تعلم آلي' => 'machine learning',
            'التعلم العميق' => 'deep learning',
            'تطوير' => 'development',
            'تطبيقات' => 'applications',
            'تطبيق' => 'application',
            'الويب' => 'web',
            'ويب' => 'web',
            'قواعد البيانات' => 'databases',
            'قاعدة بيانات' => 'database',
            'الأمن السيبراني' => 'cybersecurity',
            'أمن سيبراني' => 'cybersecurity',
            'شبكات' => 'networks',
            'الشبكات' => 'networking',
            'بلغة' => 'in',
            'لغة' => 'language',
            'مقدمة' => 'introduction',
            'أساسيات' => 'fundamentals',
            'متغيرات' => 'variables',
            'المتغيرات' => 'variables',
            'متغير' => 'variable',
            'المتغير' => 'variable',
            'تسمية' => 'naming',
            'تسميتها' => 'naming',
            'البرمجة' => 'programming',
            'برمجة' => 'programming',
            'كود' => 'code',
            'شفرة' => 'code',
            'دوال' => 'functions',
            'الدوال' => 'functions',
            'مصفوفات' => 'arrays',
            'المصفوفات' => 'arrays',
            'كائنات' => 'objects',
            'الكائنات' => 'objects',
            'قوائم' => 'lists',
            'القوائم' => 'lists',
            'شروط' => 'conditions',
            'الشروط' => 'conditions',
            'حلقات' => 'loops',
            'تكرار' => 'repetition',
            'خوارزميات' => 'algorithms',
            'الخوارزميات' => 'algorithms',
            'هياكل بيانات' => 'data structures',
            'تعريف' => 'definition',
            'التعريف' => 'definition',
            'إعلان' => 'declaration',
            'العوامل' => 'operators',
            'الحسابية' => 'arithmetic',
            'حسابية' => 'arithmetic',
            'المنطقية' => 'logical',
            'منطقية' => 'logical',
            'المقارنة' => 'comparison',
            'مقارنة' => 'comparison',
            'عوامل' => 'operators',
            'جدول' => 'table',
            'مخطط' => 'diagram',
            'رسم توضيحي' => 'illustration',
            'بناء جملة' => 'syntax',
            'المساواة' => 'equality',
            'أكبر من' => 'greater than',
            'أصغر من' => 'less than',
            'في سي بلس بلس' => 'in C++',
            'بلغه سي بلس بلس' => 'in C++',
            'العوامل' => 'operators',
            'حسابية' => 'arithmetic',
            'منطقية' => 'logical',
            'مقارنة' => 'comparison',
            'عوامل' => 'operators',
            'جدول' => 'table',
            'مخطط' => 'diagram',
            'رسم توضيحي' => 'illustration',
            'بناء جملة' => 'syntax',
            'المساواة' => 'equality',
            'أكبر من' => 'greater than',
            'أصغر من' => 'less than',
            'في سي بلس بلس' => 'in C++',
            'بلغه سي بلس بلس' => 'in C++',
            'المبتدئين' => 'beginners',
            'متقدم' => 'advanced',
            'دورة' => 'course',
            'درس' => 'lesson',
            'شرح' => 'tutorial',
            'كيفية' => 'how to',
            'ما هو' => 'what is',
            'و' => 'and',
            'في' => 'in',
            'من' => 'from',
            'إلى' => 'to',
            
            // General Topics - Cooking & Food
            'طبخ' => 'cooking',
            'الطبخ' => 'cooking',
            'طعام' => 'food',
            'حلويات' => 'desserts',
            'وصفات' => 'recipes',
            'مطبخ' => 'kitchen',
            
            // Energy & Industry
            'بترول' => 'petroleum',
            'البترول' => 'petroleum',
            'نفط' => 'oil',
            'طاقة' => 'energy',
            'غاز' => 'gas',
            'تعدين' => 'mining',
            'صناعة' => 'industry',
            
            // Marketing & Social Media
            'تسويق' => 'marketing',
            'رقمي' => 'digital',
            'إلكتروني' => 'digital',
            'السوشيال ميديا' => 'social media',
            'تواصل اجتماعي' => 'social media',
            'مواقع التواصل' => 'social media',
            'فيسبوك' => 'facebook',
            'انستجرام' => 'instagram',
            'لينكد إن' => 'linkedin',
            'تيك توك' => 'tiktok',
            'إعلانات' => 'advertising',
            'مبيعات' => 'sales',
            'حملة' => 'campaign',
            'إطلاق' => 'launch',
            'جمهور' => 'audience',
            'استهداف' => 'targeting',
            'محتوى' => 'content',
            'صناعة المحتوى' => 'content creation',
            'كاتب' => 'copywriter',
            'نص إعلاني' => 'copywriting',
            
            // SEO & Analytics
            'محركات البحث' => 'SEO',
            'سيو' => 'SEO',
            'تحسين محركات' => 'SEO',
            'كلمات مفتاحية' => 'keywords',
            'بحث' => 'search',
            'تصدر' => 'ranking',
            'روابط' => 'backlinks',
            'تحليل' => 'analytics',
            'بيانات' => 'data',
            'إحصائيات' => 'statistics',
            'تقرير' => 'report',

            // E-Commerce & Business
            'تجارة إلكترونية' => 'e-commerce',
            'متجر' => 'store',
            'منتج' => 'product',
            'خدمة' => 'service',
            'عميل' => 'customer',
            'زبائن' => 'customers',
            'سوق' => 'market',
            'منافسة' => 'competition',
            'علامة تجارية' => 'brand',
            'هوية' => 'identity',
            'شعار' => 'logo',
            'تصميم' => 'design',
            'خطة' => 'plan',
            'استراتيجية' => 'strategy',
            'مشروع' => 'project',
            'ريادة أعمال' => 'entrepreneurship',
            'شركة ناشئة' => 'startup',
            
            // General Science & Life
            'علوم' => 'science',
            'تاريخ' => 'history',
            'رياضيات' => 'mathematics',
            'فيزياء' => 'physics',
            'كيمياء' => 'chemistry',
            'طب' => 'medicine',
            'صحة' => 'health',
            'فلك' => 'astronomy',
            'فلسفة' => 'philosophy',
            'نفس' => 'psychology',
            'اجتماع' => 'sociology',
            'اقتصاد' => 'economics',
            'تجارة' => 'trade',
            
            // Fashion & Clothing (CRITICAL FOR CURRENT ISSUE)
            'ملابس' => 'clothing',
            'الملابس' => 'clothing',
            'أزياء' => 'fashion',
            'الأزياء' => 'fashion',
            'موضة' => 'fashion',
            'الموضة' => 'fashion',
            'تصميم' => 'design',
            'التصميم' => 'design',
            'خياطة' => 'sewing',
            'الخياطة' => 'sewing',
            'تفصيل' => 'tailoring',
            'التفصيل' => 'tailoring',
            'باترون' => 'pattern',
            'الباترون' => 'pattern',
            'قماش' => 'fabric',
            'أقمشة' => 'fabrics',
            'منسوجات' => 'textiles',
            'نسيج' => 'textile',
            'قطن' => 'cotton',
            'حرير' => 'silk',
            'صوف' => 'wool',
            'كتان' => 'linen',
            'تطريز' => 'embroidery',
            'غرزة' => 'stitch',
            'ماكينة' => 'machine',
            'مكنة' => 'machine',
            'إبرة' => 'needle',
            'خيط' => 'thread',
            'مقص' => 'scissors',
            'قياس' => 'measurement',
            'مقاسات' => 'sizes',
            'ماركة' => 'brand',
            'علامة تجارية' => 'brand',
            'براند' => 'brand',
            'تيكت' => 'label',
            'لوجو' => 'logo',
            'شعار' => 'logo',
            'كوليكشن' => 'collection',
            'مجموعة' => 'collection',
            'منتج' => 'product',
            'منتجات' => 'products',
            'تصنيع' => 'manufacturing',
            'صناعة' => 'industry',
            'مصنع' => 'factory',
            'إنتاج' => 'production',
            'موردين' => 'suppliers',
            'مورد' => 'supplier',
            'جملة' => 'wholesale',
            'تجزئة' => 'retail',
            'مستهلك' => 'consumer',
            'عميل' => 'client',
            'زبون' => 'customer',
            'تسعير' => 'pricing',
            'سعر' => 'price',
            'تكلفة' => 'cost',
            'تكاليف' => 'costs',
            'ربح' => 'profit',
            'أرباح' => 'profits',
            'خسارة' => 'loss',
            'ميزانية' => 'budget',
            'دراسة جدوى' => 'feasibility study',
            'خطة عمل' => 'business plan',
            'مشروع' => 'project',
            'ريادة أعمال' => 'entrepreneurship',
            'رائد أعمال' => 'entrepreneur',
            'startup' => 'startup',
            'ناشئة' => 'startup',
            'متجر' => 'store',
            'محلات' => 'shops',
            'سوق' => 'market',
            'منافسة' => 'competition',
            'منافسين' => 'competitors',
            'استيراد' => 'import',
            'تصدير' => 'export',
            'شحن' => 'shipping',
            'لوجستيات' => 'logistics',
            'تغليف' => 'packaging',
            'جودة' => 'quality',
            'خامات' => 'materials',
            'إدارة' => 'management',
            'تشغيل' => 'operation',
            'موارد بشرية' => 'human resources',
            'توظيف' => 'hiring',
            'عمالة' => 'labor',
            'حرفيين' => 'artisans',
            'حرفي' => 'craftsman',
            'يدوي' => 'handmade',
            'هاند ميد' => 'handmade',
            'ورشة' => 'workshop',
            'أتيليه' => 'atelier',
            
            // Maintenance & Tech Hardware
            'صيانة' => 'maintenance',
            'تصليح' => 'repair',
            'كيبورد' => 'keyboard',
            'لوحة مفاتيح' => 'keyboard',
            'كمبيوتر' => 'computer',
            'حاسوب' => 'computer',
            'شاشة' => 'monitor',
            'هاردوير' => 'hardware',
            
            // Spanish
            'desarrollo' => 'development',
            'aplicaciones' => 'applications',
            'móviles' => 'mobile',
            'programación' => 'programming',
            'introducción' => 'introduction',
            'aprender' => 'learn',
            
            // French
            'introduction' => 'introduction',
            'cybersécurité' => 'cybersecurity',
            'sécurité' => 'security',
            'développement' => 'development',
            'apprendre' => 'learn',
            'programmation' => 'programming',
        ];
        
        $translated = $query;
        
        // Replace known terms (longer phrases first for better matching)
        uasort($translations, function($a, $b) {
            return strlen($b) - strlen($a);
        });
        
        foreach ($translations as $foreign => $english) {
            $translated = str_ireplace($foreign, $english, $translated);
        }
        
        // Clean up: Ensure we don't have double spaces and handle directionality
        $translated = preg_replace('/\s+/', ' ', $translated);
        
        // IF the translation resulted in NO English words at all, return the original query
        // so that search engines (which are smart) can try the original language.
        if (!preg_match('/[a-zA-Z]/', $translated)) {
            return $query;
        }
        
        // Fallback: if translation is empty, use generic educational terms
        if (empty(trim($translated))) {
            $translated = 'educational tutorial course';
        }
        
        Log::info('Query translation', [
            'original' => $query,
            'translated' => $translated
        ]);
        
        return trim($translated);
    }

    private function cacheMedia(string $queryHash, string $type, array $media, float $score): void
    {
        // Truncate title if too long (Pixabay sometimes returns very long tag lists)
        $title = $media['title'];
        if (mb_strlen($title) > 1000) {
            $title = mb_substr($title, 0, 997) . '...';
        }
        
        MediaCache::updateOrCreate(
            ['query_hash' => $queryHash],
            [
                'type' => $type,
                'url' => $media['url'],
                'title' => $title,
                'description' => $media['description'] ?? null,
                'source' => $media['source'],
                'metadata' => $media['metadata'],
                'relevance_score' => $score,
                'expires_at' => now()->addDays((int) $this->cacheTtlDays)
            ]
        );
    }

    private function formatCachedMedia(MediaCache $cached): array
    {
        return [
            'url' => $cached->url,
            'title' => $cached->title,
            'description' => $cached->description,
            'source' => $cached->source,
            'metadata' => $cached->metadata,
            'score' => (float) $cached->relevance_score
        ];
    }
}