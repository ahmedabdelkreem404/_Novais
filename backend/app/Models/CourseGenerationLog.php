<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseGenerationLog extends Model
{
    protected $fillable = [
        'user_id',
        'course_id',
        'device_id',
        'ip_address'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
