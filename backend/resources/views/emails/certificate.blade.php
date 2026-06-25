<!DOCTYPE html>
<html>
<head>
    <title>Certificate Earned</title>
</head>
<body style="direction: {{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}; text-align: {{ app()->getLocale() === 'ar' ? 'right' : 'left' }};">
    <h1>Congratulations, {{ $user->name }}!</h1>
    <p>You have successfully completed the course: <strong>{{ $course->title }}</strong>.</p>
    <p>Please find your certificate attached to this email.</p>
    <p>Keep learning!</p>
    <br>
    <p>Best Regards,</p>
    <p>NOVAIS Team</p>
</body>
</html>
