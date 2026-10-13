<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AssistantStreamBroadcast implements ShouldBroadcast
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public string $conversationId,
        public string $message,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel(
                "conversation.{$this->conversationId}.stream"
            ),
        ];
    }

    public function broadcastAs(): string
    {
        return 'assistant.message.stream';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'message' => $this->message,
        ];
    }
}
