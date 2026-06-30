<?php

namespace App\Interfaces;

interface AIProviderInterface
{
    public function generateCourseOutline(string $topic, int $count, string $type, string $language, string $level = 'Beginner', mixed $blueprint = null, array $blueprintFields = []): array;
    public function generateLessonContent(string $topic, string $subTopic, string $language): array;
    public function generateQuiz(string $topic, int $count, string $language): array;
    public function chat(string $message, array $history): string;
    public function translateTitle(string $title): string;
}
