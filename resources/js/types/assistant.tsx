export interface Conversation {
    id: string;
    title?: string | null;
    created_at: string;
    updated_at: string;
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
}

export interface Usage {
    prompt_tokens: number;
    completion_tokens: number;
}

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
    tool_results?: ToolCall[];
    usage?: Usage;
    meta: { model: string };
}


