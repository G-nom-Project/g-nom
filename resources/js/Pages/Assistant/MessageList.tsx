import { useEffect, useRef, useState } from 'react';
import ToolCall from './ToolCall';
import MarkdownMessage from './MarkdownMessage';
import { Message } from '@/types/assistant';
import { copyMessage } from '@/utils/text';
import BUSCOCompletenessBar from '@/Components/BUSCOCompletenessBar';
import FCatCompletenessBar from '@/Components/fCatCompletenessBar';

interface Props {
    messages: Message[];
    sending: boolean;
    has_subscribed: boolean;
    events: string[];
}

export default function MessageList({ messages, sending, has_subscribed, events }: Props) {
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
                            <span className="text-muted agent-working"><b>Agent is working...</b></span>
                            {
                                events.map((event) => {
                                    return <div className="text-muted">{event}</div>}
                                )
                            }
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
    const [open, setOpen] = useState(false);

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
                            <div className="message-bubble">
                                G-nom Assistant{' '}
                                <a href="#" onClick={() => copyMessage(message.content)} className="copy-button">
                                    <span className="material-symbols-outlined">content_copy</span>
                                </a>
                                <br />
                                <code>
                                    <span className="material-symbols-outlined">smart_toy</span>
                                    {message.meta['model']}
                                </code>{' '}
                                {(message.meta.usage && (
                                    <code>
                                        <span className="material-symbols-outlined">token</span>
                                        {message.meta.usage.completion_tokens + message.meta.usage.prompt_tokens}
                                    </code>
                                )) ||
                                    (message.usage && (
                                        <code>
                                            <span className="material-symbols-outlined">token</span>
                                            {message.usage.completion_tokens + message.usage.prompt_tokens}
                                        </code>
                                    ))}{' '}
                                {message.capabilities &&
                                    ((message.capabilities.length > 0 && (
                                        <a href={'#'} onClick={() => setOpen(!open)} style={{ textDecoration: 'none' }}>
                                            <code>
                                                <span className="material-symbols-outlined">category</span>
                                                {message.capabilities.length}
                                            </code>
                                        </a>
                                    )) || (
                                        <code>
                                            <span className="material-symbols-outlined">category</span>
                                            {message.capabilities.length}
                                        </code>
                                    ))}{' '}
                                {message.tool_results && message.tool_results.length > 0 && (
                                    <a href={'#'} onClick={() => setOpen(!open)} style={{ textDecoration: 'none' }} className="tool-results-link">
                                        <code>
                                            <span className="material-symbols-outlined">construction</span>
                                            {message.tool_results.length}
                                        </code>
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {open && (
                    <div
                        className="mt-2 rounded p-3 mb-2"
                        style={{
                            border: '1px solid var(--bs-link-color)',
                        }}
                    >
                        {message.capabilities && (
                            <>
                                Capabilities routed:
                                <br />
                                {message.capabilities.map((each) => {
                                    return (
                                        <code>
                                            <span className="editable-code-box me-1">{each}</span>
                                        </code>
                                    );
                                })}
                                <hr />
                            </>
                        )}
                        {message.tool_results?.map((toolCall) => (
                            <ToolCall key={toolCall.id} toolCall={toolCall} />
                        ))}
                    </div>
                )}

                {isUser ? <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div> : <MarkdownMessage content={message.content} />}
                {message.tool_results?.length > 0 && <br/>}
                {message.tool_results?.map((toolCall) => {
                    if (toolCall.name == 'RetrieveBuscoTool') {
                        return <BUSCOCompletenessBar analyses={JSON.parse(toolCall.result)}/>;
                    }
                    if (toolCall.name == 'RetrieveFcatTool' && JSON.parse(toolCall.result).length > 0) {
                        return <FCatCompletenessBar analysis={JSON.parse(toolCall.result)[0]} />;
                    }
                })}
            </div>
        </div>
    );
}
