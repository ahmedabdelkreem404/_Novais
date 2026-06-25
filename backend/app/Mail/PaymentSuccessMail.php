<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $payment;
    protected $pdfOutput;

    public function __construct($user, $payment, $pdfOutput)
    {
        $this->user = $user;
        $this->payment = $payment;
        $this->pdfOutput = $pdfOutput;
        config(['app.name' => 'NOVAIS-INOLTY']);
    }

    public function build()
    {
        return $this->subject(__('emails.payment_success.subject'))
                    ->view('emails.payment_success')
                    ->attachData($this->pdfOutput, 'invoice.pdf', [
                        'mime' => 'application/pdf',
                    ]);
    }
}
