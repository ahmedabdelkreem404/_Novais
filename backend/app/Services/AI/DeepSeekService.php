<?php

namespace App\Services\AI;

use App\Interfaces\AIProviderInterface;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class DeepSeekService implements AIProviderInterface
{
    protected $apiKey;
    protected $apiUrl;
    protected $model;
    protected $lastUsage = [];

    public function __construct()
    {
        $this->apiKey = config('services.deepseek.api_key');
        $this->model = config('services.deepseek.model', 'deepseek-v4-flash');
        $this->apiUrl = 'https://api.deepseek.com/v1/chat/completions';
    }

    public function getLastUsage(): array
    {
        return $this->lastUsage;
    }

    public function generateContent(string $prompt, array $context = []): string
    {
        return $this->chat($prompt, $context);
    }

    public function chat(string $message, array $context = []): string
    {
        // Use chatRequest but return string
        $response = $this->chatRequest($message, false);
        return is_string($response) ? $response : json_encode($response);
    }



    public function generateCourseOutline(
        string $topic,
        int $count,
        string $type,
        string $language,
        string $level = 'Beginner',
        mixed $blueprint = null,
        array $blueprintFields = []
    ): array {
        if ($blueprint) {
            return $this->generateBlueprintStructure($topic, $language, $count, $level, $blueprint, $blueprintFields);
        }
        return $this->generateCourseStructure($topic, $type, $language, $count, $level);
    }

    private function generateBlueprintStructure(
        string $topic,
        string $language,
        int $count,
        string $level,
        mixed $blueprint,
        array $blueprintFields
    ): array {
        $base = $this->getBasePrompt($language);
        
        $blueprintSlug = $blueprint->slug;
        $blueprintName = is_array($blueprint->name) ? ($blueprint->name['en'] ?? $blueprintSlug) : $blueprint->name;
        $requiredSections = $blueprint->required_sections ?? [];
        $optionalSections = $blueprint->optional_sections ?? [];
        $citationRequired = !empty($blueprint->citation_rules['required']);
        $includeQuiz = !empty($blueprint->assessment_rules['include_quiz']);
        $instructions = $blueprint->prompt_instructions ?? '';
        
        // Build fields string
        $fieldsStr = "";
        foreach ($blueprintFields as $key => $value) {
            if (is_array($value)) {
                $valStr = implode(', ', $value);
            } elseif (is_bool($value)) {
                $valStr = $value ? 'Yes' : 'No';
            } else {
                $valStr = (string) $value;
            }
            $fieldsStr .= "- **{$key}**: {$valStr}\n";
        }

        $requiredSectionsStr = implode(', ', $requiredSections);
        $optionalSectionsStr = implode(', ', $optionalSections);
        $citationText = $citationRequired ? 'strictly required' : 'optional';
        $quizText = $includeQuiz ? 'required' : 'optional';
        $productTerms = $this->blueprintTerminology($blueprintSlug);
        $specializedRules = $this->blueprintSpecializedRules($blueprintSlug);

        $prompt = <<<BLUEPRINT_PROMPT
────────────────────────────
MODE: NOVAIS CONTENT GENERATOR (DYNAMIC BLUEPRINT ENGINE)
INPUT:
Topic/Subject: $topic
Content Type (Blueprint): $blueprintName ($blueprintSlug)
Academic Level: $level
Language: $language
Requested Chapters/Sections Count: $count

SUBMITTED PARAMETERS & PREFERENCES:
$fieldsStr

BLUEPRINT INSTRUCTIONS:
$instructions

PRODUCT-SPECIFIC TERMINOLOGY:
$productTerms

SPECIALIZED RULES:
$specializedRules

OUTLINING CONSTRAINTS:
1. Generate a structured outline tailored EXACTLY for the content type "$blueprintName". Do not generate a generic learning course if the type is a Book, Exam, or Research Paper.
2. Structure the output into EXACTLY $count product-appropriate chapters/sections/items (represented in the JSON output under the "chapters" key for NOVAIS compatibility).
3. The content of each chapter/section must follow these required components: $requiredSectionsStr.
4. Optionally incorporate elements of: $optionalSectionsStr.
5. Language: All titles, descriptions, and structural nodes MUST be written in "$language".
6. Citation Requirements: Academic citations and references are $citationText.
7. Final Assessment: A quiz or review section is $quizText.
8. Auto-inference: If any parameter or preference under "SUBMITTED PARAMETERS" is empty, blank, or unspecified, you must dynamically generate and design those details yourself to fit the topic and educational context.
9. Never use "course", "lessons", "modules", "learning path", or video-course language for books, exams, question banks, theses, graduation project documents, stories, assignments, or lesson plans unless the selected blueprint is actually a course.
10. For academic/research outputs, do not invent verified citations, DOI, URLs, or real statistics. Use clearly labeled reference placeholders or suggested source topics unless verified sources were provided by the user.

OUTPUT JSON (Strictly follow this structure. Do not change key names to maintain compatibility with the NOVAIS engine):
{
  "title": "Clean Title of the $blueprintName (Translated to $language)",
  "description": "Compelling 2-sentence summary/abstract in $language.",
  "level": "$level",
  "language": "$language",
  "total_chapters": $count,
  "chapters": [
    {
      "title": "Title of the Chapter/Section in $language",
      "subtopics": [
        { "title": "Subtopic/Subsection Title in $language" }
      ]
    }
  ]
}
BLUEPRINT_PROMPT;

        return $this->chatRequest($base . $prompt, true, "You are NOVAIS, an intelligent learning coach generating content for a {$blueprintName}.");
    }

    private function blueprintTerminology(string $blueprintSlug): string
    {
        $map = [
            'normal-course' => 'Use modules, lessons, exercises, practical tasks, projects, and checkpoints.',
            'leveled-course' => 'Use levels, modules, lessons, checkpoints, and practical exercises.',
            'interactive-practical-course' => 'Use modules, lessons, exercises, practical tasks, projects, and checkpoints.',
            'academic-course' => 'Use lectures, lecture notes, slide outlines, discussion questions, assignments, and references.',
            'study-review' => 'Use summary sections, key points, expected questions, exam tips, and revision plan.',
            'question-bank' => 'Use questions, answers, explanations, difficulty, question types, and topic grouping.',
            'exam-builder' => 'Use exam sections, questions, marks, model answers, and grading scheme.',
            'book' => 'Use cover, preface, table of contents, chapters, exercises, glossary, references, and image placeholders.',
            'story' => 'Use title, synopsis, characters, chapters/scenes, narrative arcs, and educational message.',
            'graduation-project' => 'Use graduation project document, academic document, project book, cover page, chapters, sections, supervisors, students, faculty, department, university, methodology, results, references, and appendices.',
            'master-thesis' => 'Use abstract, research problem, research questions, hypotheses, literature review, methodology, findings, discussion, recommendations, and references.',
            'lesson-plan' => 'Use lesson objectives, materials, warm-up, explanation, activities, assessment, homework, and teacher notes.',
            'assignment-builder' => 'Use assignment brief, tasks, deliverables, rubric, and answer guide.',
            'project-based-learning' => 'Use project scenario, milestones, tasks, evaluation rubric, and deliverables.',
        ];

        return $map[$blueprintSlug] ?? 'Use terminology that exactly matches the selected content type.';
    }

    private function blueprintSpecializedRules(string $blueprintSlug): string
    {
        if ($blueprintSlug === 'graduation-project') {
            return implode("\n", [
                '- Graduation Project Book must be a complete academic document, not a course.',
                '- Support any faculty or specialization: medicine, pharmacy, nursing, engineering, computer science, business, accounting, law, education, agriculture, media, arts, tourism, psychology, sociology, science, architecture, and others.',
                '- Include cover page data when provided: university, faculty, department, project title, students, supervisors, academic year/date, and logo placeholder if useful.',
                '- Use neutral academic sections for non-software projects: cover page, declaration if suitable, acknowledgements, abstract, table of contents, lists of figures/tables when enabled, introduction, problem statement, objectives, importance, scope, literature review, methodology, practical/applied part, results, discussion, conclusion, recommendations, references, appendices.',
                '- Only include functional/non-functional requirements, database design, UML, software architecture, implementation, testing, deployment, Agile, Waterfall, DevOps, SRS, or system lifecycle if the topic/faculty/department/tools clearly indicate software/IT/system/app/platform OR the user explicitly asks for those sections.',
                '- When image, diagram, or table placeholders are enabled or useful, write specific placeholders such as [IMAGE PLACEHOLDER: Add a photo/illustration showing ...], [DIAGRAM PLACEHOLDER: Add a diagram explaining ...], or [TABLE PLACEHOLDER: Add a table comparing ...].',
            ]);
        }

        if ($blueprintSlug === 'master-thesis') {
            return '- Treat references as placeholders or suggested source topics unless verified sources are supplied. Do not fabricate DOI, URLs, real statistics, or citations.';
        }

        return '- Match the selected product type exactly and avoid generic course wording for non-course blueprints.';
    }

    public function validateTopicSafety(string $topic): bool
    {
        // 1. Pre-Check: Banned Keywords (Fail Fast)
        $bannedKeywords = [
            'porn', 'sex', 'xxx', 'nude', 'erotic', 'hentai', 'sexual', 'fetish', 'incest', 'naked', 
            'pussy', 'dick', 'cock', 'boobs', 'vagina', 'hitler', 'nazi', 'suicide', 'bomb', 'terrorist',
            'sexo', 'puta', 'mierda', 'ibahi', 'nik' // Multilingual basics
        ];

        // Normalize topic for checking
        $normalizedTopic = strtolower(trim($topic));

        // Strict exact match or start check for short sensitive words
        foreach ($bannedKeywords as $keyword) {
            // Check for exact match or word boundary match to avoid false positives (e.g., 'sussex')
            if (preg_match("/\b" . preg_quote($keyword, '/') . "\b/i", $normalizedTopic)) {
                
                // If the user typed ONLY "sex" or "porn", block immediately.
                if ($normalizedTopic === $keyword || strlen($normalizedTopic) < strlen($keyword) + 5) {
                     return false;
                }
            }
        }

        // 2. AI Moderation (Contextual)
        $prompt = <<<PROMPT
You are a Content Safety Moderator for an Educational Platform.
Analyze the topic: "$topic"

YOUR TASK:
Determine if this topic is SAFE or UNSAFE for a general audience course.

🚨 RULES:
1. 🟢 SAFE TOPICS (ALLOW):
   - Technology (AI, Coding, Hacking for Security, etc.)
   - Science (Biology, Anatomy, Reproduction - if academic)
   - Business, Marketing, History, Arts, Health.
   - General topics (e.g., "Love", "Dating" - if social/psychological context).

2. 🔴 UNSAFE TOPICS (BLOCK):
   - Explicit Pornography / Erotica / Hentai.
   - Hate Speech / Nazism / Terrorist Recruitment.
   - Promoting specific illegal acts (e.g. "How to sell drugs").

3. ⚖️ JUDGMENT:
   - "Artificial Intelligence" -> SAFE
   - "Sexual Education" -> SAFE (Academic)
   - "Sex Positions" -> UNSAFE (Explicit)
   - "How to make a bomb" -> UNSAFE
   - "History of WWII" -> SAFE

OUTPUT:
Return ONLY the word "SAFE" or "UNSAFE".
PROMPT;

        try {
            // Use low temperature for deterministic output
            $response = $this->chatRequest($prompt, false, 'You are a helpful safety moderator.', 0.0);
            $cleanResponse = trim(strtoupper(strip_tags($response)));
            
            // Allow if it STARTS with SAFE (handles "SAFE." or "SAFE (Educational)")
            if (str_starts_with($cleanResponse, 'SAFE')) {
                return true;
            }

            Log::warning("Content Safety Reject: '$topic' -> AI Response: $cleanResponse");
            return false;

        } catch (\Exception $e) {
            // If AI fails, we default to blocking for safety? Or failing open?
            // Given the user is angry about safety, we should FAIL CLOSED (Block) if moderation fails?
            // "Secure by default".
            Log::error('Content Safety Check Error', ['error' => $e->getMessage()]);
            // For now, let's return false (unsafe) if the check crashes, to be super safe.
            return false; 
        }
    }


    private function getLanguageInstruction(string $language): string
    {
        if (strtolower($language) === 'egyptian arabic') {
            return "Egyptian Arabic Colloquial dialect (العامية المصرية). You MUST write all explanations, instructions, examples, and texts in standard Egyptian colloquial dialect (using words like 'عشان', 'إزاي', 'هيعمل', 'ليه', 'شوية') rather than Modern Standard Arabic, while keeping it clear, educational, and high quality.";
        }
        if (strtolower($language) === 'arabic') {
            return "Modern Standard Arabic (العربية الفصحى). Do NOT use any colloquial dialect.";
        }
        return $language;
    }

    /**
     * The Base Instructions for Professional Bootcamp Mode.
     */
    private function getProfessionalBasePrompt(string $language): string
    {
        $langInstruction = $this->getLanguageInstruction($language);
        return <<<PROMPT
ENTERPRISE ACADEMIC + PROFESSIONAL BOOTCAMP MODE (EXTREME RIGOR POLICY)
You are a Senior Academic Professor and Technical Lead. You are not generating casual content.
You are designing a university-level academic curriculum combined with professional bootcamp-grade applied training.

🔴 RULE 1: TEACHING STYLE (DEEP ACADEMIC RIGOR)
- Tone: Strictly Formal, Academic, and Direct. No emojis, no motivational filler.
- Depth: Explain concepts deeply and fundamentally. Do not summarize quickly.
- How & Why: Explicitly explain the underlying mechanisms (the "how") and the architectural rationale (the "why").
- Terminology: Define all technical terminology clearly and precisely.
- Structure: Use structured sections with logical, building-block flow.

🔴 RULE 2: LANGUAGE & TONE
- PRIMARY EXPLANATION TEXT: Formal, technically accurate English (or the requested language: $langInstruction).
- TECHNICAL TERMINOLOGY: Use precise, standard industry terms.
- VOICE: Deliver content as a serious university lecture or professional lead developer briefing.
PROMPT;
    }

    /**
     * The Base Instructions for NOVAIS.
     */
    private function getBasePrompt(string $language): string
    {
        $langInstruction = $this->getLanguageInstruction($language);
        return <<<PROMPT
🎯 INSTRUCTIONAL FRAMEWORK — NOVAIS: Interactive Learning Engine
You are NOVAIS, an advanced AI Learning Coach and Interactive Experience Designer.
Your goal is to generate practical, engaging courses based on experience.

🔴 RULES:
1. Identity:
   - You are NOVAIS.
   - You are a "Learning Coach", NOT a "Professor" or "Teacher".
2. Language & Tone:
   - Write in EXACTLY this language: $langInstruction.
   - Tone: Enthusiastic, clear, and action-oriented.
3. Content Integrity:
   - Focus on "Learning by Doing".
   - Explain CONCEPTS through analogies and real-world applications.
   - Return purely VALID JSON.
PROMPT;
    }

    public function generateCourseStructure(string $topic, string $courseType, string $language, int $chapters, string $level = 'Beginner'): array
    {
        if (strtolower($level) === 'professional') {
            return $this->generateProfessionalStructure($topic, $courseType, $language, $chapters);
        }

        $base = $this->getBasePrompt($language);
        $modePrompt = <<<MODE1

────────────────────────────
MODE 1: NOVAIS COURSE STRUCTURE
INPUT:
Topic: $topic
Type: $courseType
Level: $level
Language: $language
Chapters: $chapters

TASK:
Generate an interactive course outline tailored for a "$level" audience.

RULES:
- Create EXACTLY $chapters chapters.
- Each chapter must have practical, action-oriented subtopics (Lessons).
- Content difficulty must match: $level.
- NO content. NO media. NO quizzes.
- Titles must be engaging and motivating.
- CRITICAL: All titles, descriptions, and subtopics MUST represent the content in "$language".

OUTPUT JSON:
{
  "title": "Engaging Course Title (Translated to $language)",
  "description": "Compelling 2-sentence course description in $language.",
  "level": "$level",
  "language": "$language",
  "total_chapters": $chapters,
  "chapters": [
    {
      "title": "Chapter Title in $language",
      "subtopics": [
        { "title": "Lesson Title in $language" }
      ]
    }
  ]
}
MODE1;

        return $this->chatRequest($base . $modePrompt, true, 'You are NOVAIS, a friendly and energetic learning coach.');
    }

    private function generateProfessionalStructure(string $topic, string $courseType, string $language, int $chapters): array
    {
        $base = $this->getProfessionalBasePrompt($language);
        $modePrompt = <<<MODE
────────────────────────────
STAGE 1 — FORMAL ROADMAP DESIGN
INPUT:
Topic: $topic
Type: $courseType
Level: Professional
Language: $language
Chapters: $chapters

Generate a structured academic roadmap including:
- Target learner profile (formal description)
- Entry prerequisites (technical and cognitive)
- Final measurable competency outcome
- 5–8 SMART learning objectives with hierarchical cognitive mapping.
- Deep theoretical foundations required for the topic.
- Multi-dimensional skill progression map.
- Logical "How & Why" dependencies between modules.

STAGE 2 — CURRICULUM ARCHITECTURE
Design chapters that:
- Follow a strict university lecture progression.
- Break down complex mechanisms into "First Principles" lessons.
- Avoid generic titles; use precise technical nomenclature.
- Create EXACTLY $chapters chapters.
- CRITICAL: All titles, descriptions, and content MUST be written in "$language".

Each chapter must include:
Chapter title (in $language), Objective(s), Difficulty level progression, 4–6 lessons.

Each lesson must include:
- Technical title (in $language)
- Instructional purpose (in $language)
- Skill built (in $language)
- Dependency reference (in $language)

OUTPUT JSON:
{
  "roadmap": {
    "learner_profile": "Description in $language...",
    "prerequisites": ["List in $language..."],
    "final_competency": "Description in $language...",
    "learning_objectives": [
      { "id": "LO1", "description": "Objective in $language...", "bloom_level": "...", "assessment": "..." }
    ],
    "skill_map": {},
    "total_hours": 0
  },
  "title": "Course Title in $language",
  "description": "Formal academic description in $language.",
  "level": "Professional",
  "language": "$language",
  "total_chapters": $chapters,
  "chapters": [
    {
      "title": "Technical Chapter Title in $language",
      "objectives_supported": ["LO1"],
      "difficulty_progression": "...",
      "subtopics": [
        { 
          "title": "Technical Lesson Title in $language",
          "instructional_purpose": "...",
          "skill_built": "...",
          "dependency": "..."
        }
      ]
    }
  ]
}
MODE;

        return $this->chatRequest($base . $modePrompt, true, 'You are a Senior Academic Professor and Technical Lead. You follow a STRICT TECHNICAL POLICY: No emojis, English code, Arabic comments, formal English explanations.', 0.1);
    }

    public function generateLessonContent(string $courseTopic, string $subTopic, string $language, string $courseType = 'Text', string $level = 'Beginner'): array
    {
        if (strtolower($level) === 'professional') {
            return $this->generateProfessionalLesson($courseTopic, $subTopic, $language, $courseType);
        }

        $base = $this->getBasePrompt($language);
        
        $mediaInstruction = "Media Selection Quality Gate (INSTRUCTIONAL STANDARD):
        
        🎯 FOR IMAGE QUERIES:
           - Goal: Visuals that EXPLAIN concepts, not just decoration.
           - Tech Topics: For programming/CS, the query MUST be in English even if the lesson is in Arabic.
           - REQUIRED Keywords Pattern: [Topic] + [Specific Mechanism/Process] + [Visual Type]
           - Visual Types: 'detailed architecture diagram', 'memory layout flowchart', 'syntax pattern schematic', 'how it works logic diagram'.
           - ❌ BANNED Words: 'aesthetic', 'wallpaper', 'cool', 'background', 'slide', 'generic'.
           - ✅ GOOD Examples:
             * 'C programming for loop star pattern logic flowchart'
             * 'Python dictionary hashing memory behavior diagram'
             * 'TCP/IP three-way handshake sequence diagram'
        
        🎯 FOR VIDEO QUERIES:
           - Language Match: If course is $language, video MUST be in $language.
           - Duration: MUST be >4 minutes (Tutorials, not shorts).
           - QUERY: Precise educational search terms in $language like 'شرح خطوة بخطوة' or 'how to lesson'.
        
        🚨 ABSOLUTE RULE: Focus on INSTRUCTIONAL value. Generate query for a visual that helps a student understand the 'WHY' or 'HOW'.";

        $prompt = $base . <<<PROMPT

────────────────────────────
MODE 2: COMPLETE LESSON GENERATION (NOVAIS EXPERIENCE)

INPUT:
Course: $courseTopic
Lesson: $subTopic
Type: $courseType
Language: $language

TASK:
Generate a production-ready, interactive lesson.

- SECTION 1: CONTENT
- Write a full, engaging lesson in Markdown. 
- The content MUST be written in "$language".
- Focus on EXPERIENCE and APPLICATION.
- Use analogies and storytelling.
- Include "Try It Yourself" or "Action Item" sections.
- ALL technical code, keywords, and symbols MUST be in English.

- SECTION 2: MEDIA QUERIES
- $mediaInstruction
- You MUST generate SPECIFIC queries based on the exact lesson topic.

- SECTION 3: QUIZ
- Create 3-5 scenario-based multiple-choice questions in "$language".
- Focus on APPLIED KNOWLEDGE, not definition recall.
- Exactly 4 options per question. 1 correct answer.

OUTPUT JSON (EXACT STRUCTURE REQUIRED):
{
  "title": "$subTopic (in $language)",
  "content": "Full markdown lesson here in $language...",
  "examples": "Practical real-world scenarios in $language...",
  "media_queries": {
    "images": [ 
      { 
        "query": "SPECIFIC query for visual aid", 
        "intent": "concept_visualization", 
        "constraints": { "orientation": "landscape", "style": "realistic" } 
      } 
    ],
    "videos": [ 
      { 
        "query": "SPECIFIC $language query for tutorial", 
        "intent": "step_by_step_explanation", 
        "constraints": { "duration": "long", "language": "$language" } 
      } 
    ]
  },
  "quiz": [
    {
      "question": "Scenario-based question text?",
      "options": ["...", "...", "...", "..."],
      "correct_answer": "..."
    }
  ]
}

CRITICAL: Return ONLY valid JSON.
PROMPT;

        return $this->chatRequest($prompt, true, 'You are NOVAIS, a friendly and energetic learning coach.');
    }

    private function generateProfessionalLesson(string $courseTopic, string $subTopic, string $language, string $courseType): array
    {
        $base = $this->getProfessionalBasePrompt($language);
        $prompt = $base . <<<PROMPT
────────────────────────────
STAGE 3 — RIGOROUS LESSON AUTHORING & STEP-BY-STEP LOGIC

INPUT:
Course: $courseTopic
Lesson: $subTopic

🔴 RULE 3: THEORETICAL DEPTH (MANDATORY)
- Do not provide surface-level summaries.
- Explain the "First Principles" of the topic.
- Break down the logic behind every mechanism.
- Contrast this topic with alternatives/competitors.
- Detail memory behavior or performance implications where applicable.

🔴 RULE 4: 6-STEP PROGRAMMING & CODE EXPLANATION (STRICT):
For EVERY code example presented, you MUST follow this sequence:
1. FULL SOURCE CODE:
   - 100% English identifiers and output.
   - Professional formatting (4-space indent).
   - Arabic comments explaining the "why" for each line.
2. PROGRAM PURPOSE: Clear academic statement of what the code achieves.
3. LOGICAL BREAKDOWN: Explain each structural block (classes, functions, namespaces).
4. LINE-BY-LINE ANALYSIS: Explain specific important lines, variable roles, and data mutations.
5. EXECUTION WALKTHROUGH: Step-by-step trace of the control flow with specific input/output examples.
6. COMMON PITFALLS: Mention semantic errors, performance traps, or architectural mistakes students often make.

🔴 RULE 5: LESSON STRUCTURE:
- Title: Technical and Precise (in $language).
- Summary: Academic position summary (in $language).
- Deep Theory: Minimum 400 words of background/mechanism analysis (in $language).
- Implementation: Cumulative code examples with the 6-step breakdown for EACH.
- Expected Output: Show the exact result of the code.
- Practice Task: A challenging "Student Lab" assignment at the end (in $language).

🔴 RULE 6: TECHNICAL VISUALS:
- Image queries MUST be in English.
- Use highly specific technical terms: "logic flowchart", "memory layout", "data flow diagram".
- Example for Star Pattern: "C programming nested for loop star pattern logic flowchart step by step".

OUTPUT JSON:
{
  "title": "$subTopic (in $language)",
  "content": "Full EXTREME RIGOR academic markdown lesson in $language (Formal $language, English code comments, 6-step breakdown, Practice Task)...",
  "media_queries": {
    "images": [ { "query": "Technical architectural diagram query" } ],
    "videos": [ { "query": "High-quality technical tutorial query" } ]
  },
  "quiz": [
    {
      "question": "Advanced analytical/scenario question in $language",
      "options": ["...", "...", "...", "..."],
      "correct_answer": "..."
    }
  ]
}
PROMPT;

        return $this->chatRequest($prompt, true, 'You are a Senior Academic Professor and Technical Lead. You follow a STRICT TECHNICAL POLICY: No emojis, English code, Arabic comments, formal English explanations.', 0.1);
    }

    public function findEducationalVideo(string $topic): string
    {
        $prompt = "Find ONE excellent educational YouTube video for: '$topic'.
        Rules:
        1. Search for a specific, high-quality tutorial.
        2. Prefer 'Blackboard', 'Crash Course', or 'Step-by-step' styles.
        3. Return ONLY the YouTube URL (e.g., https://www.youtube.com/watch?v=VIDEO_ID).
        4. NO other text. NO markdown.
        5. If unable to find, return empty string.";

        // Use standard chat request but expect a single URL string
        $response = $this->chatRequest($prompt, false, 'You are a helpful educational assistant.');
        return trim(strip_tags($response));
    }

    public function translateTitle(string $title): string
    {
        $prompt = "Translate this course title to formal English for NOVAIS system. 
                   Rule: Return ONLY the translated title text. No quotes.
                   Title: " . $title;
        return $this->chatRequest($prompt, false, 'You are a professional translator.');
    }

    // ... (GenerateQuiz function remains mostly same logic, just ensure tone)

    public function generateQuiz(string $topic, int $count, string $language, string $context = '', string $level = 'Beginner'): array
    {
        $prompt = "Generate a FINAL COMPREHENSIVE ASSESSMENT for the course '$topic' using NOVAIS standards.
        Course Context: $context
        Difficulty: $level
        Language: $language.

        Instructions:
        1. Difficulty: Match '$level'.
        2. Scenario-Based: Questions should test ability to apply knowledge.
        3. Options: Exactly 4 unique options (A, B, C, D).
        4. Distractors: Plausible and educational.
        5. Tone: Professional but encouraging.
        6. CRITICAL CODE FORMATTING: Wrap code in backticks ` `.
        7. Return ONLY valid JSON.

        JSON Structure:
        {
            \"questions\": [
                {
                    \"question\": \"Question text here\",
                    \"options\": [\"Option 1\", \"Option 2\", \"Option 3\", \"Option 4\"],
                    \"correct_answer\": \"The exact text of the correct option\"
                }
            ]
        }";

        // Detect level if possible, else default to Beginner
        $levelStr = $level ?? 'Beginner';
        $systemPrompt = (strtolower($levelStr) === 'professional') 
            ? 'You are a Senior Academic Professor. Follow the STRICT TECHNICAL POLICY.' 
            : 'You are NOVAIS, a friendly learning coach.';
        $temp = (strtolower($levelStr) === 'professional') ? 0.1 : 0.8;

        return $this->chatRequest($prompt, true, $systemPrompt, $temp);
    }

    public function getCourseCoverImage(string $topic): ?string
    {
        // ... (Keep existing logic to use MediaResolverService)
        try {
            $mediaResolver = app(\App\Services\MediaResolverService::class);
            $simpleQuery = $this->simplifyTopicForCover($topic);
            $result = $mediaResolver->resolveImages($simpleQuery, 'educational', []);
            
            if ($result && isset($result['url']) && ($result['score'] ?? 0) >= 0.20) {
                return $result['url'];
            }
        } catch (\Exception $e) {
            // Fall through to a safe generated placeholder.
        }

        $fallbackText = trim(str_replace(' creative cover', '', $this->simplifyTopicForCover($topic)));

        return 'https://placehold.co/1200x675/1d4ed8/ffffff.png?text=' . rawurlencode($fallbackText !== '' ? $fallbackText : $topic);
    }
    
    // ... (Keep simplifyTopicForCover)

    private function simplifyTopicForCover(string $topic): string
    {
        // Prioritize programming languages
        $languages = ['Java', 'Python', 'JavaScript', 'C++', 'PHP', 'Ruby', 'Swift', 'Kotlin', 'Go', 'Rust'];
        foreach ($languages as $lang) {
            if (stripos($topic, $lang) !== false) {
                return $lang . ' programming concept';
            }
        }
        
        // Clean and slightly expand the query for better variety
        $clean = preg_replace('/[^\p{L}\p{N}\s]/u', '', $topic);
        $words = explode(' ', $clean);
        $shortTopic = trim(implode(' ', array_slice(array_filter($words), 0, min(6, count($words)))));

        return ($shortTopic !== '' ? $shortTopic : $topic) . " creative cover";
    }

    public function chatWithContext(string $message, array $history, array $context): string
    {
        // Extract Context
        $courseTitle = $context['current_course']['title'] ?? 'General Education';
        $userRole = $context['user']['role'] ?? 'Learner'; // Student -> Learner
        $userName = $context['user']['name'] ?? 'Learner';
        $language = 'en'; 
        
        if (preg_match('/[\p{Arabic}]/u', $message)) {
            $language = 'ar';
        }

        // Detect Level & Dynamic Persona
        $level = strtolower($context['current_course']['level'] ?? 'beginner');
        $isProfessional = ($level === 'professional');
        
        $personaIdentity = $isProfessional 
            ? 'Senior Academic Professor and Technical Lead' 
            : 'intelligent AI Learning Coach and Interactive Experience Designer';
            
        $personaRules = $isProfessional
            ? "- You follow an EXTREME ACADEMIC RIGOR POLICY.\n- No emojis. No motivational filler. No informalities.\n- Tone: Strictly Formal, Serious, and Analytical.\n- Deep Explanations: Never summarize quickly; explain First Principles.\n- Detailed Walkthroughs: Every technical piece requires a deep 'How & Why' breakdown."
            : "- You are Friendly, Energetic, and Motivating.\n- You believe in 'Learning by Doing'.\n- Tone: Enthusiastic and supportive. Like a passionate mentor.";

        // Build Platform Context String
        $pricingStr = "";
        if (isset($context['platform']['pricing'])) {
            foreach ($context['platform']['pricing'] as $plan => $info) {
                $pricingStr .= "- " . strtoupper($plan) . ": " . ($info['price'] ?? 0) . " " . ($info['currency'] ?? 'EGP') . " (" . ($info['features'] ?? '') . ")\n";
            }
        }

        $myCoursesStr = "";
        if (isset($context['user']['my_courses']) && !empty($context['user']['my_courses'])) {
            foreach ($context['user']['my_courses'] as $c) {
                $myCoursesStr .= "- " . $c['title'] . " (Progress: " . ($c['progress'] ?? 0) . "%)\n";
            }
        } else {
            $myCoursesStr = "- No courses created yet.";
        }

        $systemPrompt = <<<SYSTEM
You are NOVAIS, an $personaIdentity.
You are currently guiding a learner through the experience: "$courseTitle".

🔴 YOUR PERSONA:
$personaRules
- You NEVER speak like a robot.
- You NEVER use disclaimers like "As an AI language model".
- You are a Platform Expert. You know everything about NOVAIS.

🔴 PLATFORM POLICIES & INFO:
- CURRENT PLANS & PRICING:
$pricingStr
- USER PROGRESS & COURSES:
$myCoursesStr
- CREDITS: The user has {$context['user']['credits']} remaining.
- CERTIFICATES: {$context['platform']['features']['certificates']}
- EXPORT: {$context['platform']['features']['exports']}
- AUDIO: {$context['platform']['features']['audio_player']}

🔴 RULES FOR PLATFORM QUESTIONS:
1. If asked about pricing or plans, strictly use the "CURRENT PLANS & PRICING" list above.
2. If asked about their courses or progress, refer to the "USER PROGRESS & COURSES" list.
3. If they want a certificate, mention they need 100% completion in that course.
4. Always be professional, academic (if prof mode), and extremely helpful.

🔴 RESPONSE FORMATTING (MANDATORY):
- Use Markdown for structure.
- ALWAYS use double line breaks between paragraphs.
- Use bullet points for lists of options or features.
- Ensure every question or distinct points starts on a NEW LINE.
- NEVER return a single dense block of text.
- Use bold text for key terms (e.g., **"Course Name"**) but sparingly.

Language: MATCH the user's language EXACTLY (Detected: $language).
If the user speaks Arabic, respond in Formal Arabic (العربية الفصحى) with proper punctuation and line breaks.
SYSTEM;

        // Build prompt manually
        $fullPrompt = $systemPrompt . "\n\nConversation History:\n";
        
        foreach ($history as $msg) {
            if (is_array($msg) && isset($msg['content'])) {
                $role = (($msg['role'] ?? '') === 'assistant') ? 'NOVAIS' : 'Learner';
                $content = $msg['content'];
                $fullPrompt .= "$role: $content\n";
            }
        }

        $fullPrompt .= "\nLearner: $message\nNOVAIS:";

        // Use standard chat request
        $temp = $isProfessional ? 0.2 : 0.8; // Use 0.2 for chat to allow some natural flow but keep it strict
        $response = $this->chatRequest($fullPrompt, false, $systemPrompt, $temp); 
        
        return str_replace(['NOVAIS:', 'AI:', 'Professor:'], '', $response); 
    }

    // ... (Rest of file)
    protected function chatRequest(string $prompt, bool $expectJson = false, ?string $systemPrompt = null, float $temperature = 0.9)
    {
        $maxRetries = 3;
        $attempt = 0;

        while ($attempt <= $maxRetries) {
            try {
                $client = new Client([
                    'timeout' => 300,
                    'connect_timeout' => 30
                ]);

                $finalSystemPrompt = $systemPrompt ?? 'You are NOVAIS, an expert interactive learning engine.';

                $response = $client->post($this->apiUrl, [
                    'headers' => [
                        'Authorization' => 'Bearer ' . $this->apiKey,
                        'Content-Type' => 'application/json'
                    ],
                    'json' => [
                        'model' => $this->model,
                        'messages' => [
                            [
                                'role' => 'system',
                                'content' => $finalSystemPrompt
                            ],
                            [
                                'role' => 'user',
                                'content' => $prompt
                            ]
                        ],
                        'temperature' => $temperature,
                        'max_tokens' => 8000
                    ]
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                $content = $data['choices'][0]['message']['content'] ?? '';
                
                $this->lastUsage = $data['usage'] ?? [];

                Log::info('AI API Response', [
                    'model' => $this->model,
                    'system_prompt_preview' => substr($finalSystemPrompt, 0, 100),
                    'temperature' => $temperature,
                    'expect_json' => $expectJson
                ]);

                if ($expectJson) {
                    return $this->parseJsonResponse($content);
                }

                return $content;

            } catch (\Exception $e) {
                $statusCode = 0;
                if (method_exists($e, 'getResponse') && $e->getResponse()) {
                    $statusCode = $e->getResponse()->getStatusCode();
                }

                if (
                    $expectJson
                    && $attempt < $maxRetries
                    && (
                        str_starts_with($e->getMessage(), 'Invalid JSON response:')
                        || str_starts_with($e->getMessage(), 'Failed to return a JSON object')
                    )
                ) {
                    $attempt++;
                    $temperature = 0.2;
                    $prompt .= "\n\nYour previous response was not valid JSON. Return strict JSON only. Do not include markdown fences, comments, or unescaped quotes inside strings.";
                    Log::warning("AI JSON parse failed. Retrying with stricter JSON instructions. (Attempt $attempt)");
                    usleep(500000);
                    continue;
                }

                // Retry on 503 (Overloaded) and 429 (Rate Limit)
                if (($statusCode === 503 || $statusCode === 429) && $attempt < $maxRetries) {
                    $attempt++;
                    $delay = pow(2, $attempt) * 1000000; // Exponential sleep (2s, 4s, 8s in microseconds)
                    Log::warning("AI API Busy ($statusCode). Retrying in " . ($delay/1000000) . "s... (Attempt $attempt)");
                    usleep($delay);
                    continue;
                }

                Log::error('AI API Error', [
                    'status_code' => $statusCode,
                    'message' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);

                if ($statusCode === 503) {
                    throw new \Exception('AI provider is currently overloaded (503). Please try again in 1 minute.');
                }
                
                throw new \Exception('AI Request failed: ' . $e->getMessage());
            }
        }
    }

    /**
     * Parse and clean JSON response from AI.
     */
    private function parseJsonResponse(string $content): array
    {
        // 1. Basic Cleaning
        // Remove markdown wrappers but ONLY if they wrap the entire content
        $cleanContent = trim($content);
        if (strpos($cleanContent, '```json') === 0) {
            $cleanContent = substr($cleanContent, 7);
        } elseif (strpos($cleanContent, '```') === 0) {
            $cleanContent = substr($cleanContent, 3);
        }
        
        if (substr($cleanContent, -3) === '```') {
            $cleanContent = substr($cleanContent, 0, -3);
        }
        $cleanContent = trim($cleanContent);
        
        // 2. Try direct decode
        $decoded = json_decode($cleanContent, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        // 3. Extract JSON object using brackets if direct decode fails
        $firstBracket = strpos($cleanContent, '{');
        $lastBracket = strrpos($cleanContent, '}');

        if ($firstBracket !== false && $lastBracket !== false) {
            $jsonCandidate = substr($cleanContent, $firstBracket, $lastBracket - $firstBracket + 1);
            
            // 4. Robust Cleaning Helper
            $cleanedJson = $this->robustCleanJson($jsonCandidate);
            
            $decoded = json_decode($cleanedJson, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }

            // 5. One last ditch effort: fix common escaped character issues
            $lastDitch = str_replace(["\n", "\r", "\t"], ["\\n", "\\r", "\\t"], $jsonCandidate);
            $decoded = json_decode($this->robustCleanJson($lastDitch), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }

            Log::error('JSON Parse Error', [
                'error' => json_last_error_msg(),
                'candidate_preview' => substr($jsonCandidate, 0, 500),
                'cleaned_preview' => substr($cleanedJson ?? 'NULL', 0, 500)
            ]);
            throw new \Exception('Invalid JSON response: ' . $content);
        }

        throw new \Exception('Failed to return a JSON object from content: ' . substr($content, 0, 100));
    }

    /**
     * Robust cleaning for problematic AI-generated JSON.
     */
    private function robustCleanJson(?string $json): string
    {
        if ($json === null) return '';

        // Remove control characters except for space & standard printable chars
        // Preserving \x09 (Tab), \x0A (LF), \x0D (CR) which are essential for JSON structure
        $cleaned = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $json);
        
        // Fallback if preg_replace failed (though unlikely without /u)
        $json = $cleaned ?? $json;

        // Fix trailing commas in objects and arrays
        $json = preg_replace('/,\s*([\]}])/', '$1', $json);
        
        // Fix double-escaped characters
        $json = str_replace(['\\\\n', '\\\\"'], ['\\n', '\\"'], $json);
        
        return $json;
    }
}
