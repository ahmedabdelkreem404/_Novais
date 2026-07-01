<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'user_id',
        'title',
        'type',
        'blueprint_slug',
        'language',
        'photo',
        'metadata',
        'completed',
        'ended_at',
        'is_full_course',
        'full_completed_at',
    ];

    protected static function booted()
    {
        static::creating(function ($course) {
            $course->public_id = bin2hex(random_bytes(12)); // 24 chars
        });
    }

    protected $casts = [
        'metadata' => 'array',
        'completed' => 'boolean',
        'ended_at' => 'datetime',
        'is_full_course' => 'boolean',
        'full_completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lessons()
    {
        return $this->hasMany(Lesson::class);
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }

    public function personalNotes()
    {
        return $this->hasMany(PersonalNote::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }
}
