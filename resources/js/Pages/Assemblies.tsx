import { useForm } from '@inertiajs/react';
import AssemblyCard from '@/Components/AssemblyCard';
import Pagination from '@/Components/Pagination';
import TopNavBar from '@/Components/TopNavBar';
import { FormEvent } from 'react';
import {Col, Container, Row, Form, Button, Navbar, Nav, InputGroup} from 'react-bootstrap';

interface PaginatedAssemblies {
    data: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    search: string;
}

export default function Assemblies({
                                       assemblies,
                                       filters
}: {
    assemblies: PaginatedAssemblies;
    filters: Filters;
}) {

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
                            <Nav.Item><h4 className="text-white">Search assemblies</h4></Nav.Item>
                        </Nav>
                        <Nav className="m-1" style={{width: "50%"}}>
                            <Nav.Link style={{width: "100%"}}>
                                <InputGroup>
                                    <Form onSubmit={submit} style={{width: "100%"}}>
                                        <Form.Control
                                            type="text"
                                            value={data.search}
                                            placeholder={"Enter a assembly name or NCBI Taxon ID"}
                                            // @ts-expect-error Type mismatch to TFrom, simply not inferred correctly
                                            onChange={(e) => setData('search', e.target.value)}
                                        />
                                    </Form>
                                </InputGroup>
                            </Nav.Link>
                            <Nav.Link>
                                <Button onClick={submit}><i className="bi bi-search"></i></Button>
                            </Nav.Link>
                        </Nav>
                        <Nav>
                            <Nav.Link><Button>Advanced filters</Button></Nav.Link>
                        </Nav>
                    </Container>
                </Navbar>
                <Row className="row-cols-1 row-cols-md-4">
                    {assemblies.data.map((each: any) => (
                        <Col key={each.id} className="d-flex align-items-stretch mb-3">
                            <AssemblyCard
                                assemblyName={each.name}
                                assemblyID={each.id}
                                ncbiID={each.taxon_id}
                                info_text={each.taxon.infos[0]?.headline}
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
                            />
                        </Col>
                    ))}
                </Row>
                <Row className="justify-content-center mt-4">
                    <Col xs="auto">
                        <Pagination links={assemblies.links} />
                    </Col>
                </Row>
        </>
    );
}
