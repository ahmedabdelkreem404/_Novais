<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbuseFlag extends Model
{
    protected $fillable = [
        'user_id',
        'device_id',
        'reason',
        'risk_score',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'json'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
