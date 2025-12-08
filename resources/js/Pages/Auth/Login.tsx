import { useForm } from '@inertiajs/react';
import { Alert, Button, Card, Form } from 'react-bootstrap';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <Card className="mx-auto mt-5" style={{ maxWidth: '400px' }}>
            <Card.Body>
                <h3 className="mb-4 text-center">Sign In</h3>

                {status && <Alert variant="success">{status}</Alert>}

                <Form onSubmit={submit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            isInvalid={!!errors.email}
                            autoFocus
                        />
                        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
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
                        {canResetPassword && <a href={route('password.request')}>Forgot your password?</a>}
                        <Button type="submit" disabled={processing}>
                            Login
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
}
