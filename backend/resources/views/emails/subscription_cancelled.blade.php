<!DOCTYPE html>
<html>
<body style="direction: {{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}; text-align: {{ app()->getLocale() === 'ar' ? 'right' : 'left' }};">
    <h1>Subscription Cancelled</h1>
    <p>Hello {{ $user->name }},</p>
    <p>Your subscription has been successfully cancelled as requested.</p>
    <p>You will retain access until the end of your correct billing period.</p>
    <br>
    <p>We hope to see you again!</p>
    <p>Regards,<br>NOVAIS Team</p>
</body>
</html>
