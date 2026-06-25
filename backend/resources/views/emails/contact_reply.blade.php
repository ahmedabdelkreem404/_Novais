<!DOCTYPE html>
<html>
<body style="direction: {{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}; text-align: {{ app()->getLocale() === 'ar' ? 'right' : 'left' }};">
    <h1>Reply to your message</h1>
    <p>Hello {{ $contact->name }},</p>
    <p>{{ $replyMessage }}</p>
    <br>
    <p>Regards,<br>NOVAIS Team</p>
</body>
</html>
