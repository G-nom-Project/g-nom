import { useEffect, useRef } from 'react';

import ToolCall from './ToolCall';
import MarkdownMessage from './MarkdownMessage';
import { Message } from '@/types/assistant';

interface Props {
    messages: Message[];
    sending: boolean;
    has_subscribed: boolean;
}

export default function MessageList({ messages, sending, has_subscribed }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
        });
    }, [messages, sending]);

    if (!sending && !has_subscribed) {
        return (
            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
                <div className="text-muted text-center">
                    <h4>G-nom Assistant</h4>

                    <p className="mb-0">Ask me about genomic assemblies, analyses, or other G-nom data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-grow-1 overflow-auto p-4">
            <div className="mx-auto" style={{ maxWidth: '900px' }}>
                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {(sending || messages.length === 0) && (
                    <div className="d-flex mb-4">
                        <div className="bg-light rounded px-3 py-2">
                            <span className="text-muted">Agent is working...</span>
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>
        </div>
    );
}

function MessageBubble({ message }: { message: Message }) {
    const isUser = message.role === 'user';
    const isSystem = message.is_system;

    const bg = (isSystem && 'bg-danger text-white' || isUser && 'bg-primary text-white' || 'bg-light')

    return (
        <div className={['d-flex', 'mb-4', isUser ? 'justify-content-end' : 'justify-content-start'].join(' ')}>
            <div
                className={['rounded', 'px-3', 'py-2', bg].join(' ')}
                style={{
                    maxWidth: '80%',
                    whiteSpace: 'pre-wrap',
                }}
            >
                {!isUser && (
                    <div className="fw-bold mb-1">
                        {(isSystem && 'G-nom System') || (
                            <>
                                G-nom Assistant (<code>{message.meta['model']}</code>
                                {' / '}
                                {(message.meta.usage && (
                                    <code>{message.meta.usage.completion_tokens + message.meta.usage.prompt_tokens} tokens</code>
                                )) ||
                                    (message.usage && <code>{message.usage.completion_tokens + message.usage.prompt_tokens} tokens</code>)}
                                )
                            </>
                        )}
                    </div>
                )}
                {message.tool_calls?.map((toolCall) => (
                    <ToolCall key={toolCall.id} toolCall={toolCall} />
                ))}

                {isUser ? <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div> : <MarkdownMessage content={message.content} />}
            </div>
        </div>
    );
}
