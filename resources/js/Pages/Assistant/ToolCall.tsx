import { useState } from 'react';
import type { ToolCall as ToolCallData } from '@/types/assistant';

interface Props {
    toolCall: ToolCallData;
}

export default function ToolCall({ toolCall }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <div className="mb-2 rounded border">
            <button type="button" className="btn btn-link text-decoration-none w-100 text-start" onClick={() => setOpen(!open)}>
                <span className="me-2">🔧</span>

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

                            <pre className="bg-light small mt-2 rounded p-2">{JSON.stringify(toolCall.result, null, 2)}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
