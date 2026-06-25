<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SubscriptionCancelledMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;

    public function __construct($user)
    {
        $this->user = $user;
        config(['app.name' => 'NOVAIS-INOLTY']);
    }

    public function build()
    {
        return $this->subject(__('emails.subscription_cancelled.subject'))
                    ->view('emails.subscription_cancelled');
    }
}
