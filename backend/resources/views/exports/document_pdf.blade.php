<!DOCTYPE html>
<html lang="{{ $isRtl ? 'ar' : 'en' }}" dir="{{ $isRtl ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8">
    <title>{{ $course->title }}</title>
    <style>
        @page { 
            margin: 80px 60px 80px; 
            @bottom-center {
                content: counter(page);
                font-family: DejaVu Sans, sans-serif;
                font-size: 9px;
                color: #94a3b8;
            }
        }
        body {
            font-family: DejaVu Sans, sans-serif;
            color: #1e293b;
            font-size: 13px;
            line-height: 1.8;
        }
        
        /* Cover Page Styling */
        .cover-page {
            page-break-after: always;
            text-align: center;
            height: 100%;
            padding-top: 20px;
            position: relative;
        }
        .academic-header {
            border-bottom: 2px double #cbd5e1;
            padding-bottom: 15px;
            margin-bottom: 60px;
        }
        .univ-title {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin: 4px 0;
        }
        .faculty-title {
            font-size: 14px;
            color: #475569;
            margin: 2px 0;
        }
        .doc-badge {
            display: inline-block;
            background: #f1f5f9;
            color: #2563eb;
            font-size: 12px;
            font-weight: bold;
            padding: 6px 16px;
            border-radius: 20px;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .doc-title {
            font-size: 28px;
            font-weight: 900;
            color: #0f172a;
            line-height: 1.3;
            margin: 20px auto 40px;
            max-width: 600px;
        }
        .academic-meta-table {
            width: 100%;
            margin-top: 100px;
            border-collapse: collapse;
            font-size: 13px;
            text-align: {{ $isRtl ? 'right' : 'left' }};
        }
        .academic-meta-table td {
            padding: 8px 12px;
            vertical-align: top;
        }
        .meta-label {
            font-weight: bold;
            color: #475569;
            width: 30%;
        }
        .meta-value {
            color: #0f172a;
        }
        .cover-footer {
            margin-top: 80px;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }

        /* Table of Contents */
        .toc-section {
            page-break-after: always;
            padding-top: 20px;
        }
        .section-heading {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
            margin-bottom: 30px;
        }
        .toc-row {
            display: table;
            width: 100%;
            padding: 10px 0;
            border-bottom: 1px dashed #e2e8f0;
            font-size: 14px;
        }
        .toc-title {
            display: table-cell;
            text-align: {{ $isRtl ? 'right' : 'left' }};
            color: #1e293b;
            font-weight: bold;
        }
        .toc-dots {
            display: table-cell;
            color: #94a3b8;
        }
        
        /* Chapters Rendering */
        .chapter-section {
            page-break-before: always;
            page-break-inside: auto;
            padding-top: 10px;
        }
        .chapter-title {
            font-size: 22px;
            font-weight: bold;
            color: #0f172a;
            padding-bottom: 12px;
            border-bottom: 2px solid #cbd5e1;
            margin-bottom: 20px;
            line-height: 1.4;
        }
        .chapter-content {
            font-size: 13.5px;
            color: #334155;
            text-align: justify;
        }
        .chapter-content h1, .chapter-content h2, .chapter-content h3 {
            color: #0f172a;
            margin-top: 25px;
            margin-bottom: 10px;
            line-height: 1.4;
        }
        .chapter-content h1 { font-size: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
        .chapter-content h2 { font-size: 16px; }
        .chapter-content h3 { font-size: 14px; }
        .chapter-content p {
            margin-bottom: 15px;
        }
        .chapter-content ul, .chapter-content ol {
            margin: 10px 0 20px;
            padding-left: 20px;
        }
        [dir="rtl"] .chapter-content ul, [dir="rtl"] .chapter-content ol {
            padding-left: 0;
            padding-right: 20px;
        }
        .chapter-content li {
            margin-bottom: 6px;
        }
        
        /* Code blocks */
        .chapter-content code {
            font-family: DejaVu Sans Mono, monospace;
            background: #f1f5f9;
            color: #0f172a;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
        }
        .chapter-content pre {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 15px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 15px 0;
        }
        .chapter-content pre code {
            background: transparent;
            padding: 0;
        }

        /* Placeholders rendering */
        .placeholder-box {
            background: #f8fafc;
            border: 2px dashed #94a3b8;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            font-style: italic;
            color: #475569;
        }
        .placeholder-title {
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 5px;
            font-size: 12px;
            text-transform: uppercase;
        }
        
        /* Simple footer page numbering */
        .page-footer {
            position: fixed;
            bottom: -50px;
            left: 0;
            right: 0;
            height: 30px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="page-footer">
        {{ $course->title }} • {{ $isRtl ? 'صفحة' : 'Page' }}
    </div>

    <!-- 1. Cover Page -->
    <div class="cover-page">
        <div class="academic-header">
            @if(!empty($blueprintFields['university']))
                <div class="univ-title">{{ $blueprintFields['university'] }}</div>
            @endif
            @if(!empty($blueprintFields['faculty']))
                <div class="faculty-title">{{ $blueprintFields['faculty'] }}</div>
            @endif
            @if(!empty($blueprintFields['department']))
                <div class="faculty-title">{{ $blueprintFields['department'] }}</div>
            @endif
        </div>

        <div style="margin-top: 40px;">
            <span class="doc-badge">
                @if($course->blueprint_slug === 'graduation-project')
                    {{ $isRtl ? 'مشروع تخرج' : 'Graduation Project Book' }}
                @elseif($course->blueprint_slug === 'master-thesis')
                    {{ $isRtl ? 'رسالة ماجستير' : 'Master Thesis' }}
                @else
                    {{ $isRtl ? 'كتاب تعليمي' : 'Academic Book' }}
                @endif
            </span>
            <h1 class="doc-title">{{ $course->title }}</h1>
        </div>

        <table class="academic-meta-table">
            <tbody>
                @if(!empty($blueprintFields['specialization']))
                    <tr>
                        <td class="meta-label">{{ $isRtl ? 'التخصص الدراسي:' : 'Specialization:' }}</td>
                        <td class="meta-value">{{ $blueprintFields['specialization'] }}</td>
                    </tr>
                @endif
                @if(!empty($blueprintFields['students']))
                    <tr>
                        <td class="meta-label">{{ $isRtl ? 'إعداد الطلاب:' : 'Prepared by:' }}</td>
                        <td class="meta-value">{{ $blueprintFields['students'] }}</td>
                    </tr>
                @elseif(!empty($user->name))
                    <tr>
                        <td class="meta-label">{{ $isRtl ? 'إعداد الباحث:' : 'Prepared by:' }}</td>
                        <td class="meta-value">{{ $user->name }}</td>
                    </tr>
                @endif
                @if(!empty($blueprintFields['supervisors']))
                    <tr>
                        <td class="meta-label">{{ $isRtl ? 'إشراف الأستاذ:' : 'Supervised by:' }}</td>
                        <td class="meta-value">{{ $blueprintFields['supervisors'] }}</td>
                    </tr>
                @endif
            </tbody>
        </table>

        <div class="cover-footer">
            @if(!empty($blueprintFields['academic_year']))
                {{ $blueprintFields['academic_year'] }}
            @else
                {{ now()->format('Y') }}
            @endif
        </div>
    </div>

    <!-- 2. Table of Contents -->
    <div class="toc-section">
        <h2 class="section-heading">{{ $isRtl ? 'الفهرس' : 'Table of Contents' }}</h2>
        @foreach($exportLessons as $lesson)
            <div class="toc-row">
                <span class="toc-title">
                    {{ $lesson['title'] }}
                </span>
            </div>
        @endforeach
    </div>

    <!-- 3. Document Body Sections -->
    @foreach($exportLessons as $lesson)
        <div class="chapter-section">
            <h2 class="chapter-title">{{ $lesson['title'] }}</h2>
            <div class="chapter-content">
                {!! $lesson['html'] !!}
            </div>
        </div>
    @endforeach
</body>
</html>
