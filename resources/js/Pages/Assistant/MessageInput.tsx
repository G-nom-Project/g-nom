import { FormEvent, KeyboardEvent, useState } from 'react';

interface Props {
    onSend: (message: string) => Promise<void>;
    disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: Props) {
    const [message, setMessage] = useState('');

    const submit = async () => {
        const content = message.trim();

        if (!content || disabled) {
            return;
        }

        setMessage('');

        try {
            await onSend(content);
        } catch {
            setMessage(content);
        }
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await submit();
    };

    const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();

            await submit();
        }
    };

    return (
        <div className="border-top p-3">
            <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '900px' }}>
                <div className="input-group">
                    <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Ask G-nom..."
                        value={message}
                        disabled={disabled}
                        onChange={(event) => setMessage(event.target.value)}
                        onKeyDown={handleKeyDown}
                    />

                    <button type="submit" className="btn btn-primary" disabled={disabled || message.trim().length === 0}>
                        Send
                    </button>
                </div>

                <small className="text-muted">Enter to send · Shift+Enter for a new line · Information not obtained from tools or context may not be based on the G-nom database</small>
            </form>
        </div>
    );
}
