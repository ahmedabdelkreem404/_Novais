<?php

use Illuminate\Support\Facades\Route;
use App\Services\AI\DeepSeekService;

Route::get('/test-interactive', function (DeepSeekService $ai) {
    // 1. Generate Course Outline
    $topic = request('topic', 'Negotiation Skills');
    $language = request('lang', 'English');
    
    $outline = $ai->generateInteractiveCourseOutline($topic, $language, 'Beginner');
    
    // 2. Generate First Lesson Content
    $firstLesson = $outline['lessons'][0] ?? null;
    $lessonContent = null;
    
    if ($firstLesson) {
        $lessonContent = $ai->generateInteractiveLesson(
            $outline['title'],
            $firstLesson['title'],
            $language,
            'Beginner'
        );
    }
    
    return [
        'outline' => $outline,
        'sample_lesson' => $lessonContent
    ];
});
