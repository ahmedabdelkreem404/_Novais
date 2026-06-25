<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeviceFingerprint extends Model
{
    protected $fillable = [
        'user_id',
        'device_id',
        'ip_address',
        'user_agent',
        'last_seen_at'
    ];

    protected $casts = [
        'last_seen_at' => 'datetime'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
