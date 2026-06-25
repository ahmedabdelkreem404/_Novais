<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PremiumUpgradedMail extends Mailable
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
        return $this->subject(__('emails.premium_upgraded.subject'))
                    ->view('emails.premium_upgraded');
    }
}
