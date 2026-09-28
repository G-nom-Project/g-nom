<?php

namespace App\Ai;

use App\Ai\Agents\ToolRouter;
use App\Models\ChatCapability;
use Illuminate\Support\Facades\Log;

/**
 * Routes user prompts to required tools to save tokens. A separately configured (preferably cheaper) model categorizes
 * the query. Agents are then instantiated only with tools belonging to these categories (capabilities). Multiple
 * capabilities may be active at the same time. Each capability has a TTL of 5, meaning it will be available for the
 * next 5 messages. Categorization by the model resets this count to 5.
 */
class AssistantToolRouter
{
    public function route(string $message, string $conversation_id): array
    {
        $current_capabilities = [];

        $chat_capabilities = ChatCapability::where('agent_conversations_id', $conversation_id)->first();
        if (! $chat_capabilities) {
            $chat_capabilities = new ChatCapability;
            $chat_capabilities->agent_conversations_id = $conversation_id;
            $chat_capabilities->active_capabilities = [];
            $chat_capabilities->save();
        } else {
            $current_capabilities = $chat_capabilities->active_capabilities;
        }

        // Let the model decide on new capabilities
        $result = (new ToolRouter)
            ->prompt(
                $message,
                provider: config('ai.tool_routing.provider'),
                model: config('ai.tool_routing.model')
            );

        Log::debug('Routing took: '.$result->usage->promptTokens.'-'.$result->usage->completionTokens);

        $capabilities = collect($result['capabilities'])
            ->filter(fn ($capability) => AssistantCapability::tryFrom($capability) !== null)
            ->unique()
            ->values()
            ->all();

        $capability_array = [];
        foreach ($capabilities as $capability) {
            $capability_array[$capability] = 5;
        }


        // Count down by one
        $current_capabilities = array_filter(
            array_map(fn ($value) => $value - 1, $current_capabilities),
            fn ($value) => $value > 0
        );

        // Merge capabilities, override counters for newly (re-)gained ones
        $mergedCapabilities = array_merge($current_capabilities, $capability_array);
        $chat_capabilities->active_capabilities = $mergedCapabilities;
        $chat_capabilities->save();


        return [
            'capabilities' => $mergedCapabilities,
            'tokens' => $result->usage->promptTokens + $result->usage->completionTokens,
        ];
    }
}
