<?php

use Illuminate\Support\Facades\Broadcast;
use Laravel\Ai\Models\Conversation;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversation}', function ($user, Conversation $conversation) {
    return $conversation->participant_id === $user->id;
});
