<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MediaCache extends Model
{
    protected $table = 'media_cache';
    
    protected $fillable = [
        'query_hash',
        'type',
        'url',
        'title',
        'description',
        'source',
        'metadata',
        'relevance_score',
        'expires_at'
    ];

    protected $casts = [
        'metadata' => 'array',
        'relevance_score' => 'decimal:2',
        'expires_at' => 'datetime'
    ];

    /**
     * Scope to get only valid (non-expired) cache entries
     */
    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now());
    }

    /**
     * Scope to get entries with minimum relevance score
     */
    public function scopeRelevant($query, $minScore = 0.6)
    {
        return $query->where('relevance_score', '>=', $minScore);
    }
}
