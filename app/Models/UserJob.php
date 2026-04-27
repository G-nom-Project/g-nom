<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserJob extends Model
{
    protected $table = 'user_jobs';

    //
    protected $fillable = [
        'user_id',
        'job_class',
        'status',
        'queue',
        'progress',
        'payload',
        'result',
        'error_message',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'result' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
