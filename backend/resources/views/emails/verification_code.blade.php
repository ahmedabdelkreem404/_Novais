<x-mail::message>
# {{ __('emails.verification_code.welcome') }}

{{ __('emails.verification_code.hello') }}

{{ __('emails.verification_code.thank_you') }}

{{ __('emails.verification_code.finalize_setup') }}

<x-mail::panel>
<h1 style="text-align: center; letter-spacing: 5px; color: #7c3aed; margin: 0;">{{ $code }}</h1>
</x-mail::panel>

> [!IMPORTANT]
> {{ __('emails.verification_code.expiry_notice') }}

{{ __('emails.verification_code.ignore_if_not_requested') }}

{{ __('emails.verification_code.thanks') }}<br>
{{ __('emails.verification_code.team', ['app' => config('app.name')]) }}

<x-mail::subcopy>
{{ __('emails.verification_code.trouble') }}
</x-mail::subcopy>
</x-mail::message>
