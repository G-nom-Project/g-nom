import TopBar from '@/Components/TopNavBar';
import { Head } from '@inertiajs/react';
import React from 'react';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import MarkdownContent from '@/Components/MarkdownContent';
import { BuscoAnalysis, fCatAnalysis } from '@/types/data';
import BUSCOCompletenessBar from '@/Components/BUSCOCompletenessBar';
import FCatCompletenessBar from '@/Components/fCatCompletenessBar';

export default function Welcome({
    totalAssemblies,
    taxaWithAssemblies,
    rootUpdate,
    analysesCount,
    triples,
    buscoStats,
    fcatStats,
}: {
    totalAssemblies: number;
    taxaWithAssemblies: number;
    rootUpdate: string;
    analysesCount: number;
    triples: { 'num-triples-normal': number };
    buscoStats: BuscoAnalysis;
    fcatStats: fCatAnalysis;
}) {
    console.log(buscoStats);
    return (
        <React.Fragment>
            <Head title="Home" />
            <TopBar />
            <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
                <Container fluid className="bg-light py-5 text-center">
                    <h1 className="display-4 fw-bold mb-3">{import.meta.env.VITE_CUSTOM_TITLE || 'G-nom'}</h1>
                    <br />
                    <Row className="justify-content-center mb-4">
                        <Col md={4}>
                            <Button href={route('assemblies')} variant="primary" size="lg" className="w-100 mb-3">
                                🔍 Search Assemblies
                            </Button>
                        </Col>
                        <Col md={4}>
                            <Button href="/tol" variant="outline-secondary" size="lg" className="w-100 mb-3">
                                🌳 Browse the Tree of Life
                            </Button>
                        </Col>
                    </Row>
                    <Row className="justify-content-center mb-4">
                        <Col md={8}>
                            <MarkdownContent file_name={'welcome.md'} />
                        </Col>
                    </Row>
                    <Row className="justify-content-center mb-4">
                        <Col md={(triples && 2) || 3}>
                            <Card className="m-2">
                                <Card.Body style={{ fontSize: 20 }}>
                                    <strong>{totalAssemblies.toLocaleString('en-GB')}</strong>
                                    <div className="text-muted">assemblies</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={(triples && 2) || 3}>
                            <Card className="m-2">
                                <Card.Body style={{ fontSize: 20 }}>
                                    <strong>{taxaWithAssemblies.toLocaleString('en-GB')}</strong>
                                    <div className="text-muted">taxa</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={(triples && 2) || 3}>
                            <Card className="m-2">
                                <Card.Body style={{ fontSize: 20 }}>
                                    <strong>{analysesCount.toLocaleString('en-GB')}</strong>
                                    <div className="text-muted">analyses</div>
                                </Card.Body>
                            </Card>
                        </Col>
                        {triples['num-triples-normal'] && (
                            <Col md={2}>
                                <Card className="m-2">
                                    <Card.Body style={{ fontSize: 20 }}>
                                        <strong>{triples['num-triples-normal'].toLocaleString('en-GB')}</strong>
                                        <div className="text-muted">triples</div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                    </Row>
                    <Row className="justify-content-center mb-4">
                        <Col md={4}>
                            <Card className="m-2">
                                <Card.Body>
                                    <BUSCOCompletenessBar analyses={[buscoStats]} />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={4}>
                            <Card className="m-2">
                                <Card.Body>
                                    <FCatCompletenessBar analysis={fcatStats} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                    <Row className="justify-content-center mb-4">
                        <Col md={4}>
                            <Card className="m-2">
                                <Card.Body>
                                    <b className="text-muted">NCBI Taxonomy version: </b> {rootUpdate}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
}
