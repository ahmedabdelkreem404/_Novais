<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PersonalNote extends Model
{
    protected $fillable = ['user_id', 'course_id', 'lesson_id', 'content'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }
}
