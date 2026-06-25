<!DOCTYPE html>
<html>
<head>
    <title>{{ __('emails.welcome.subject') }}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; direction: {{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}; text-align: {{ app()->getLocale() === 'ar' ? 'right' : 'left' }};">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #333333; text-align: center;">{{ __('emails.welcome.title') }}</h1>
        <p style="color: #555555; font-size: 16px; line-height: 1.6;">
            {{ __('emails.verification_code.hello') }} {{ $user->name }},
        </p>
        <p style="color: #555555; font-size: 16px; line-height: 1.6;">
            {{ __('emails.welcome.body') }}
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="{{ env('FRONTEND_URL', 'http://localhost:3000') }}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">{{ __('emails.welcome.signin_btn') }}</a>
        </div>
        <p style="color: #999999; font-size: 14px; text-align: center; margin-top: 40px;">
            &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
        </p>
    </div>
</body>
</html>
