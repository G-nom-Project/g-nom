import { router } from '@inertiajs/react';
import { useState } from 'react';
import Chat from './Assistant/Chat'
import ConversationSidebar from './Assistant/ConversationSidebar';
import { Conversation, Message } from '@/types/assistant';

interface Props {
    conversations: Conversation[];
    conversation?: Conversation | null;
    messages?: Message[];
}

export default function Index({
    conversations: initialConversations,
    conversation: initialConversation = null,
    messages: initialMessages = [],
}: Props) {
    const [conversations, setConversations] = useState(initialConversations);
    const [conversation, setConversation] = useState(initialConversation);
    const [messages, setMessages] = useState(initialMessages);

    const createConversation = async (message: string) => {
        const response = await axios.post(
            route('assistant.store'),
            {
                message,
            }
        );

        router.visit(
            route(
                'assistant.show',
                response.data.conversation_id
            )
        );
    };

    const selectConversation = (id: string) => {
        router.visit(route('assistant.show', id));
    };

    const newConversation = () => {
        router.visit(route('assistant.index'));
    };

    const deleteConversation = async (id: string) => {
        await axios.delete(route('assistant.store') + "/" + id);
        const new_conversations = conversations.filter((conversation) => conversation.id != id);
        if (id === conversation?.id) {
            setConversation(new_conversations[0]);
        }
        setConversations(new_conversations);
    };

    return (
        <div className="d-flex h-100" style={{maxHeight: '100vh'}}>
            <ConversationSidebar
                conversations={conversations}
                activeConversation={conversation?.id ?? null}
                onSelect={selectConversation}
                onNewConversation={newConversation}
                onDelete={deleteConversation}
            />
            <Chat conversation={conversation} messages={messages} onCreateConversation={createConversation} onMessagesChange={setMessages} />
        </div>
    );
}
