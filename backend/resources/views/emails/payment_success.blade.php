<!DOCTYPE html>
<html>
<body style="direction: {{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}; text-align: {{ app()->getLocale() === 'ar' ? 'right' : 'left' }};">
    <h1>Payment Successful!</h1>
    <p>Thank you, {{ $user->name }}.</p>
    <p>Your payment of {{ $payment->amount }} {{ $payment->currency }} was successful.</p>
    <p>Your subscription is now active.</p>
    <p>Please find your invoice attached.</p>
    <br>
    <p>Regards,<br>NOVAIS Team</p>
</body>
</html>
