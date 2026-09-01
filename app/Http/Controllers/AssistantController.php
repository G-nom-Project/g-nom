<?php

namespace App\Http\Controllers;

use App\Jobs\RunUserAssistant;
use App\Models\ExternalLLM;
use App\Services\ApplicationModeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Ramsey\Uuid\Uuid;


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

    /**
     * Create a new conversation from an initial message
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string'],
            'model_id' => ['required', 'integer'],
        ]);

        /**
         * Here we manually create a new conversation, allowing us to pass its ID in the response before the async
         * generation step of the LLM is finished
         */
        $conversation = $request->user()
            ->conversations()
            ->create([
                'id' => Uuid::uuid7(),
                'title' => str($validated['message'])->limit(100),
            ]);


        // Dispatch inference job
        RunUserAssistant::dispatch(
            userId: $request->user()->id,
            conversationId: $conversation->id,
            modelId: $validated['model_id'],
            prompt: $validated['message'],
            maxSteps: 5,
            agentTimeout: 120
        );


        return response()->json([
            'conversation_id' => $conversation->id,
            'queued' => true,
        ]);
    }

    public function message(
        Request $request,
        string $conversation,
    ) {
        $validated = $request->validate([
            'message' => ['required', 'string'],
            'model_id' => ['required', 'integer'],
        ]);

        $conversation = $request->user()
            ->conversations()
            ->findOrFail($conversation);

        RunUserAssistant::dispatch(
            userId: $request->user()->id,
            conversationId: $conversation->id,
            modelId: $validated['model_id'],
            prompt: $validated['message'],
            maxSteps: 5,
            agentTimeout: 120
        );

        return response()->json([
            'queued' => true,
            'conversation_id' => $conversation->id,
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
