import { Conversation } from '@/types/assistant';

interface Props {
    conversations: Conversation[];
    activeConversation: string | null;
    onSelect: (id: string) => void;
    onNewConversation: () => void;
    onDelete: (id: string) => void;
}

export default function ConversationSidebar({
                                                conversations,
                                                activeConversation,
                                                onSelect,
                                                onNewConversation,
                                                onDelete,
                                            }: Props) {
    return (
        <aside className="border-end d-flex flex-column">
            <div className="border-bottom d-flex align-items-center gap-2 p-3">
                <img
                    src="/images/searching.png"
                    style={{
                        height: '1.4rem',
                        transform: 'scale(2.5)',
                        marginInlineEnd: '0.5rem',
                    }}
                />
                {' '}
                <h5 className="mb-0" style={{ paddingTop: '0.25rem', paddingBottom: '0.21rem' }}>
                    G-nom Agent workspace
                </h5>
            </div>
            <div className="border-bottom p-3">
                <button type="button" className="btn btn-primary w-100" onClick={onNewConversation}>
                    + New conversation
                </button>
            </div>

            <div className="flex-grow-1 overflow-auto">
                {conversations.length === 0 ? (
                    <div className="text-muted p-3 text-center">No conversations yet.</div>
                ) : (
                    <div className="list-group list-group-flush">
                        {conversations.map((item) => {
                            const active = activeConversation === item.id;

                            return (
                                <div key={item.id} className={['conversation-item', active ? 'active' : ''].join(' ')}>
                                    <button
                                        type="button"
                                        className={['list-group-item', 'list-group-item-action', 'w-100', 'text-start', active ? 'active' : ''].join(
                                            ' ',
                                        )}
                                        onClick={() => onSelect(item.id)}
                                    >
                                        <div className="text-truncate pe-4">{item.title ?? 'New conversation'}</div>

                                        <small className={active ? 'text-white-50' : 'text-muted'}>{formatDate(item.updated_at)}</small>
                                    </button>

                                    <button
                                        type="button"
                                        className="conversation-delete btn btn-sm"
                                        aria-label={`Delete ${item.title ?? 'conversation'}`}
                                        onClick={() => onDelete(item.id)}
                                    >
                                        <i className="bi bi-x-lg" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(date));
}
