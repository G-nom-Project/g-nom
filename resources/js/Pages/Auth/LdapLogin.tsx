import { useForm } from '@inertiajs/react';
import { Alert, Button, Card, Form } from 'react-bootstrap';

export default function LdapLogin({ status, canResetPassword, ldap_enabled, ldap_login_banner }) {
    const { data, setData, post, processing, errors } = useForm({
        uid: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('ldap.login'));
    };

    return (
        <div style={{ minHeight: '80vh' }}>
            <Card className="mx-auto mt-5" style={{ maxWidth: '400px' }}>
                <Card.Body>
                    <h3 className="mb-4 text-center">{ldap_login_banner}</h3>

                    {status && <Alert variant="success">{status}</Alert>}

                    <Form onSubmit={submit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                value={data.uid}
                                onChange={(e) => setData('uid', e.target.value)}
                                isInvalid={!!errors.uid}
                                autoFocus
                            />
                            <Form.Control.Feedback type="invalid">{errors.uid}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                isInvalid={!!errors.password}
                            />
                            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Check
                                type="checkbox"
                                label="Remember me"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                            />
                        </Form.Group>

                        <div className="d-flex justify-content-between align-items-center">
                            <Button type="submit" disabled={processing}>
                                Login
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}
