<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'transaction_id',
        'plan_id',
        'provider_order_id',
        'provider_transaction_id',
        'amount',
        'currency',
        'status',
        'paid_at',
        'failed_at',
        'cancelled_at',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
        'paid_at' => 'datetime',
        'failed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
