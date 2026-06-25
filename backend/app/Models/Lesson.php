<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'topic_title',
        'title',
        'content',
        'media_url',
        'media_type',
        'is_completed',
        'metadata',
    ];

    protected $casts = [
        'is_completed' => 'boolean',
        'metadata' => 'array',
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
