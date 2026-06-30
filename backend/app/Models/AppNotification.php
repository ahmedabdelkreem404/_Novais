<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'body',
        'type',
        'data',
        'is_broadcast',
        'published_at',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_broadcast' => 'boolean',
        'published_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
