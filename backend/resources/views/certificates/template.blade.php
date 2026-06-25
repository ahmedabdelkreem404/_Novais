<!DOCTYPE html>
<html>
<head>
    <title>Certificate of Completion</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; text-align: center; border: 15px solid #1E40AF; padding: 50px; background-color: #F8FAFF; }
        h1 { color: #1E40AF; font-size: 50px; margin-bottom: 20px; text-transform: uppercase; }
        p { font-size: 20px; color: #7f8c8d; }
        .name { font-size: 40px; color: #1E40AF; margin: 20px 0; font-weight: bold; }
        .course { font-size: 30px; color: #2563EB; margin: 20px 0; font-weight: bold; }
        .date { margin-top: 50px; font-size: 15px; color: #95a5a6; }
        .code { margin-top: 20px; font-size: 12px; color: #bdc3c7; }
    </style>
</head>
<body>
    <h1>Certificate of Completion</h1>
    <p>This is to certify that</p>
    <div class="name">{{ $user->name }}</div>
    <p>has successfully completed the course</p>
    <div class="course">{{ $course->title }}</div>

    @php
        $meta = is_string($course->metadata) ? json_decode($course->metadata, true) : $course->metadata;
        $quiz = $meta['quizResult'] ?? null;
    @endphp

    @if($quiz)
    <div style="margin-top: 30px;">
        <p style="margin-bottom: 5px;">Grade Achieved</p>
        <div style="font-size: 24px; color: #2c3e50; font-weight: bold; text-transform: uppercase;">
            {{ $quiz['grade'] ?? 'Passed' }} ({{ $quiz['score'] ?? 0 }}%)
        </div>
    </div>
    @endif
    
    <div class="date">Issued on: {{ $certificate->issued_at->format('F d, Y') }}</div>
    <div class="code">
        Certificate Code: {{ $certificate->certificate_code }}<br>
        <span style="font-size: 10px; opacity: 0.6;">Verified Academic Achievement via NOVAIS Platform</span>
    </div>
</body>
</html>
