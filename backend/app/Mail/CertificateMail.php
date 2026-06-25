<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CertificateMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $course;
    protected $pdfOutput;

    public function __construct($user, $course, $pdfOutput)
    {
        $this->user = $user;
        $this->course = $course;
        $this->pdfOutput = $pdfOutput;
        config(['app.name' => 'NOVAIS-INOLTY']);
    }

    public function build()
    {
        return $this->subject(__('emails.certificate.subject'))
                    ->view('emails.certificate')
                    ->attachData($this->pdfOutput, 'certificate.pdf', [
                        'mime' => 'application/pdf',
                    ]);
    }
}
