<?php

namespace App\Services;

class CurriculumValidator
{
    /**
     * Validate the generated course outline and roadmap.
     *
     * @param array $roadmap
     * @param array $outline
     * @return array
     */
    public function validate(array $roadmap, array $outline): array
    {
        $violations = [];

        if (!$this->hasText($outline['title'] ?? null)) {
            $violations[] = 'missing_course_title';
        }

        $sections = $this->extractSections($outline);
        if (empty($sections)) {
            $violations[] = 'missing_course_sections';
        }

        foreach ($sections as $sectionIndex => $section) {
            if (!is_array($section)) {
                $violations[] = "invalid_section_{$sectionIndex}";
                continue;
            }

            if (!$this->hasText($section['title'] ?? null)) {
                $violations[] = "missing_section_title_{$sectionIndex}";
            }

            $lessons = $this->extractLessons($section);
            if (empty($lessons)) {
                $violations[] = "missing_lessons_{$sectionIndex}";
                continue;
            }

            foreach ($lessons as $lessonIndex => $lesson) {
                if (is_string($lesson)) {
                    if (!$this->hasText($lesson)) {
                        $violations[] = "missing_lesson_title_{$sectionIndex}_{$lessonIndex}";
                    }
                    continue;
                }

                if (!is_array($lesson) || !$this->hasText($lesson['title'] ?? null)) {
                    $violations[] = "missing_lesson_title_{$sectionIndex}_{$lessonIndex}";
                }
            }
        }

        return [
            'status' => empty($violations) ? 'valid' : 'invalid',
            'violations' => $violations
        ];
    }

    public function normalize(array $outline, array $context = []): array
    {
        $title = $this->stringOrFallback(
            $outline['title'] ?? null,
            $context['title'] ?? $context['topic'] ?? $context['mainTopic'] ?? 'Untitled Course'
        );

        $sections = $this->extractSections($outline);
        if (empty($sections)) {
            $sections = [[
                'title' => 'Getting Started',
                'subtopics' => [[
                    'title' => $title,
                    'content' => $this->fallbackLessonContent(),
                    'theory' => $this->fallbackLessonContent(),
                ]],
            ]];
        }

        $normalizedSections = [];
        foreach (array_values($sections) as $sectionIndex => $section) {
            $section = is_array($section) ? $section : ['title' => (string) $section];
            $lessons = $this->extractLessons($section);

            if (empty($lessons)) {
                $lessons = [[
                    'title' => 'Lesson ' . ($sectionIndex + 1),
                    'content' => $this->fallbackLessonContent(),
                    'theory' => $this->fallbackLessonContent(),
                ]];
            }

            $normalizedLessons = [];
            foreach (array_values($lessons) as $lessonIndex => $lesson) {
                $lesson = is_array($lesson) ? $lesson : ['title' => (string) $lesson];
                $lessonTitle = $this->stringOrFallback(
                    $lesson['title'] ?? $lesson['name'] ?? null,
                    'Lesson ' . ($lessonIndex + 1)
                );

                $content = $lesson['content'] ?? $lesson['theory'] ?? null;
                if (array_key_exists('content', $lesson) || array_key_exists('theory', $lesson)) {
                    $lesson['content'] = $this->stringOrFallback($content, $this->fallbackLessonContent());
                    $lesson['theory'] = $this->stringOrFallback($lesson['theory'] ?? $lesson['content'], $lesson['content']);
                }

                $lesson['title'] = $lessonTitle;
                $normalizedLessons[] = $lesson;
            }

            $section['title'] = $this->stringOrFallback(
                $section['title'] ?? $section['name'] ?? null,
                'Chapter ' . ($sectionIndex + 1)
            );
            unset($section['sections'], $section['lessons']);
            $section['subtopics'] = $normalizedLessons;
            $normalizedSections[] = $section;
        }

        unset($outline['topics'], $outline['content']);
        $outline['title'] = $title;
        $outline['chapters'] = $normalizedSections;

        return $outline;
    }

    private function extractSections(array $outline): array
    {
        foreach (['chapters', 'topics', 'content'] as $key) {
            if (isset($outline[$key]) && is_array($outline[$key])) {
                return $outline[$key];
            }
        }

        foreach ($outline as $value) {
            if (is_array($value) && array_is_list($value)) {
                return $value;
            }
        }

        return [];
    }

    private function extractLessons(array $section): array
    {
        foreach (['subtopics', 'sections', 'lessons'] as $key) {
            if (isset($section[$key]) && is_array($section[$key])) {
                return $section[$key];
            }
        }

        return [];
    }

    private function stringOrFallback($value, string $fallback): string
    {
        return $this->hasText($value) ? trim((string) $value) : $fallback;
    }

    private function hasText($value): bool
    {
        return is_string($value) && trim($value) !== '';
    }

    private function fallbackLessonContent(): string
    {
        return 'Content will be generated when this lesson is opened.';
    }
}
