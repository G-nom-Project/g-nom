import TopBar from '@/Components/TopNavBar';
import { Head, Link } from '@inertiajs/react';
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
    triples: { 'num-triples-normal': number } | null;
    buscoStats: BuscoAnalysis | null;
    fcatStats: fCatAnalysis | null;
}) {
    const title = import.meta.env.VITE_CUSTOM_TITLE || 'G-nom';

    const statistics = [
        {
            label: 'Genome assemblies',
            value: totalAssemblies,
            icon: 'bi-database',
            description: 'Available genome assemblies',
        },
        {
            label: 'Taxa',
            value: taxaWithAssemblies,
            icon: 'bi-diagram-3',
            description: 'Taxa represented in the database',
        },
        {
            label: 'Analyses',
            value: analysesCount,
            icon: 'bi-activity',
            description: 'Completed genomic analyses',
        },
        ...(triples?.['num-triples-normal'] != null
            ? [
                {
                    label: 'Knowledge graph triples',
                    value: triples['num-triples-normal'],
                    icon: 'bi-share',
                    description: 'RDF statements in the knowledge graph',
                },
            ]
            : []),
    ];

    return (
        <React.Fragment>
            <Head title="Home" />
            <TopBar />

            <main className="welcome-page">
                {/* Hero */}
                <section className="welcome-hero">
                    <Container fluid className="px-3 px-lg-4">
                        <Row className="align-items-center g-5">
                            <Col xs={12} lg={8} xl={7}>
                                <h1 className="welcome-title mb-4">
                                    {title}
                                </h1>

                                <div className="welcome-description mb-4">
                                    <MarkdownContent file_name="welcome.md" />
                                </div>

                                <div className="welcome-actions">
                                    <Button
                                        as={Link}
                                        href={route('assemblies')}
                                        variant="primary"
                                        size="lg"
                                        className="welcome-primary-action"
                                    >
                                        <i className="bi bi-search me-2" />
                                        Explore assemblies
                                        <i className="bi bi-arrow-right ms-3" />
                                    </Button>

                                    <Button
                                        as={Link}
                                        href={route('tol')}
                                        variant="outline-secondary"
                                        size="lg"
                                        className="welcome-secondary-action"
                                    >
                                        <i className="bi bi-diagram-3 me-2" />
                                        Tree of Life
                                    </Button>
                                </div>
                            </Col>

                            {/* Hero information panel */}
                            <Col xs={12} lg={4} xl={{ span: 4, offset: 1 }}>
                                <div className="welcome-hero-panel">
                                    <div className="welcome-hero-panel-icon">
                                        <span className="material-symbols-outlined">
                                            genetics
                                        </span>
                                    </div>

                                    <h2 className="h5 fw-semibold mb-3">
                                        Explore genomic biodiversity
                                    </h2>

                                    <p className="text-secondary mb-4">
                                        Discover genome assemblies, explore
                                        taxonomic relationships, and examine
                                        genomic annotations and quality
                                        assessments.
                                    </p>

                                    <div className="welcome-hero-highlight">
                                        <span className="text-secondary small">
                                            Available assemblies
                                        </span>
                                        <strong>
                                            {totalAssemblies.toLocaleString('en-GB')}
                                        </strong>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Database statistics */}
                <section className="welcome-section">
                    <Container fluid className="px-3 px-lg-4">
                        <div className="welcome-section-heading">
                            <div>
                                <div className="welcome-section-eyebrow">
                                    Database overview
                                </div>
                                <h2 className="welcome-section-title">
                                    G-nom at a glance
                                </h2>
                                <p className="text-secondary mb-0">
                                    An overview of the genomic resources
                                    currently available.
                                </p>
                            </div>
                        </div>

                        <Row className="g-3 g-xl-4">
                            {statistics.map((statistic) => (
                                <Col
                                    key={statistic.label}
                                    xs={12}
                                    sm={6}
                                    xl={statistics.length === 4 ? 3 : 4}
                                >
                                    <Card className="welcome-stat-card h-100">
                                        <Card.Body>
                                            <div className="welcome-stat-header">
                                                <span className="welcome-stat-icon">
                                                    <i
                                                        className={`bi ${statistic.icon}`}
                                                    />
                                                </span>
                                            </div>

                                            <div className="welcome-stat-value">
                                                {statistic.value.toLocaleString('en-GB')}
                                            </div>

                                            <div className="welcome-stat-label">
                                                {statistic.label}
                                            </div>

                                            <div className="welcome-stat-description">
                                                {statistic.description}
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>

                {/* Completeness */}
                <section className="welcome-section welcome-quality-section">
                    <Container fluid className="px-3 px-lg-4">
                        <div className="welcome-section-heading">
                            <div>
                                <div className="welcome-section-eyebrow">
                                    Quality assessment
                                </div>
                                <h2 className="welcome-section-title">
                                    Completeness overview
                                </h2>
                                <p className="text-secondary mb-0">
                                    Summaries of available BUSCO and fCat
                                    completeness assessments.
                                </p>
                            </div>
                        </div>

                        <Row className="g-4">
                            <Col xs={12} xl={6}>
                                <Card className="gnom-panel welcome-quality-card h-100">
                                    <Card.Header>
                                        <i className="bi bi-shield-check me-2" />
                                        BUSCO completeness
                                    </Card.Header>

                                    <Card.Body>
                                        {buscoStats ? (
                                            <BUSCOCompletenessBar
                                                analyses={[buscoStats]}
                                            />
                                        ) : (
                                            <div className="welcome-quality-empty">
                                                <i className="bi bi-bar-chart-line" />
                                                <p className="mb-0">
                                                    No BUSCO summary available.
                                                </p>
                                            </div>
                                        )}
                                    </Card.Body>

                                    <Card.Footer className="welcome-quality-footer">
                                        <span className="text-secondary small">
                                            Benchmarking Universal Single-Copy
                                            Orthologs
                                        </span>
                                    </Card.Footer>
                                </Card>
                            </Col>

                            <Col xs={12} xl={6}>
                                <Card className="gnom-panel welcome-quality-card h-100">
                                    <Card.Header>
                                        <i className="bi bi-diagram-3 me-2" />
                                        fCat completeness
                                    </Card.Header>

                                    <Card.Body>
                                        {fcatStats ? (
                                            <FCatCompletenessBar
                                                analysis={fcatStats}
                                            />
                                        ) : (
                                            <div className="welcome-quality-empty">
                                                <i className="bi bi-bar-chart-line" />
                                                <p className="mb-0">
                                                    No fCat summary available.
                                                </p>
                                            </div>
                                        )}
                                    </Card.Body>

                                    <Card.Footer className="welcome-quality-footer">
                                        <span className="text-secondary small">
                                            Feature-aware completeness assessment
                                        </span>
                                    </Card.Footer>
                                </Card>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* Provenance */}
                <footer className="welcome-footer">
                    <Container fluid className="px-3 px-lg-4">
                        <div className="welcome-footer-inner">
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-database-gear" />
                                <span>
                                    NCBI Taxonomy version:
                                    <strong className="ms-2">
                                        {rootUpdate || 'Unknown'}
                                    </strong>
                                </span>
                            </div>

                            <span>G-nom 0.1.2</span>
                        </div>
                    </Container>
                </footer>
            </main>
        </React.Fragment>
    );
}
