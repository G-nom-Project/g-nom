import { Head, Link, useForm } from '@inertiajs/react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';
import gnom_logo from '../../../static/logo/gnom.png'
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <Container>
            <Head title="Register" />
            <Card className="mx-auto mt-5" style={{ maxWidth: '400px' }}>
                <Card.Body>
                    <Row>
                        <Col xs={4}>
                            <img src={gnom_logo} style={{ width: '100%' }} />
                        </Col>
                        <Col>
                            <h1>Registration</h1>
                            <hr />
                            You need enable 🍪 to proceed.
                        </Col>
                    </Row>

                    <Form onSubmit={submit}>
                        <Form.Group className="mb-3" controlId="name">
                            <Form.Label>Name</Form.Label>

                            <Form.Control
                                type="text"
                                name="name"
                                value={data.name}
                                autoComplete="name"
                                autoFocus
                                onChange={(e) => setData('name', e.target.value)}
                                isInvalid={!!errors.name}
                                required
                            />

                            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="email">
                            <Form.Label>Email</Form.Label>

                            <Form.Control
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                onChange={(e) => setData('email', e.target.value)}
                                isInvalid={!!errors.email}
                                required
                            />

                            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="password">
                            <Form.Label>Password</Form.Label>

                            <Form.Control
                                type="password"
                                name="password"
                                value={data.password}
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                isInvalid={!!errors.password}
                                required
                            />

                            <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="password_confirmation">
                            <Form.Label>Confirm Password</Form.Label>

                            <Form.Control
                                type="password"
                                name="password_confirmation"
                                value={data.password_confirmation}
                                autoComplete="new-password"
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                isInvalid={!!errors.password_confirmation}
                                required
                            />

                            <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                        </Form.Group>

                        <Row className="align-items-center justify-content-end g-3">
                            <Col xs="auto">
                                <Link href={route('login')} className="text-decoration-underline">
                                    Already registered?
                                </Link>
                            </Col>

                            <Col xs="auto">
                                <Button type="submit" variant="primary" disabled={processing}>
                                    {processing ? 'Registering…' : 'Register'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    );
}
