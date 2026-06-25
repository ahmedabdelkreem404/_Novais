<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'description',
        'features',
        'price_egp',
        'course_limit',
        'billing_cycle',
    ];

    protected $casts = [
        'name' => 'array',
        'description' => 'array',
        'features' => 'array',
    ];
}
