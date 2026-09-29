<?php

namespace App\Jobs;

use App\Ai\Agents\UserAssistant;
use App\Ai\AssistantToolRouter;
use App\Events\AssistantMessageCompleted;
use App\Events\AssistantStreamBroadcast;
use App\Models\ExternalLLM;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Laravel\Ai\Models\Conversation;
use Laravel\Ai\Models\ConversationMessage;
use Laravel\Ai\Responses\StreamedAgentResponse;
use Laravel\Ai\Streaming\Events\ToolCall;
use Laravel\Ai\Streaming\Events\ToolResult;
use Ramsey\Uuid\Uuid;
use Throwable;

class RunUserAssistant implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Maximum amount of time this job may run. This is a catch-all, the LLM inference time limit is managed at the
     * Agent class level.
     */
    public int $timeout = 300000;

    /**
     * AI requests generally shouldn't be blindly retried because an LLM request may already have been processed by the
     * provider.
     */
    public int $tries = 1;

    public function __construct(
        public readonly int $userId,
        public readonly string $conversationId,
        public readonly int $modelId,
        public readonly string $prompt,
        public readonly string $tempID = 'None',
        public readonly int $maxSteps = 5,
        public readonly int $agentTimeout = 60,
    ) {
        $this->onQueue('ai');
    }

    /**
     * Prevent multiple agent executions against the same conversation from running simultaneously.
     * This must be changed if we wish to explore multi-agent scenarios in the future.
     */
    public function middleware(): array
    {
        return [
            (new WithoutOverlapping(
                "assistant-conversation:{$this->conversationId}"
            ))->releaseAfter(5),
        ];
    }

    public function handle(): void
    {
        $user = User::findOrFail($this->userId);
        if ($this->modelId === -1) {
            $this->runBuiltinModel($user);

            return;
        }

        $model = ExternalLLM::findOrFail($this->modelId);

        $this->runExternalModel($user, $model);
    }

    /**
     * Run the configured/builtin Laravel AI provider.
     */
    protected function runBuiltinModel(User $user): void
    {
        if (config('ai.tool_routing.enabled')) {
            $routed = app(AssistantToolRouter::class)
                ->route($this->prompt, $this->conversationId);
            $capabilities = array_keys($routed['capabilities']);
            $agent = new UserAssistant($user, max_steps: $this->maxSteps, selectedCapabilities: $capabilities);
        } else {
            $agent = new UserAssistant($user, max_steps: $this->maxSteps);
        }

        try {
            $stream = ($agent)
                ->continue(
                    $this->conversationId,
                    as: $user,
                )
                ->stream($this->prompt, timeout: $this->agentTimeout)
                ->then(function (StreamedAgentResponse $response) {
                    $events = $response->events;
                    // Collect only text deltas belonging to the final message.
                    $finalMessageId = $events
                        ->filter(fn ($event) => isset($event->messageId))
                        ->last()
                        ->messageId;

                    $finalText = $events
                        ->filter(fn ($event) => isset($event->messageId) &&
                            $event->messageId === $finalMessageId &&
                            isset($event->delta)
                        )
                        ->pluck('delta')
                        ->implode('');

                    /**
                     * Per default, the Laravel AI SDK will persist a text composed of all steps the model takes as the
                     * message content. We only want the final result, since the UI is supplemented with the tool
                     * outputs already. Here we override the persistent message accordingly.
                     */
                    $message = ConversationMessage::where('content', $response->text)
                        ->latest('created_at')
                        ->first();
                    $message?->update([
                        'content' => $finalText,
                    ]);
                    $response->text = $finalText;
                    $this->handleResponse($response, $routed['tokens'] ?? -1, $capabilities ?? []);
                });

            foreach ($stream as $stream_event) {
                if ($stream_event instanceof ToolCall) {
                    event(new AssistantStreamBroadcast(
                        conversationId: $this->conversationId,
                        message: 'Running'.$stream_event->toolCall->name,
                    ));
                }

                if ($stream_event instanceof ToolResult) {
                    event(new AssistantStreamBroadcast(
                        conversationId: $this->conversationId,
                        message: $stream_event->toolResult->name.': Done',
                    ));
                }
            }

        } catch (Throwable $e) {
            $this->handleFailure($e);

            throw $e;
        }
    }

    /**
     * Run a user-configured OpenAI-compatible provider.
     */
    protected function runExternalModel(
        User $user,
        ExternalLLM $model,
    ): void {
        $providerName = "adhoc-{$model->id}";

        /*
         * Temporarily append config for the context of this job to allow execution at arbitrary providers.
         */
        config([
            "ai.providers.{$providerName}" => [
                'driver' => 'openai-compatible',
                'key' => $model->token,
                'url' => $model->url,

                'models' => [
                    'text' => [
                        'default' => $model->name,
                    ],
                ],
            ],
        ]);

        Log::debug('Starting external AI assistant', [
            'user_id' => $this->userId,
            'conversation_id' => $this->conversationId,
            'model_id' => $model->id,
            'provider' => $providerName,
            'model' => $model->name,
            'url' => $model->url,
        ]);

        if (config('ai.tool_routing.enabled')) {
            $routed = app(AssistantToolRouter::class)
                ->route($this->prompt, $this->conversationId);
            $capabilities = array_keys($routed['capabilities']);
            $agent = new UserAssistant($user, max_steps: $this->maxSteps, selectedCapabilities: $capabilities);
        } else {
            $agent = new UserAssistant($user, max_steps: $this->maxSteps);
        }

        try {
            /*
             * Only update last_used_at once the job actually executes.
             */
            $model->forceFill([
                'last_used_at' => now(),
            ])->save();

            $stream = ($agent)
                ->continue(
                    $this->conversationId,
                    as: $user,
                )
                ->stream($this->prompt, provider: $providerName, timeout: $this->agentTimeout)
                ->then(function (StreamedAgentResponse $response) {
                    $events = $response->events;
                    // Collect only text deltas belonging to the final message.
                    $finalMessageId = $events
                        ->filter(fn ($event) => isset($event->messageId))
                        ->last()
                        ->messageId;

                    $finalText = $events
                        ->filter(fn ($event) => isset($event->messageId) &&
                            $event->messageId === $finalMessageId &&
                            isset($event->delta)
                        )
                        ->pluck('delta')
                        ->implode('');

                    /**
                     * Per default, the Laravel AI SDK will persist a text composed of all steps the model takes as the
                     * message content. We only want the final result, since the UI is supplemented with the tool
                     * outputs already. Here we override the persistent message accordingly.
                     */
                    $message = ConversationMessage::where('content', $response->text)
                        ->latest('created_at')
                        ->first();
                    $message?->update([
                        'content' => $finalText,
                    ]);
                    $response->text = $finalText;
                    $this->handleResponse($response, $routed['tokens'] ?? -1, $capabilities ?? []);
                });

            foreach ($stream as $stream_event) {
                if ($stream_event instanceof ToolCall) {
                    event(new AssistantStreamBroadcast(
                        conversationId: $this->conversationId,
                        message: 'Running '.$stream_event->toolCall->name,
                    ));
                }

                if ($stream_event instanceof ToolResult) {
                    event(new AssistantStreamBroadcast(
                        conversationId: $this->conversationId,
                        message: $stream_event->toolResult->name.': Done',
                    ));
                }
            }

        } catch (Throwable $e) {
            $this->handleFailure($e);

            throw $e;
        }
    }

    protected function handleResponse(StreamedAgentResponse $response, int $router_tokens = 0, $capabilities = []): void
    {
        $conversation = Conversation::findOrFail($this->conversationId);

        $toolCalls = collect($response->toolResults)
            ->map(fn ($call) => [
                'name' => $call->name,
                'arguments' => $call->arguments,
            ])
            ->values()
            ->all();

        $meta = $response->meta?->toArray() ?? [];

        $meta['tools'] = $toolCalls;
        $meta['usage'] = $response->usage?->toArray();
        $meta['usage']['router'] = $router_tokens;

        if ($this->tempID != 'None') {
            $conversation->messages()->delete($this->tempID);
        }

        $message = [
            'id' => Uuid::uuid7(),
            'role' => 'assistant',
            'content' => $response->text,
            'created_at' => now(),
            'tool_results' => $response->toolResults,
            'meta' => $meta,
        ];

        if (config('ai.tool_routing.enabled')) {
            $message['capabilities'] = $capabilities;
        }

        event(new AssistantMessageCompleted(
            conversationId: $conversation->id,
            message: $message,
        ));
    }

    /**
     * Handle an agent failure.
     */
    protected function handleFailure(Throwable $e): void
    {
        Log::error('AI assistant failed', [
            'user_id' => $this->userId,
            'conversation_id' => $this->conversationId,
            'model_id' => $this->modelId,
            'exception' => $e,
        ]);
    }

    /**
     * Called when the job permanently fails.
     */
    public function failed(Throwable $exception): void
    {
        Log::error('RunUserAssistant permanently failed', [
            'user_id' => $this->userId,
            'conversation_id' => $this->conversationId,
            'model_id' => $this->modelId,
            'exception' => $exception,
        ]);

        // Send a notification to the user session which will present as a message
        event(new AssistantMessageCompleted(
            conversationId: $this->conversationId,
            message: [
                'id' => Uuid::uuid7(),
                'role' => 'assistant',
                'content' => "No response from LLM. Please verify your model configuration or notify your system administrator.
                    \n Conversation ID: _{$this->conversationId}_",
                'created_at' => now(),
                'tool_calls' => [],
                'meta' => [],
                'is_system' => true,
                'level' => 'danger',
            ],
        ));
    }
}
