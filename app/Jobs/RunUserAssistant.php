<?php

namespace App\Jobs;

use App\Ai\Agents\UserAssistant;
use App\Events\AssistantMessageCompleted;
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
use Laravel\Ai\Responses\AgentResponse;
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
        public readonly string $tempID = 'None'
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
        Log::debug('Starting builtin AI assistant', [
            'user_id' => $this->userId,
            'conversation_id' => $this->conversationId,
        ]);

        try {
            $response = (new UserAssistant($user))
                ->continue(
                    $this->conversationId,
                    as: $user,
                )
                ->prompt($this->prompt);

            $this->handleResponse($response);
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

        try {
            /*
             * Only update last_used_at once the job actually executes.
             */
            $model->forceFill([
                'last_used_at' => now(),
            ])->save();

            $response = (new UserAssistant($user))
                ->continue(
                    $this->conversationId,
                    as: $user,
                )
                ->prompt(
                    $this->prompt,
                    provider: $providerName,
                );

            $this->handleResponse($response);
        } catch (Throwable $e) {
            $this->handleFailure($e);

            throw $e;
        }
    }

    protected function handleResponse(AgentResponse $response): void
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

        if ($this->tempID != 'None') {
            $conversation->messages()->delete($this->tempID);
        }

        event(new AssistantMessageCompleted(
            conversationId: $conversation->id,
            message: [
                'id' => Uuid::uuid7(),
                'role' => 'assistant',
                'content' => $response->text,
                'created_at' => now(),
                'tool_calls' => $response->toolCalls,
                'meta' => $meta,
            ],
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
                'content' =>
                    "No response from LLM. Please verify your model configuration or notify your system administrator.
                    \n Conversation ID: _{$this->conversationId}_",
                'created_at' => now(),
                'tool_calls' => [],
                'meta' => [],
                'is_system' => true,
                'level' => 'danger'
            ],
        ));
    }
}
