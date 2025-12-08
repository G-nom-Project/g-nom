import { usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, Button, Table, Form, Modal, Row, Col, Badge } from 'react-bootstrap';

export default function ApiTokens() {
    const page = usePage();
    const tokens = page.props.tokens ?? [];
    const plainTextToken = page.props.flash?.plainTextToken ?? null;

    const [name, setName] = useState('');
    const [showModal, setShowModal] = useState(!!plainTextToken);

    const RESOURCES = ['assemblies', 'taxon'];
    const ACTIONS = ['read', 'write', 'delete'];
    const [abilities, setAbilities] = useState([]);

    const toggleAbility = (resource, action) => {
        const ability = `${action}:${resource}`;

        setAbilities(prev =>
            prev.includes(ability)
                ? prev.filter(a => a !== ability)
                : [...prev, ability]
        );
    };

    const createToken = (e) => {
        e.preventDefault();

        router.post('/api-tokens', { name, abilities }, {
            preserveScroll: true,
            onSuccess: (page) => {
                setName('');
                setAbilities([]);

                // If the server flashed a token, open modal
                if (page.props.flash?.plainTextToken) {
                    setShowModal(true);
                }
            }
        });
    };

    const deleteToken = (id) => {
        router.delete(`/api-tokens/${id}`, {
            preserveScroll: true,
        });
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">API Tokens</h2>

            <Card className="mb-4">
                <Card.Body>
                    <h4>Create API Token</h4>
                    <Form onSubmit={createToken}>
                        <Row className="mb-3">
                            <Col md={6}>
                                <Form.Label>Token Name</Form.Label>
                                <Form.Control
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="My App Token"
                                    required
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                {RESOURCES.map(resource => (
                                    <div key={resource} className="mb-2">
                                        <strong>{resource}</strong>
                                        <div>
                                            {ACTIONS.map(action => {
                                                const ability = `${action}:${resource}`;
                                                return (
                                                    <Form.Check
                                                        inline
                                                        key={ability}
                                                        label={action}
                                                        type="checkbox"
                                                        checked={abilities.includes(ability)}
                                                        onChange={() => toggleAbility(resource, action)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                            </Col>
                        </Row>

                        <Button type="submit">Create Token</Button>
                    </Form>
                </Card.Body>
            </Card>
            <Card>
                <Card.Body>
                    <h4>Your Tokens</h4>
                    <Table bordered responsive className="mt-3">
                        <thead>
                        <tr>
                            <th>Name</th>
                            <th>Abilities</th>
                            <th>Last Used</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {tokens.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center">
                                    No tokens created yet.
                                </td>
                            </tr>
                        )}

                        {tokens.map((t) => (
                            <tr key={t.id}>
                                <td>{t.name}</td>
                                <td>
                                    {t.abilities.map((a) => (
                                        <Badge bg="secondary" key={a} className="me-1">
                                            {a}
                                        </Badge>
                                    ))}
                                </td>
                                <td>
                                    {t.last_used_at
                                        ? new Date(t.last_used_at).toLocaleString()
                                        : 'Never'}
                                </td>
                                <td>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => deleteToken(t.id)}
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>
            <Modal show={showModal && !!plainTextToken} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Your New API Token</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>
                        Copy your token now. For security reasons, you will
                        <strong> not </strong>
                        be able to see it again.
                    </p>
                    <pre className="p-3 bg-light border rounded">
                        {plainTextToken}
                    </pre>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={() => setShowModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
