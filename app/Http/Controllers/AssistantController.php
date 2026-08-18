<?php

namespace App\Http\Controllers;

use App\Ai\Agents\UserAssistant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AssistantController extends Controller
{
    /**
     * Renders the Chat UI for the assistant
     * @param Request $request
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        return Inertia::render('AssistantPage', [
            'conversations' => $request->user()
                ->conversations()
                ->latest('updated_at')
                ->get(),
        ]);
    }

    /**
     * Renders the chat view for a specific conversation
     * @param Request $request
     * @param string $conversation
     * @return \Inertia\Response
     */
    public function show(Request $request, string $conversation)
    {
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
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'message' => ['required', 'string'],
        ]);

        $response = (new UserAssistant($request->user()))
            ->forUser($request->user())
            ->prompt($request->input('message'));

        return response()->json([
            'conversation_id' => $response->conversationId,
            'text' => $response->text,
        ]);
    }

    public function message(
        Request $request,
        string $conversation
    ) {
        $request->validate([
            'message' => ['required', 'string'],
        ]);

        $conversation = $request->user()
            ->conversations()
            ->findOrFail($conversation);

        $response = (new UserAssistant($request->user()))
            ->continue($conversation->id, as: $request->user())
            ->prompt($request->input('message'));

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

    public function delete(Request $request, string $conversation) {
        $conversation = $request->user()
            ->conversations()
            ->findOrFail($conversation);

        $conversation->delete();
    }
}
