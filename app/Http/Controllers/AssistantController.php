<?php

namespace App\Http\Controllers;

use App\Ai\Agents\UserAssistant;
use App\Models\ExternalLLM;
use App\Services\ApplicationModeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AssistantController extends Controller
{
    /**
     * Renders the Chat UI for the assistant
     *
     * @return Response
     */
    public function index(Request $request)
    {
        $models = [];
        if (app(ApplicationModeService::class)->isBYOMEnabled()) {
            $models = ExternalLLM::where('user_id', Auth::id())->orderBy('last_used_at', 'desc')->get();
        }

        if (app(ApplicationModeService::class)->isInternalAiEnabled()) {
            $models[] = ['name' => 'G-nom Internal', 'id' => -1];
        }

        return Inertia::render('AssistantPage', [
            'conversations' => $request->user()
                ->conversations()
                ->latest('updated_at')
                ->get(),
            'models' => $models,
        ]);
    }

    /**
     * Renders the chat view for a specific conversation
     *
     * @return Response
     */
    public function show(Request $request, string $conversation)
    {
        $models = [];
        if (app(ApplicationModeService::class)->isBYOMEnabled()) {
            $models = ExternalLLM::where('user_id', Auth::id())->orderBy('last_used_at', 'desc')->get();
        }

        if (app(ApplicationModeService::class)->isInternalAiEnabled()) {
            $models[] = ['name' => 'G-nom Internal', 'id' => -1];
        }

        $conversation = $request->user()
            ->conversations()
            ->findOrFail($conversation);

        return Inertia::render('AssistantPage', [
            'conversations' => $request->user()
                ->conversations()
                ->latest('updated_at')
                ->get(),
            'conversation' => $conversation,
            'messages' => $conversation->messages,
            'models' => $models,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string'],
            'model_id' => ['required', 'integer'],
        ]);

        if ($validated['model_id'] != -1) {

            /**
             * This temporarily injects a new AI provider into the global config, used to perform a given query
             * against a user-provided provider URL and API key. This is a workaround since Laravel's AI package
             * does not support ephemeral AI Providers.
             * See:
             * https://github.com/laravel/ai/pull/352
             * https://github.com/laravel/ai/issues/105
             *
             * This will be updated if the feature is added to Laravel's AI package.
             */
            $model = ExternalLLM::where('id', $validated['model_id'])->firstOrFail();
            config(["ai.providers.adhoc-{$model->id}" => [
                'driver' => 'openai-compatible',
                'key' => $model->token,
                'url' => $model->url,
                'models' => [
                    'text' => [
                        'default' => $model->name,
                    ],
                ],
            ]]);

            $response = (new UserAssistant($request->user()))
                ->forUser($request->user())
                ->prompt($request->input('message'), provider: "adhoc-{$model->id}");

            $model->last_used_at = now();
            $model->save();

        } else {
            $response = (new UserAssistant($request->user()))
                ->forUser($request->user())
                ->prompt($request->input('message'));
        }

        return response()->json([
            'conversation_id' => $response->conversationId,
            'text' => $response->text,
        ]);
    }

    public function message(
        Request $request,
        string $conversation
    ) {
        $validated = $request->validate([
            'message' => ['required', 'string'],
            'model_id' => ['required', 'integer'],
        ]);

        $conversation = $request->user()
            ->conversations()
            ->findOrFail($conversation);

        if ($validated['model_id'] != -1) {

            /**
             * This temporarily injects a new AI provider into the global config, used to perform a given query
             * against a user-provided provider URL and API key. This is a workaround since Laravel's AI package
             * does not support ephemeral AI Providers.
             * See:
             * https://github.com/laravel/ai/pull/352
             * https://github.com/laravel/ai/issues/105
             *
             * This will be updated if the feature is added to Laravel's AI package.
             */
            $model = ExternalLLM::where('id', $validated['model_id'])->firstOrFail();
            config(["ai.providers.adhoc-{$model->id}" => [
                'driver' => 'openai-compatible',
                'key' => $model->token,
                'url' => $model->url,
                'models' => [
                    'text' => [
                        'default' => $model->name,
                    ],
                ],
            ]]);

            $response = (new UserAssistant($request->user()))
                ->continue($conversation->id, as: $request->user())
                ->prompt($request->input('message'), provider: "adhoc-{$model->id}");

            $model->last_used_at = now();
            $model->save();

        } else {
            $response = (new UserAssistant($request->user()))
                ->continue($conversation->id, as: $request->user())
                ->prompt($request->input('message'));
        }

        $tool_calls = collect($response->toolResults)
            ->map(fn ($call) => [
                'name' => $call->name,
                'arguments' => $call->arguments,
            ])
            ->values();

        return response()->json([
            'conversation_id' => $response->conversationId,
            'text' => $response->text,
            'tools' => $tool_calls,
            'meta' => $response->meta,
            'usage' => $response->usage,
        ]);
    }

    public function delete(Request $request, string $conversation)
    {
        $conversation = $request->user()
            ->conversations()
            ->findOrFail($conversation);

        $conversation->delete();
    }

    public function storeModel(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string'],
            'url' => ['required', 'string'],
            'token' => ['required', 'string'],
        ]);

        $model = new ExternalLLM;
        $model->name = $validated['name'];
        $model->url = $validated['url'];
        $model->token = $validated['token'];
        $model->user_id = Auth::user()->id;
        $model->last_used_at = now();
        $model->save();
    }

    public function deleteModel(Request $request, $id)
    {
        ExternalLLM::destroy($id);
    }
}
