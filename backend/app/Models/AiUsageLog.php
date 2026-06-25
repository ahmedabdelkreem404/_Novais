<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiUsageLog extends Model
{
    protected $fillable = ['user_id', 'feature', 'tokens_used'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
