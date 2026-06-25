<!DOCTYPE html>
<html>
<head>
    <title>{{ $course->title }}</title>
    <style>
        body { font-family: sans-serif; }
        h1 { color: #333; text-align: center; }
        .lesson { margin-bottom: 30px; page-break-inside: avoid; }
        .lesson-title { font-size: 20px; font-weight: bold; color: #555; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
        .content { margin-top: 10px; font-size: 14px; line-height: 1.6; }
    </style>
</head>
<body>
    <h1>{{ $course->title }}</h1>
    <p style="text-align: center;">Created by {{ $user->name }}</p>
    <hr>
    
    @foreach($course->lessons as $lesson)
        <div class="lesson">
            <div class="lesson-title">{{ $lesson->title }}</div>
            <div class="content">
                {!! nl2br(e($lesson->content)) !!}
            </div>
        </div>
    @endforeach
</body>
</html>
