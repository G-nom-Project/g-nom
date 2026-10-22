import AssemblyCard from '@/Components/AssemblyCard';
import Pagination from '@/Components/Pagination';
import TopNavBar from '@/Components/TopNavBar';
import { AggregatedAssembly } from '@/types/data';
import { useForm } from '@inertiajs/react';
import React, { FormEvent } from 'react';
import { Button, Col, Container, Form, InputGroup, Nav, Navbar, Row } from 'react-bootstrap';

interface PaginatedAssemblies {
    data: AggregatedAssembly[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    search: string;
}

export default function Assemblies({ assemblies, filters }: { assemblies: PaginatedAssemblies; filters: Filters }) {
    // Handle filters
    const { data, setData, get } = useForm<{ search: string }>({
        search: filters.search || '',
    });

    // Submit filters and reload assemblies
    function submit(e: FormEvent) {
        e.preventDefault();
        get(route('assemblies'));
    }

    return (
        <>
            <TopNavBar />
            <Navbar bg="secondary" expand="lg">
                <Container fluid>
                    <Nav className="m-1">
                        <Nav.Item>
                            <h1 className="band-header text-white">Search assemblies</h1>
                        </Nav.Item>
                    </Nav>
                    <Nav className="m-1" style={{ width: '50%' }}>
                        <Nav.Item style={{ width: '100%' }}>
                            <Form onSubmit={submit}>
                                <InputGroup>
                                    <Form.Control value={data.search} onChange={(e) => setData('search', e.target.value)} />
                                </InputGroup>
                            </Form>
                        </Nav.Item>

                        <Nav.Item>
                            <Button onClick={submit}>
                                <i className="bi bi-search" />
                            </Button>
                        </Nav.Item>
                    </Nav>
                    <Nav>
                        <Nav.Link>
                            <Button>Advanced filters</Button>
                        </Nav.Link>
                    </Nav>
                </Container>
            </Navbar>

            <Container fluid="xl" className="assemblies-results py-4 py-lg-5">
                {assemblies.data.length > 0 ? (
                    <Row className="g-4">
                        {assemblies.data.map((each: AggregatedAssembly) => (
                            <Col
                                key={each.id}
                                xs={12}
                                sm={6}
                                xl={4}
                                xxl={3}
                                className="d-flex"
                            >
                                <AssemblyCard
                                    assemblyName={each.name}
                                    assemblyID={each.id}
                                    ncbiID={each.taxon.ncbiTaxonID}
                                    info_text={
                                        each.taxon.infos && each.taxon.infos[0]?.headline ||
                                        each.wikipedia_summary
                                    }
                                    last_update="Never"
                                    public={each.public}
                                    mappings={each.mappings_count}
                                    annotations={each.genomic_annotations_count}
                                    buscos={each.busco_analyses}
                                    fcats={each.fcat_analyses}
                                    n50={each.n50}
                                    maxBuscoScore={10}
                                    repeatmaskers={each.repeatmasker_analyses_count}
                                    taxaminers={each.taxaminer_analyses_count}
                                    taxon_updated_at={each.taxon.updated_at}
                                    is_bookmarked={each.is_bookmarked}
                                    taxon_name={each.taxon.scientificName}
                                    conservation_status={each.conservation_status}
                                    wiki_image={each.wiki_image}
                                    is_wiki_text={
                                        !!each.wikipedia_summary &&
                                        each.taxon.infos && !each.taxon.infos[0]?.headline
                                    }
                                    collections={each.collections}
                                />
                            </Col>
                        ))}
                    </Row>
                ) : (
                    <div className="assemblies-empty">
                        <i className="bi bi-search mb-3" />
                        <h3 className="h5">No assemblies found</h3>
                        <p className="text-secondary mb-0">
                            Try a different search term.
                        </p>
                    </div>
                )}

                {assemblies.last_page > 1 && (
                    <div className="assemblies-pagination mt-5 pt-4">
                        <Pagination links={assemblies.links} />
                    </div>
                )}
            </Container>

        </>
    );
}
