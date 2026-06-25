<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $token;

    public function __construct($token)
    {
        $this->token = $token;
        config(['app.name' => 'NOVAIS-INOLTY']);
    }

    public function build()
    {
        $resetUrl = env('FRONTEND_URL', 'http://localhost:3000') . '/reset-password/' . $this->token;

        return $this->subject(__('emails.reset_password.subject'))
                    ->view('emails.reset_password')
                    ->with(['resetUrl' => $resetUrl]);
    }
}
