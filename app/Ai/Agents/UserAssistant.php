<?php

namespace App\Ai\Agents;

use App\Ai\Tools\AssemblySearchTool;
use Laravel\Ai\Contracts\Agent;
use Laravel\Ai\Contracts\Conversational;
use Laravel\Ai\Contracts\HasTools;
use Laravel\Ai\Contracts\Tool;
use Laravel\Ai\Messages\Message;
use Laravel\Ai\Promptable;
use Stringable;

class UserAssistant implements Agent, Conversational, HasTools
{
    use Promptable;

    /**
     * Get the instructions that the agent should follow.
     */
    public function instructions(): Stringable|string
    {
        return 'You are a assistant for the exploration of a platform named G-nom used to integrate biological research data with a focus on genomic assemblies and associated analyses. Conduct yourself as a research assistant in a scientific context. Use tools whenever possible. Answer questions regarding genomic assemblies only using tools. Enrich responses with hyperlinks to G-nom resources of available.';
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
        return [
            new AssemblySearchTool,
        ];
    }
}
