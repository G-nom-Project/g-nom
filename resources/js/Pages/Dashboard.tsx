import { Head } from '@inertiajs/react';
import { Card, Col, Row } from 'react-bootstrap';

export default function Dashboard() {
    return (
            <>
            <Head title="Dashboard" />
            <div className="container py-4">
                <Row className="g-4">
                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Card 1</Card.Title>
                                <Card.Text>Placeholder content for your dashboard widget.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Card 2</Card.Title>
                                <Card.Text>Another dashboard placeholder card.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* NEW CARD */}
                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>API Tokens</Card.Title>
                                <Card.Text>Generate and manage API tokens for external apps.</Card.Text>
                                <a className="btn btn-primary" href="/api-tokens">Manage Tokens</a>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>


                <Row className="mt-4">
                    <Col>
                        <Card>
                            <Card.Body style={{ minHeight: '300px' }}>
                                <Card.Title>Main Content Area</Card.Title>
                                <Card.Text>Use this space for a larger table, chart, or overview.</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
}
