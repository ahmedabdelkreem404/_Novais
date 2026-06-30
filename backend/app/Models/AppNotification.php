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
        'scheduled_at',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'is_broadcast' => 'boolean',
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'read_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeReadyForDelivery($query)
    {
        return $query->where(function ($builder) {
            $builder->where(function ($inner) {
                $inner->whereNull('published_at')->orWhere('published_at', '<=', now());
            })->where(function ($inner) {
                $inner->whereNull('scheduled_at')->orWhere('scheduled_at', '<=', now());
            });
        });
    }
}
