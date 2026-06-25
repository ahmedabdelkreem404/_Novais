<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactReplyMail extends Mailable
{
    use Queueable, SerializesModels;

    public $contact;
    public $replyMessage;

    public function __construct($contact, $replyMessage)
    {
        $this->contact = $contact;
        $this->replyMessage = $replyMessage;
        config(['app.name' => 'NOVAIS-INOLTY']);
    }

    public function build()
    {
        return $this->subject('Response to your inquiry')
                    ->view('emails.contact_reply');
    }
}
