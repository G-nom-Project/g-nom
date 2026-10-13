<?php

namespace App\Ai\Agents;

use App\Ai\AssistantCapability;
use Illuminate\Contracts\JsonSchema\JsonSchema;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasStructuredOutput;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;

/**
 * Custom AI agent to decide which tools are required to fulfill a given query.
 */
class ToolRouter implements Agent, Conversational, HasStructuredOutput, HasTools
{
    use Promptable;

    public function instructions(): string
    {

        $capabilities = collect(AssistantCapability::cases())
            ->map(fn (AssistantCapability $capability) => "- {$capability->value}: {$capability->description()}"
            )
            ->implode("\n");

        return <<<PROMPT
        You are the routing component of the G-nom research assistant.

        Determine which capabilities are potentially needed to answer the user's
        request.

        Select all capabilities that may be useful. Capabilities are not mutually
        exclusive.

        If the request does not require G-nom research capabilities, return an empty
        list.

        Available capabilities:

        {$capabilities}

        Do not answer the user's question. Only classify which capabilities are
        needed.
        PROMPT;
    }

    /**
     * Get the list of messages comprising the conversation so far.
     *
     * @return Message[]
     */
    public function messages(): iterable
    {
        return [];
    }

    /**
     * Get the tools available to the agent.
     *
     * @return Tool[]
     */
    public function tools(): iterable
    {
        return [];
    }

    /**
     * Get the agent's structured output schema definition.
     */
    public function schema(JsonSchema $schema): array
    {
        return [
            'capabilities' => $schema->array()
                ->items($schema->string())
                ->required(),
        ];
    }
}
