import { useState } from 'react';
import type { ToolCall as ToolCallData } from '@/types/assistant';

interface Props {
    toolCall: ToolCallData;
}

const tool_map: Record<string, string> = {
    "AssemblySearchTool": 'database_search',
    "RetrieveBuscoTool": 'database_search',
    "RetrieveRepeatmaskerTool": 'database_search',
    "BookmarkTool": 'person_edit',
}

export default function ToolCall({ toolCall }: Props) {
    const [open, setOpen] = useState(false);

    const isJSON = (s: string) => {
        try {
            JSON.parse(s);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <div className="rounded border">
            <button type="button" className="btn btn-link text-decoration-none w-100 text-start" onClick={() => setOpen(!open)}>
                <span className="me-1">
                    <span className="material-symbols-outlined">{tool_map[toolCall.name] ||  '🔧'}</span>
                </span>
                <strong>{toolCall.name}</strong>
                <span className="float-end">{open ? '▴' : '▾'}</span>
            </button>

            {open && (
                <div className="border-top p-3">
                    <div className="mb-3">
                        <strong>Arguments</strong>
                        <pre className="bg-light small mt-2 rounded p-2">{JSON.stringify(toolCall.arguments, null, 2)}</pre>
                    </div>

                    {toolCall.result !== undefined && (
                        <div>
                            <strong>Result</strong>
                            <pre className="bg-light small mt-2 rounded p-2">{isJSON(toolCall.result) && JSON.stringify(JSON.parse(toolCall.result), null, 2) || toolCall.result}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
