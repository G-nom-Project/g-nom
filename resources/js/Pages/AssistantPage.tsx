import { router } from '@inertiajs/react';
import { useState } from 'react';
import Chat from './Assistant/Chat'
import ConversationSidebar from './Assistant/ConversationSidebar';
import { Conversation, Message, Model } from '@/types/assistant';

interface Props {
    conversations: Conversation[];
    conversation?: Conversation | null;
    messages?: Message[];
    models?: Model[]
    routing?: boolean;
    settings?: {model_id: number, max_steps: number, research_depth: number, external_llms_id: number};
}

export default function Index({
    conversations: initialConversations,
    conversation: initialConversation = null,
    messages: initialMessages = [],
    models,
    routing,
    settings,
}: Props) {
    const [conversations, setConversations] = useState(initialConversations);
    const [conversation, setConversation] = useState(initialConversation);
    const [messages, setMessages] = useState(initialMessages);
    console.log(settings);

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
            <Chat
                conversation={conversation}
                messages={messages}
                onMessagesChange={setMessages}
                models={models}
                routing={routing}
                max_steps={settings?.max_steps}
                research_depth={settings?.research_depth}
                external_model_id={settings?.external_llms_id}
            />
        </div>
    );
}
