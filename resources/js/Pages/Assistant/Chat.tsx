import axios from 'axios';
import { useEffect, useState } from 'react';
import MessageInput from './MessageInput';
import MessageList from './MessageList';
import { Conversation, Message, Model } from '@/types/assistant';
import { Button, ButtonGroup, Dropdown, DropdownButton, Form, InputGroup, Modal, ToggleButton } from 'react-bootstrap';
import { router } from '@inertiajs/react';
import echo from '@/echo';


interface Props {
    conversation: Conversation | null;
    messages: Message[];
    onMessagesChange: React.Dispatch<React.SetStateAction<Message[]>>;
    models: Model[];
    routing: boolean;
    max_steps?: number;
    research_depth?: number;
    external_model_id?: number;
}

export default function Chat({ conversation, messages, onMessagesChange, models, routing, max_steps, research_depth, external_model_id }: Props) {
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showModelModal, setShowModelModal] = useState(false);
    const [showModeModal, setShowModeModal] = useState(false);
    const [events, setEvents] = useState<string[]>([]);

    const [model, setModel] = useState<Model|undefined>();
    const [currSteps, setCurrSteps] = useState<number>(max_steps || 5);
    const [isDeepResearch, setIsDeepResearch] = useState<boolean>(research_depth && research_depth > 10 || false);

    const handleClose = () => setShowModelModal(false);
    const [validated, setValidated] = useState(false);
    const [newModelName, setNewModelName] = useState('');
    const [newModelURL, setNewModelURL] = useState('');
    const [newModelToken, setNewModelToken] = useState('');
    const [hasSubscribed, setHasSubscribed] = useState(false);

    const handle_update_settings = async () => {
        if (conversation) {
            if (model?.id != -1) {
                await axios.post(route('conversation.settings', [conversation.id]), {
                    steps: currSteps,
                    research_depth: (isDeepResearch && 20) || 10,
                    external_model_id: model?.id
                });
            } else {
                await axios.post(route('conversation.settings', [conversation.id]), {
                    steps: currSteps,
                    research_depth: (isDeepResearch && 20) || 10,
                });
            }

        }
        setShowModeModal(false);
    };

    useEffect(() => {
        if (external_model_id) {
            const model = models.find((model) => model.id === external_model_id);
            setModel(model);
        } else {
            setModel(models[models.length-1]);
        }
    }, [external_model_id]);

    useEffect(() => {
        if (!conversation) {
            return;
        }

        const channelName = `conversation.${conversation.id}`;
        const channel = echo.private(channelName);

        channel.subscribed(() => {
            console.log('SUCCESSFULLY SUBSCRIBED:', channelName);
            setHasSubscribed(true);
        });

        channel.error((error) => {
            console.error('CHANNEL ERROR:', error);
        });

        channel.listen('.assistant.message.completed', (event: { conversation_id: number; message: Message }) => {
            setEvents([]);
            onMessagesChange((current) => [...current, event.message]);
            setSending(false);
        });

        return () => {
            echo.leave(channelName);
        };
    }, [conversation?.id]);

    // Streaming Tool events
    useEffect(() => {
        if (!conversation) {
            return;
        }

        const streamChannelName = `conversation.${conversation.id}.stream`;
        const channel = echo.private(streamChannelName);

        channel.subscribed(() => {
            console.log('SUCCESSFULLY SUBSCRIBED:', streamChannelName);
        });

        channel.error((error) => {
            console.error('CHANNEL ERROR:', error);
        });

        channel.listen('.assistant.message.stream', (event: { conversation_id: number; message: string }) => {
            setEvents([...events, event.message]);
        });

        return () => {
            echo.leave(streamChannelName);
        };
    }, [conversation?.id]);

    const createConversation = async (message: string) => {
        if (model?.id != -1) {
            const response = await axios.post(route('assistant.store'), {
                message,
                model_id: model.id,
                max_steps: currSteps,
                research_depth: (isDeepResearch && 20) || 10,
                external_model_id: model?.id,
            });
            router.visit(route('assistant.show', response.data.conversation_id));
        } else {
            const response = await axios.post(route('assistant.store'), {
                message,
                model_id: model.id,
                max_steps: currSteps,
                research_depth: (isDeepResearch && 20) || 10,
            });
            router.visit(route('assistant.show', response.data.conversation_id));
        }
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

            await axios.post(route('assistant.message', conversation.id), {
                message: content,
                model_id: model.id,
            });

        } catch (error) {
            console.error(error);
            setError('Something went wrong while sending your message.');
            onMessagesChange((current) => current.filter((message) => message.id !== userMessage.id));
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
                <h5 className="mb-0 text-truncate flex-grow-2" style={{maxWidth: '55%'}}>{conversation?.title ?? 'G-nom Assistant'}</h5>
                <div className="ms-auto" onClick={() => setShowModeModal(true)}>
                    <code>
                        <span className="material-symbols-outlined">smart_toy</span> <span className="editable-code-box">{model && model.name}</span>
                    </code>
                    {'  '}
                    <code>
                        <span className="material-symbols-outlined">step</span> <span className="editable-code-box">{currSteps} steps</span>
                    </code>
                    {'  '}
                    <code>
                        <span className="material-symbols-outlined">book_5</span>{' '}
                        <span className="editable-code-box">{(isDeepResearch && 'Deep') || 'Shallow'} research</span>
                    </code>
                    {'  '}
                    {routing && (
                        <code>
                            <span className="material-symbols-outlined">category</span>{' '}
                            <span className="editable-code-box">Routing enabled</span>
                        </code>
                    )}
                </div>
            </div>

            <Modal show={showModeModal} onHide={() => handle_update_settings()}>
                <Modal.Header closeButton>Update model settings</Modal.Header>
                <Modal.Body>
                    <b>
                        <span className="material-symbols-outlined">smart_toy</span> Select Model
                    </b>
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
                    <br />
                    <b>
                        <span className="material-symbols-outlined">step</span> Max Steps
                    </b>{' '}
                    ({currSteps})
                    <Form.Range min={1} max={20} defaultValue={5} onChange={(e) => setCurrSteps(e.target.value)} />
                    <br />
                    <b>
                        <span className="material-symbols-outlined">book_5</span> Research Mode
                    </b>
                    <br />
                    <ButtonGroup style={{ width: '100%' }} className="mt-2">
                        <ToggleButton
                            id="toggle-check"
                            type="checkbox"
                            variant="primary"
                            value="1"
                            checked={!isDeepResearch}
                            onClick={() => setIsDeepResearch(false)}
                        >
                            Shallow
                        </ToggleButton>
                        <ToggleButton
                            id="toggle-check"
                            type="checkbox"
                            variant="primary"
                            value="1"
                            checked={isDeepResearch}
                            onClick={() => setIsDeepResearch(true)}
                        >
                            Deep
                        </ToggleButton>
                    </ButtonGroup>
                </Modal.Body>
            </Modal>

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

            <MessageList messages={messages} sending={sending} has_subscribed={hasSubscribed} events={events} />

            {error && <div className="alert alert-danger mx-3 mb-2">{error}</div>}

            <MessageInput onSend={sendMessage} disabled={sending} />
        </main>
    );
}
