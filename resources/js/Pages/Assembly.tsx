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
    Navbar, Placeholder,
    Row, Tab, Tabs,
} from 'react-bootstrap';
import placeholder_image from '../../static/img/dnaPlaceholder.PNG';
import AssemblyStatistics from "@/Components/AssemblyPage/AssemblyStatistics";
import BuscoViewer from "@/Components/AssemblyPage/BuscoViewer";
import FcatViewer from "@/Components/AssemblyPage/FCatViewer";
import RepeatMaskerViewer from "@/Components/AssemblyPage/RepeatMaskerViewer";
import {Annotation} from "@/types/data";
import JBrowseView from "@/Components/AssemblyPage/JBrowseView";
import {TaxaminerDashboard} from "@/Components/AssemblyPage/TaxonomicAssignmentDashboard/dashboard";
import TaxMap from "@/Components/AssemblyPage/TaxMap";
import {getGeoData, getLineage, getTaxonHeadline, getTaxonInfo} from "@/REST/taxon";
import axios from "axios";
import {width} from "@mui/system";

export default function Assemblies({ assembly }) {
    const [renderCompleteness, setRenderCompleteness] = useState<boolean>(false);
    const [renderRepeats, setRenderRepeats] = useState<boolean>(false);
    const [location, setLocation] = useState<string>("");
    const [scroll, setScroll] = useState<boolean>(false);
    const [lineage, setLineage] = useState<any[] | null>(null);
    const [geoData, setGeoData] = useState([]);
    const [activeTab, setActiveTab] = useState("image");

    // Taxon Information
    const [taxonHeadline, setTaxonHeadline] = useState<string|null>(null);
    const [taxonInfos, setTaxonInfos] = useState(null);


    useEffect(() => {
        const fetchTaxonData = async () => {
            try {
                // Taxon Headline
                const headline_response = await getTaxonHeadline(assembly.taxon_id);
                if (headline_response.data.infos[0]) {
                    setTaxonHeadline(headline_response.data.infos[0]?.text)
                } else {
                    setTaxonHeadline("No Taxon headline available")
                }

                // Taxon Info Text
                const info_response = await getTaxonInfo(assembly.taxon_id);
                setTaxonInfos(info_response.data.infos)

                // Taxon Geo Data
                const data = await getGeoData(assembly.taxon_id);
                setGeoData(data.geo_data);

                // NCBI Lineage
                const new_lineage = await getLineage(assembly.taxon_id);
                setLineage(new_lineage);

            } catch (error) {
                console.error('Error fetching Taxon data:', error);
            }
        }

        if (assembly?.taxon_id) {
            fetchTaxonData();
        }
    }, [assembly]);

    useEffect(() => {
        console.log(location);
    }, [location]);

    const getGeoData = async (ncbiTaxonID: number) => {
        try {
            const response = await axios.get(`/taxon-geo-data/${ncbiTaxonID}`);
            return response.data;
        } catch (error) {
            console.error('Failed to geo data:', error);
            throw error;
        }
    };

    return (
        <>
            <head>
                <title>{assembly.taxon.commonName || assembly.taxon.scientificName}</title>
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
                    integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
                    crossOrigin=""
                />

                <script
                    src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js"
                    integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew=="
                    crossOrigin=""
                ></script>
            </head>
            <TopNavBar/>
            <Navbar bg="secondary" expand="lg">
                <Container fluid>
                    <Nav className="m-1">
                        <Nav.Item>
                            <h4 className="text-white">
                                <b className="capitalize">{assembly.taxon.scientificName}</b>{' '}
                            </h4>
                        </Nav.Item>
                        {
                            assembly.taxon.phylopic_url && <img
                                src={assembly.taxon.phylopic_url}
                                style={{
                                    height: "3vh",
                                    filter: "invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)"
                                }}
                            />
                        }

                        <Nav.Item>
                            <h4 className="text-white">
                                {" > "}
                                {assembly?.label ? assembly.label : assembly.name}
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
                    {/* Left Column: Tabs (Image / Map) */}
                    <Col xs={12} md={5} className="mb-3 mb-md-0">
                        <Card className="h-100">
                            <Tabs defaultActiveKey="image" className="mb-3" onSelect={(k) => setActiveTab(k)}>
                                <Tab title="Image" eventKey="image">
                                    <Card className="shadow m-1" style={{ minHeight: '300px' }}>
                                        <Card.Img
                                            className="img-fluid rounded-top"
                                            src={placeholder_image as string}
                                            alt="Card image"
                                            style={{
                                                height: '400px',
                                                objectFit: 'cover',
                                                backgroundColor: '#D1D5DB',
                                            }}
                                        />
                                        <Card.Body>
                                            Image Credit: {assembly.taxon.imageCredit}
                                        </Card.Body>
                                    </Card>
                                </Tab>
                                <Tab title="Map" eventKey="overview-map">
                                    {activeTab === "overview-map" && (
                                        <Card className="m-1 shadow" style={{ height: "450px" }}>
                                            <TaxMap isVisible={true} geoDataMeta={geoData}/>
                                        </Card>

                                    )}
                                </Tab>
                            </Tabs>
                        </Card>
                    </Col>

                    {/* Right Column: Taxon Info */}
                    <Col xs={12} md={7}>
                        <Card className="shadow h-100">
                            <Card.Body>
                                <Card.Title className="capitalize">
                                    {assembly.taxon.commonName || assembly.taxon.scientificName}
                                </Card.Title>
                                <Card.Subtitle className="text-muted mb-2">

                                </Card.Subtitle>
                                <Card.Text>
                                    {taxonHeadline ||  <Placeholder as="p" animation="glow"><Placeholder xs={12} /><Placeholder xs={5} /></Placeholder>}
                                    <hr/>
                                    {taxonInfos && (<p>{taxonInfos[0]?.text || "No Taxon info text available"}</p>) || <Placeholder as="p" animation="glow"><Placeholder xs={12} /><Placeholder xs={5} /><Placeholder xs={8} /><Placeholder xs={3} /></Placeholder>}
                                </Card.Text>
                            </Card.Body>
                            <ListGroup className="list-group-flush">
                                <ListGroup.Item>
                                    {lineage ? (
                                        <>
                                            {lineage.map((each, index) =>
                                                each.scientificName === 'root' ? (
                                                    <i key={index} className="bi bi-diamond-half me-1" />
                                                ) : (
                                                    <span key={index}><i className="bi bi-arrow-right mx-1" /><a href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${each.ncbiTaxonID}`} target="_blank" rel="noopener noreferrer">
                                                          {each.scientificName}
                                                        </a>
                                                        </span>
                                                )
                                            )}
                                            {` (${assembly.taxon_id})`}
                                        </>
                                    ) : (
                                        <Placeholder as="p" animation="glow">
                                            <Placeholder xs={12} />
                                        </Placeholder>
                                    )}
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <b className="text-muted">Last updated: {assembly.updated_at}</b>
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
                                                        <span className="bi bi-clipboard2"/>
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
                                                        <span className="bi bi-clipboard2"/>
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
                                {(renderCompleteness && assembly.busco_analyses.length > 0) &&
                                    <BuscoViewer busco={assembly.busco_analyses}/>}
                                {(renderCompleteness && assembly.fcat_analyses.length > 0) &&
                                    <FcatViewer assembly={assembly} taxon={""} fcat={assembly.fcat_analyses}/>}

                            </Accordion.Body>
                        </Accordion.Item>
                        {(assembly.repeatmasker_analyses.length > 0) && (
                            <Accordion.Item eventKey="3">
                                <Accordion.Header>
                                    <h4>Repeatmasker</h4>
                                </Accordion.Header>
                                <Accordion.Body onEntered={() => setRenderRepeats(true)}>
                                    {(renderRepeats) &&
                                        <RepeatMaskerViewer repeatmasker={assembly.repeatmasker_analyses}/>}
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        <Accordion.Item eventKey="4">
                            <Accordion.Header>
                                <h4>Taxonomic Assignment</h4>
                            </Accordion.Header>
                            <Accordion.Body>
                                {assembly &&
                                    <TaxaminerDashboard assembly_id={assembly.id} analyses={assembly.taxaminer_analyses}
                                                        setLocation={setLocation} setAutoScroll={setScroll}
                                                        userID={2}/>}
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="2" onClick={() => window.dispatchEvent(new Event('resize'))}>
                            <Accordion.Header><h4>Genome Browser</h4></Accordion.Header>
                            <Accordion.Body>
                                <Row>
                                    <Col xs={2}>
                                        <Card className="shadow">
                                            <Card.Header>Available Annotations </Card.Header>
                                            <Card.Body>
                                                <Card.Text>A total
                                                    of <b>{assembly.genomic_annotations.length}</b> annotations are
                                                    available for this assembly. Use the JBrowse controls <i
                                                        className="bi bi-list-task"/> to toggle tracks once the browser
                                                    has loaded.</Card.Text>
                                                <Button href={`/browser/${assembly.id}`}>Launch fullscreen Browser <i
                                                    className="bi bi-box-arrow-up-right"/></Button><br/>
                                            </Card.Body>
                                            <ListGroup variant="flush">
                                                <ListGroup.Item className="text-muted"><i
                                                    className="bi bi-database"></i> Reference sequence</ListGroup.Item>
                                                {assembly.genomic_annotations.length > 0 && (
                                                    assembly.genomic_annotations.map((annotation: Annotation) => {
                                                        return <ListGroup.Item className="text-muted"><i
                                                            className="bi bi-align-center"></i> {annotation.label || annotation.name}
                                                        </ListGroup.Item>
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
