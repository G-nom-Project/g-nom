import axios from 'axios';
import { useState } from 'react';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import { Conversation, Message } from '@/types/assistant';

interface Props {
    conversation: Conversation | null;
    messages: Message[];
    onCreateConversation: (message: string) => Promise<void>;
    onMessagesChange: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function Chat({ conversation, messages, onCreateConversation, onMessagesChange }: Props) {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendMessage = async (content: string) => {
        setSending(true);
        setError(null);

        const userMessage: Message = {
            id: `temporary-${Date.now()}`,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        };

        onMessagesChange((current) => [...current, userMessage]);

        try {
            if (!conversation) {
                await onCreateConversation(content);
                return;
            }

            const response = await axios.post(route('assistant.message', conversation.id), {
                message: content,
            });

            const assistantMessage: Message = {
                id: `temporary-${Date.now()}-assistant`,
                role: 'assistant',
                content: response.data.text,
                created_at: new Date().toISOString(),
                meta: response.data.meta,
            };

            onMessagesChange((current) => [...current, assistantMessage]);
        } catch (error) {
            console.error(error);

            setError('Something went wrong while sending your message.');

            onMessagesChange((current) => current.filter((message) => message.id !== userMessage.id));
        } finally {
            setSending(false);
        }
    };

    return (
        <main className="flex-grow-1 d-flex flex-column min-vh-100">
            <div className="border-bottom p-3">
                <h5 className="mb-0">{conversation?.title ?? 'G-nom Assistant'}</h5>
            </div>

            <MessageList messages={messages} sending={sending} />

            {error && <div className="alert alert-danger mx-3 mb-2">{error}</div>}

            <MessageInput onSend={sendMessage} disabled={sending} />
        </main>
    );
}
