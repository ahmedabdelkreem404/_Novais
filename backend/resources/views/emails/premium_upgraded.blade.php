<!DOCTYPE html>
<html>
<body style="direction: {{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}; text-align: {{ app()->getLocale() === 'ar' ? 'right' : 'left' }};">
    <h1>Premium Upgrade</h1>
    <p>Hello {{ $user->name }},</p>
    <p>Good news! Your account has been upgraded to Premium by an administrator.</p>
    <p>Enjoy unlimited access to all features.</p>
    <br>
    <p>Regards,<br>NOVAIS Team</p>
</body>
</html>
