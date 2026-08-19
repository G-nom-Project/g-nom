import axios from 'axios';
import { useState } from 'react';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import { Conversation, Message, Model } from '@/types/assistant';
import { Button, Dropdown, DropdownButton, Form, InputGroup, Modal } from 'react-bootstrap';
import { router } from '@inertiajs/react';


interface Props {
    conversation: Conversation | null;
    messages: Message[];
    onMessagesChange: React.Dispatch<React.SetStateAction<Message[]>>;
    models: Model[];
}

export default function Chat({ conversation, messages, onMessagesChange, models }: Props) {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showModelModal, setShowModelModal] = useState(false);

    const [model, setModel] = useState<Model|undefined>(models[0]);

    const handleClose = () => setShowModelModal(false);
    const [validated, setValidated] = useState(false);
    const [newModelName, setNewModelName] = useState('');
    const [newModelURL, setNewModelURL] = useState('');
    const [newModelToken, setNewModelToken] = useState('');

    const createConversation = async (message: string) => {
        const response = await axios.post(route('assistant.store'), {
            message,
            model_id: model.id
        });

        router.visit(route('assistant.show', response.data.conversation_id));
    };

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
                await createConversation(content);
                return;
            }

            const response = await axios.post(route('assistant.message', conversation.id), {
                message: content,
                model_id: model.id
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

    const handleSubmit = (event) => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
        }
        axios.post(route('assistant.store-model'), {
            name: newModelName,
            url: newModelURL,
            token: newModelToken,
        })
        setValidated(true);
    };

    const handleDeleteModel = (id: number) => {
        axios.delete(route('assistant.delete-model', {id: id})).then(() => {
            models = models.filter((model) => model.id !== id);
            if (conversation) {
                router.visit(route('assistant.show', conversation.id));
            }
        })
    }

    return (
        <main className="flex-grow-1 d-flex flex-column min-vh-100">
            <div className="border-bottom d-flex align-items-center gap-2 p-3">
                <h5 className="mb-0">{conversation?.title ?? 'G-nom Assistant'}</h5>
                <DropdownButton size="sm" title={(model && <code className="text-white">{model.name} </code>) || 'Select Model'}>
                    {models &&
                        models.map((model) => (
                            <Dropdown.Item eventKey={model.id} onClick={() => setModel(model)}>
                                {model.name} {model.id != -1 && <i className="bi bi-x-lg" onClick={() => handleDeleteModel(model.id)} />}
                            </Dropdown.Item>
                        ))}
                    {models && <Dropdown.Divider />}
                    <Dropdown.Item eventKey="4">
                        <Button size="sm" className="w-100" onClick={() => setShowModelModal(true)}>
                            Add model
                        </Button>
                    </Dropdown.Item>
                </DropdownButton>
            </div>

            <Modal show={showModelModal} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Modal heading</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        <InputGroup className="mb-3">
                            <InputGroup.Text id="basic-addon1">Model Name</InputGroup.Text>
                            <Form.Control
                                placeholder=""
                                aria-label="Username"
                                aria-describedby="basic-addon1"
                                onChange={(e) => setNewModelName(e.target.value)}
                                isValid={newModelName != ''}
                            />
                            <Form.Control.Feedback type="invalid">Model name is a required field.</Form.Control.Feedback>
                        </InputGroup>
                        <InputGroup className="mb-3">
                            <InputGroup.Text id="basic-addon2">Endpoint URL</InputGroup.Text>
                            <Form.Control
                                placeholder=""
                                aria-label="url"
                                aria-describedby="basic-addon2"
                                onChange={(e) => setNewModelURL(e.target.value)}
                                isValid={newModelURL != ''}
                            />
                        </InputGroup>
                        <InputGroup className="mb-3">
                            <InputGroup.Text id="basic-addon3">Token</InputGroup.Text>
                            <Form.Control
                                type="password"
                                placeholder=""
                                onChange={(e) => setNewModelToken(e.target.value)}
                                isValid={newModelToken != ''}
                            />
                        </InputGroup>
                        <Button type="submit">Save Changes</Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <MessageList messages={messages} sending={sending} />

            {error && <div className="alert alert-danger mx-3 mb-2">{error}</div>}

            <MessageInput onSend={sendMessage} disabled={sending} />
        </main>
    );
}
