<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatCapability extends Model
{
    //
    protected $table = 'chat_capabilities';

    protected $primaryKey = 'agent_conversations_id';

    protected $casts = [
        'active_capabilities' => 'array',
    ];
}
