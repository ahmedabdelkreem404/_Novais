<!DOCTYPE html>
<html>
<body style="direction: {{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}; text-align: {{ app()->getLocale() === 'ar' ? 'right' : 'left' }};">
    <h1>{{ __('emails.verification_code.hello') }}</h1>
    <p>{{ __('emails.reset_password.line1') }}</p>
    <p><a href="{{ $resetUrl }}">{{ __('emails.reset_password.action') }}</a></p>
    <p>{{ __('emails.reset_password.line2') }}</p>
    <p>{{ __('emails.reset_password.line3') }}</p>
    <br>
    <p>{{ __('emails.verification_code.thanks') }}<br>{{ config('app.name') }}</p>
</body>
</html>
