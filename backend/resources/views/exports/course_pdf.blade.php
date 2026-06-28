<!DOCTYPE html>
<html lang="{{ $isRtl ? 'ar' : 'en' }}" dir="{{ $isRtl ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8">
    <title>{{ $course->title }}</title>
    <style>
        @page { margin: 72px 54px 64px; }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #111827;
            font-size: 12px;
            line-height: 1.7;
        }
        .cover {
            page-break-after: always;
            text-align: center;
            padding-top: 180px;
        }
        .brand {
            color: #2563eb;
            font-size: 13px;
            font-weight: 700;
            letter-spacing: 2px;
            text-transform: uppercase;
        }
        h1 {
            margin: 24px auto 12px;
            max-width: 620px;
            font-size: 34px;
            line-height: 1.25;
            color: #0f172a;
        }
        .subtitle { color: #64748b; font-size: 13px; }
        .toc {
            page-break-after: always;
        }
        h2 {
            margin: 0 0 18px;
            font-size: 22px;
            color: #0f172a;
        }
        .toc-row {
            padding: 9px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .lesson {
            page-break-before: always;
            page-break-inside: auto;
        }
        .lesson-number {
            color: #2563eb;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .lesson-title {
            margin: 6px 0 18px;
            padding-bottom: 10px;
            border-bottom: 2px solid #2563eb;
            font-size: 22px;
            line-height: 1.35;
            font-weight: 700;
            color: #0f172a;
        }
        .content h1, .content h2, .content h3 {
            margin: 18px 0 8px;
            color: #1e293b;
            line-height: 1.35;
        }
        .content p { margin: 0 0 10px; }
        .content ul, .content ol { margin: 8px 0 14px; padding-left: 24px; }
        [dir="rtl"] .content ul, [dir="rtl"] .content ol { padding-left: 0; padding-right: 24px; }
        .content li { margin-bottom: 6px; }
        .content code {
            font-family: DejaVu Sans Mono, monospace;
            background: #eff6ff;
            color: #1d4ed8;
            padding: 1px 4px;
            border-radius: 3px;
        }
        .empty {
            color: #94a3b8;
            font-style: italic;
        }
        .footer {
            position: fixed;
            bottom: -38px;
            left: 0;
            right: 0;
            color: #94a3b8;
            font-size: 10px;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
        }
    </style>
</head>
<body>
    <div class="footer">NOVAIS • {{ $course->title }}</div>

    <section class="cover">
        <div class="brand">NOVAIS Course Export</div>
        <h1>{{ $course->title }}</h1>
        <div class="subtitle">Created by {{ $user->name }} • {{ now()->format('Y-m-d') }}</div>
    </section>

    <section class="toc">
        <h2>{{ $isRtl ? 'الفهرس' : 'Table of Contents' }}</h2>
        @foreach($exportLessons as $lesson)
            <div class="toc-row">
                {{ $lesson['number'] }}. {{ $lesson['title'] }}
            </div>
        @endforeach
    </section>

    @foreach($exportLessons as $lesson)
        <section class="lesson">
            <div class="lesson-number">{{ $isRtl ? 'الدرس' : 'Lesson' }} {{ $lesson['number'] }}</div>
            <div class="lesson-title">{{ $lesson['title'] }}</div>
            <div class="content">{!! $lesson['html'] !!}</div>
        </section>
    @endforeach
</body>
</html>
