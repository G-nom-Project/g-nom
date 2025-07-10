import axios from "axios";
import TopNavBar from '@/Components/TopNavBar';
import {useEffect, useState} from 'react';
import {
    Accordion,
    Button,
    Card,
    Col,
    Container,
    Form,
    InputGroup,
    ListGroup,
    Nav,
    Navbar,
    Row,
} from 'react-bootstrap';
import placeholder_image from '../../static/img/dnaPlaceholder.PNG';
import AssemblyStatistics from "@/Components/AssemblyPage/AssemblyStatistics";
import BuscoViewer from "@/Components/AssemblyPage/BuscoViewer";
import FcatViewer from "@/Components/AssemblyPage/FCatViewer";
import RepeatMaskerViewer from "@/Components/AssemblyPage/RepeatMaskerViewer";
import {Annotation} from "@/types/data";
import JBrowseView from "@/Components/AssemblyPage/JBrowseView";
import {TaxaminerDashboard} from "@/Components/AssemblyPage/TaxonomicAssignmentDashboard/dashboard";

export default function Assemblies({ assembly }) {
    const [renderCompleteness, setRenderCompleteness] = useState<boolean>(false);
    const [renderRepeats, setRenderRepeats] = useState<boolean>(false);
    const [location, setLocation] = useState<string>("");
    const [scroll, setScroll] = useState<boolean>(false);
    const [lineage, setLineage] = useState<any[] | null>(null);

    useEffect(() => {
        const fetchLineage = async () => {
            console.log(assembly);

            try {
                const new_lineage = await getLineage(assembly.taxon_id);
                setLineage(new_lineage);
            } catch (error) {
                console.error('Error fetching lineage:', error);
            }
        };

        if (assembly?.taxon_id) {
            fetchLineage();
        }
    }, [assembly]);

    useEffect(() => {
        console.log(location);
    }, [location]);


    const getLineage = async (ncbiTaxonID: number) => {
        try {
            const response = await axios.get(`/lineage/${ncbiTaxonID}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch lineage:', error);
            throw error;
        }
    };

    return (
        <>
            <TopNavBar />
            <Navbar bg="secondary" expand="lg">
                <Container fluid>
                    <Nav className="m-1">
                        <Nav.Item>
                            <h4 className="text-white">
                                <b className="capitalize">{assembly.taxon.scientificName}</b> {'>'}{' '}
                                {assembly?.label
                                    ? assembly.label
                                    : assembly.name}

                            </h4>
                        </Nav.Item>
                    </Nav>
                    <Nav className="m-1">
                        <Nav.Link>
                            <Button>
                                <i className={'bi bi-bookmark-plus'}></i>
                            </Button>
                        </Nav.Link>
                    </Nav>
                </Container>
            </Navbar>
            <Container fluid>
                <Row className="mt-2">
                    <Col xs={4}>
                        <Card className="shadow" style={{ minHeight: '300px' }}>
                            <Card.Img
                                variant="center"
                                className="image-class-name img-responsive rounded-top"
                                src={placeholder_image as string}
                                alt="Card image"
                                style={{
                                    height: '300px',
                                    objectFit: 'cover',
                                    backgroundColor: '#D1D5DB',
                                }}
                            />

                            <Card.Body>Image Credit: {assembly.taxon.imageCredit}</Card.Body>
                        </Card>
                    </Col>
                    <Col>
                        <Card className="shadow">
                            <Card.Body>
                                <Card.Title className={"capitalize"}>{assembly.taxon.commonName || assembly.taxon.scientificName}</Card.Title>
                                <Card.Subtitle className="text-muted">
                                    {'root '}
                                    {lineage && lineage.map(each => {
                                        return <><i className="bi bi-arrow-right"> </i> {each.scientificName} </>
                                    })}
                                    ({assembly.taxon_id})
                                </Card.Subtitle>
                                <Card.Text>Taxon Info</Card.Text>
                            </Card.Body>
                            <ListGroup className="list-group-flush">
                                <ListGroup.Item>
                                    <b className="text-muted">
                                        Last updated: {assembly.updated_at}
                                    </b>
                                </ListGroup.Item>
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Accordion
                        className="mt-2"
                        defaultActiveKey={['0']}
                        alwaysOpen
                    >
                        <Accordion.Item eventKey="0">
                            <Accordion.Header>
                                <h4>Assembly Information</h4>
                            </Accordion.Header>
                            <Accordion.Body>
                                <Row>
                                    <Col>
                                        <Card className="shadow">
                                            <Card.Header>
                                                Contig size statistics
                                            </Card.Header>
                                            <Card.Body><AssemblyStatistics assembly={assembly}/></Card.Body>
                                        </Card>
                                    </Col>
                                    <Col>
                                        <Card className="shadow">
                                            <Card.Header>
                                                Assembly statistics
                                            </Card.Header>
                                            <Card.Body>
                                                <InputGroup className="m-2">
                                                    <InputGroup.Text id="info-database-id">
                                                        Database ID
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.id
                                                        }
                                                        readOnly={true}
                                                    />
                                                    <Button>
                                                        <span className="bi bi-clipboard2" />
                                                    </Button>
                                                </InputGroup>
                                                <InputGroup className="m-2">
                                                    <InputGroup.Text id="info-label">
                                                        Label
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.name
                                                        }
                                                        readOnly={true}
                                                    />
                                                    <Button>
                                                        <span className="bi bi-clipboard2" />
                                                    </Button>
                                                </InputGroup>
                                                <InputGroup className="m-2">
                                                    <InputGroup.Text id="info-number-seqs">
                                                        Label
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.label
                                                        }
                                                        readOnly={true}
                                                    />
                                                </InputGroup>
                                                <InputGroup className="m-2">
                                                    <InputGroup.Text id="info-number-seqs">
                                                        Cumulative sequence
                                                        length
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.cumulativeSequenceLength
                                                        }
                                                        readOnly={true}
                                                    />
                                                    <InputGroup.Text id="info-number-seqs">
                                                        Type
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="DNA"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.sequenceType
                                                        }
                                                        readOnly={true}
                                                    />
                                                </InputGroup>
                                                <InputGroup className="m-2">
                                                    <InputGroup.Text id="info-longest-seqs">
                                                        Longest
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.largestSequence
                                                        }
                                                        readOnly={true}
                                                    />
                                                    <InputGroup.Text id="info-shortest-seqs">
                                                        Shortest
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.shortestSequence
                                                        }
                                                        readOnly={true}
                                                    />
                                                </InputGroup>
                                                <InputGroup className="m-2">
                                                    <InputGroup.Text id="info-number-seqs">
                                                        Median
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.medianSequence
                                                        }
                                                        readOnly={true}
                                                    />
                                                </InputGroup>
                                                <InputGroup className="m-2">
                                                    <InputGroup.Text id="info-longest-seqs">
                                                        N50
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.n50
                                                        }
                                                        readOnly={true}
                                                    />
                                                    <InputGroup.Text id="info-shortest-seqs">
                                                        N90
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.n90
                                                        }
                                                        readOnly={true}
                                                    />
                                                </InputGroup>
                                                <InputGroup className="m-2">
                                                    <InputGroup.Text id="info-number-seqs">
                                                        %GC content
                                                    </InputGroup.Text>
                                                    <Form.Control
                                                        placeholder="Assembly"
                                                        contentEditable={false}
                                                        value={
                                                            assembly &&
                                                            assembly.gcPercent
                                                        }
                                                        readOnly={true}
                                                    />
                                                </InputGroup>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                                <hr/>
                                <Row className="mt-4 mb-4">
                                    <Col xs={6}>
                                        <Card className="shadow" style={{height: "50vh"}}>
                                            <Card.Header>TaxSun Placeholder</Card.Header>
                                            <Card.Body>

                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col>
                                        <Card className="shadow" style={{height: "50vh"}}>
                                            <Card.Header>
                                                Assembly Headers Placeholder
                                            </Card.Header>
                                        </Card>
                                    </Col>
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                            <Accordion.Header><h4>Annotation completeness</h4></Accordion.Header>
                            <Accordion.Body onEntered={() => setRenderCompleteness(true)}>
                                {/* Only render the BUSCO Plot after the Accordion item has expanded => forces plotly to size plot correctly */}
                                {(renderCompleteness && assembly.busco_analyses.length > 0 ) && <BuscoViewer busco={assembly.busco_analyses}/>}
                                {(renderCompleteness && assembly.fcat_analyses.length > 0) && <FcatViewer assembly={assembly} taxon={""} fcat={assembly.fcat_analyses}/>}

                            </Accordion.Body>
                        </Accordion.Item>
                        {( assembly.repeatmasker_analyses.length > 0) && (
                            <Accordion.Item eventKey="3">
                                <Accordion.Header>
                                    <h4>Repeatmasker</h4>
                                </Accordion.Header>
                                <Accordion.Body onEntered={() => setRenderRepeats(true)}>
                                    {(renderRepeats) && <RepeatMaskerViewer repeatmasker={assembly.repeatmasker_analyses}/>}
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        <Accordion.Item eventKey="4">
                            <Accordion.Header>
                                <h4>Taxonomic Assignment</h4>
                            </Accordion.Header>
                            <Accordion.Body>
                                { assembly && <TaxaminerDashboard assembly_id={assembly.id} analyses={assembly.taxaminer_analyses} setLocation={setLocation} setAutoScroll={setScroll} userID={2}/>}
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="2" onClick={()=> window.dispatchEvent(new Event('resize'))}>
                            <Accordion.Header><h4>Genome Browser</h4></Accordion.Header>
                            <Accordion.Body>
                                <Row>
                                    <Col xs={2}>
                                        <Card className="shadow">
                                            <Card.Header>Available Annotations </Card.Header>
                                            <Card.Body>
                                                <Card.Text>A total of <b>{assembly.genomic_annotations.length}</b> annotations are available for this assembly. Use the JBrowse controls <i className="bi bi-list-task"/> to toggle tracks once the browser has loaded.</Card.Text>
                                                <Button href={`/browser/${assembly.id}`}>Launch fullscreen Browser <i className="bi bi-box-arrow-up-right"/></Button><br/>
                                            </Card.Body>
                                            <ListGroup variant="flush">
                                                <ListGroup.Item className="text-muted"><i className="bi bi-database"></i> Reference sequence</ListGroup.Item>
                                                {assembly.genomic_annotations.length > 0 && (
                                                    assembly.genomic_annotations.map((annotation: Annotation) => {
                                                        return <ListGroup.Item className="text-muted"><i className="bi bi-align-center"></i> {annotation.label || annotation.name}</ListGroup.Item>
                                                    })
                                                )}
                                            </ListGroup>
                                        </Card>
                                    </Col>
                                    <Col>
                                        <div style={{minHeight: "500px"}}>
                                            {assembly &&
                                            <JBrowseView
                                                my_assembly={assembly}
                                                annotations={
                                                    assembly.genomic_annotations
                                                }
                                                mappings={assembly.mappings}
                                                location={location}
                                            ></JBrowseView>
                                            }
                                        </div>
                                    </Col>
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Row>
            </Container>
        </>
    );
}
