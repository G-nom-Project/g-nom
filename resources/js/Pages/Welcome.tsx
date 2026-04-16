import TopBar from '@/Components/TopNavBar';
import { Head } from '@inertiajs/react';
import React from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';

export default function Welcome({ totalAssemblies, taxaWithAssemblies, rootUpdate } : {totalAssemblies: number, taxaWithAssemblies: number, rootUpdate: string}) {
    return (
        <React.Fragment>
            <Head title="Home" />
            <TopBar />
            <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
                <Container fluid className="bg-light py-5 text-center">
                    <h1 className="display-4 fw-bold mb-3">G-nom</h1>
                    <p className="lead text-muted mb-4">From sequence to function — explore the genome with ease.</p>

                    <Row className="justify-content-center mb-4">
                        <Col md={4}>
                            <Button href="/assemblies" variant="primary" size="lg" className="w-100 mb-3">
                                🔍 Search Assemblies
                            </Button>
                        </Col>
                        <Col md={4}>
                            <Button href="/tol" variant="outline-secondary" size="lg" className="w-100 mb-3">
                                🌳 Browse the Tree of Life
                            </Button>
                        </Col>
                    </Row>

                    <Card className="mx-auto border-0 shadow-sm" style={{ maxWidth: '700px' }}>
                        <Card.Body>
                            <Card.Title className="h5">Statistics</Card.Title>
                            <Card.Text className="text-muted">
                                Total assemblies: <strong>{totalAssemblies}</strong>
                                <br />
                                Taxa with assemblies: <strong>{taxaWithAssemblies}</strong>
                                <br />
                                Last NCBI ID sync : <strong>{rootUpdate}</strong>
                                <br />
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </React.Fragment>
    );
}
