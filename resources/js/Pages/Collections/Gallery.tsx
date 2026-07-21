import TopNavBar from '@/Components/TopNavBar';
import { Button, Col, Container, Form, InputGroup, Nav, Navbar, Row } from 'react-bootstrap';
import { AggregatedAssembly, Collection } from '@/types/data';
import React, { FormEvent } from 'react';
import AssemblyCard from '@/Components/AssemblyCard';
import Pagination from '@/Components/Pagination';
import { useForm } from '@inertiajs/react';

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
export default function CollectionPage({collection, assemblies, filters} : {collection: Collection, assemblies: PaginatedAssemblies, filters: Filters}) {
    const { data, setData, get } = useForm<{ search: string }>({
        search: filters.search || '',
    });
    console.log(assemblies);
    // Submit filters and reload assemblies
    function submit(e: FormEvent) {
        e.preventDefault();
        get(route('collections.gallery', {id: collection.id}));
    }
    return (
        <>
            <TopNavBar />
            <Navbar bg="secondary" expand="lg">
                <Container fluid>
                    <Nav className="m-1">
                        <Nav.Item style={{ width: '25vw' }}>
                            <h2 className="band-header text-white">Browse {collection.name} (collection)</h2>
                        </Nav.Item>
                    </Nav>
                    <Nav className="m-1" style={{ width: '50vw' }}>
                        <Nav.Link style={{ width: '100%' }}>
                            <InputGroup>
                                <Form onSubmit={submit} style={{ width: '100%' }}>
                                    <Form.Control
                                        type="text"
                                        value={data.search}
                                        placeholder={'Enter an assembly name, taxon name or NCBI Taxon ID'}
                                        // @ts-expect-error Type mismatch to TFrom, simply not inferred correctly
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setData('search', e.target.value as string)}
                                    />
                                </Form>
                            </InputGroup>
                        </Nav.Link>
                        <Nav.Link style={{ width: '25vw' }}>
                            <Button onClick={submit}>
                                <i className="bi bi-search"></i>
                            </Button>
                        </Nav.Link>
                    </Nav>
                    <Nav>
                        <Nav.Link>
                            <Button disabled>Advanced filters</Button>
                        </Nav.Link>
                    </Nav>
                </Container>
            </Navbar>
            <Container fluid>
                <Row className="row-cols-1 row-cols-md-4 mt-3">
                    {assemblies.data.map((each: AggregatedAssembly) => (
                        <Col key={each.id} xs={12} sm={6} lg={6} xl={4} xxl={3} className="d-flex mb-3">
                            <AssemblyCard
                                assemblyName={each.name}
                                assemblyID={each.id}
                                ncbiID={each.taxon.ncbiTaxonID}
                                info_text={each.taxon.infos[0]?.headline || each.wikipedia_summary}
                                last_update={'Never'}
                                public={true}
                                mappings={each.mappings_count}
                                annotations={each.genomic_annotations_count}
                                buscos={each.busco_analyses_count}
                                n50={each.n50}
                                maxBuscoScore={10}
                                repeatmaskers={each.repeatmasker_analyses_count}
                                taxaminers={each.taxaminer_analyses_count}
                                taxon_updated_at={each.taxon.updated_at}
                                is_bookmarked={each.is_bookmarked}
                                taxon_name={each.taxon.scientificName}
                                conservation_status={each.conservation_status}
                                wiki_image={each.wiki_image}
                                is_wiki_text={each.wikipedia_summary && !each.taxon.infos[0]?.headline}
                                collections={each.collections}
                            />
                        </Col>
                    ))}
                </Row>
                <Row className="justify-content-center mb-3">
                    <Col xs="auto">
                        <Pagination links={assemblies.links} />
                    </Col>
                </Row>
            </Container>
        </>
    );
}
