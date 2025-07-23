import TopNavBar from "@/Components/TopNavBar";
import NotificationListener from "@/Components/NotificationsListener";
import {Button, Card, Col, Container, Form, ListGroup, Modal, Placeholder, Row, Tab, Tabs} from "react-bootstrap";
import placeholder_image from "../../static/img/dnaPlaceholder.PNG";
import TaxMap from "@/Components/AssemblyPage/TaxMap";
import {getGeoData, getLineage, getTaxonHeadline, getTaxonInfo} from "@/REST/taxon";
import {useEffect, useState} from "react";
import InputGroup from 'react-bootstrap/InputGroup';

export default function Taxon({ taxon }) {
    const [lineage, setLineage] = useState<any[] | null>(null);
    const [geoData, setGeoData] = useState([]);
    const [activeTab, setActiveTab] = useState("image");

    // Taxon Information
    const [taxonHeadline, setTaxonHeadline] = useState<string>("");
    const [taxonInfo, setTaxonInfo] = useState("");

    // Modals
    const [showEditImage, setEditImage] = useState<boolean>(false);
    const [showEditGeo, setEditGeo] = useState<boolean>(false);

    useEffect(() => {
        const fetchTaxonData = async () => {
            try {
                // Taxon Headline
                const headline_response = await getTaxonHeadline(taxon.ncbiTaxonID);
                if (headline_response.data.infos[0]) {
                    setTaxonHeadline(headline_response.data.infos[0]?.text)
                } else {
                    setTaxonHeadline("No Taxon headline available")
                }

                // Taxon Info Text
                const info_response = await getTaxonInfo(taxon.ncbiTaxonID);
                if (info_response.data.infos[0]) {
                    setTaxonInfo(info_response.data.infos[0]?.text)
                }

                // Taxon Geo Data
                const data = await getGeoData(taxon.ncbiTaxonID);
                setGeoData(data.geo_data);

                // NCBI Lineage
                const new_lineage = await getLineage(taxon.ncbiTaxonID);
                setLineage(new_lineage);

            } catch (error) {
                console.error('Error fetching Taxon data:', error);
            }
        }

        if (taxon.ncbiTaxonID) {
            fetchTaxonData().then();
        }
    }, []);

    return (
        <>
            <TopNavBar/>
            <NotificationListener />
            <Container className="mt-2">
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
                                            Image Credit: {taxon.imageCredit}
                                            <br/>
                                            <Button onClick={() => setEditImage(true)}><i className="bi bi-pencil-square"></i> Edit Taxon Image</Button>
                                        </Card.Body>
                                    </Card>
                                </Tab>
                                <Tab title="Map" eventKey="overview-map">
                                    {activeTab === "overview-map" && (
                                        <Card className="m-1 shadow" style={{ height: "450px" }}>

                                            <TaxMap isVisible={true} geoDataMeta={geoData}/>
                                            <Card.Body>
                                                <Button className="m-2" onClick={() => setEditGeo(true)}><i className="bi bi-pencil-square"></i> Edit Geo Data</Button>
                                            </Card.Body>
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
                                    {taxon.commonName || taxon.scientificName}
                                </Card.Title>
                                <Card.Subtitle className="text-muted mb-2">

                                </Card.Subtitle>
                                <Card.Text>
                                    <Form>
                                        <Form.Group className="mb-3">
                                            <Form.Control as="textarea" rows={3} value={taxonHeadline} onChange={(e) => setTaxonHeadline(e.target.value)}/>
                                        </Form.Group>
                                    </Form>
                                    <Button><i className="bi bi-pencil-square"></i> Save</Button>
                                    <hr/>
                                    <Form>
                                        <Form.Group className="mb-3">
                                            <Form.Control as="textarea" rows={10} value={taxonInfo} onChange={(e) => setTaxonInfo(e.target.value)}/>
                                        </Form.Group>
                                    </Form>
                                    <Button><i className="bi bi-pencil-square"></i> Save</Button>
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
                                            {` (${taxon.ncbiTaxonID})`}
                                        </>
                                    ) : (
                                        <Placeholder as="p" animation="glow">
                                            <Placeholder xs={12} />
                                        </Placeholder>
                                    )}
                                </ListGroup.Item>
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>
                <Modal show={showEditImage}>
                    <Modal.Body>
                        <Modal.Title>
                            Upload a new Taxon Image
                        </Modal.Title>
                        <p>Uploading a new image will replace the previous one. Please provide proper image credit for all uploaded images and only upload images you have permission to use.</p>
                        <InputGroup>
                            <Form.Control type="file" />
                        </InputGroup>
                        <InputGroup className="mt-2">
                            <InputGroup.Text id="basic-addon1">Image Credit</InputGroup.Text>
                            <Form.Control type="text"></Form.Control>
                        </InputGroup>
                        <Button className="mt-1" variant="danger" onClick={() => setEditImage(false)}>Cancel</Button>
                        <Button className="ml-1 mt-1" variant="success" onClick={() => setEditImage(false)}>Save</Button>

                    </Modal.Body>
                </Modal>
                <Modal show={showEditGeo}>
                    <Modal.Body>
                        <Modal.Title>
                            Edit Taxon Image
                        </Modal.Title>
                        <table>
                            <thead>
                            <tr>
                                <th className="table-cells">Title</th>
                                <th className="table-cells" style={{width: "10%"}}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {
                                geoData.map((each) => {
                                    return <tr>
                                        <th className="table-cells">{each.name}</th>
                                        <th className="table-cells" style={{textAlign: "center"}}><Button size="sm" variant="danger"><i className="bi bi-trash-fill"></i></Button></th>
                                    </tr>
                                })
                            }
                            <tr>
                                <th className="table-cells" style={{textAlign: "center"}}><Button size="sm">Add new</Button></th>
                                <th className="table-cells" style={{textAlign: "center"}}><Button size="sm" disabled={true} variant="danger"><i className="bi bi-trash-fill"></i></Button></th>
                            </tr>
                            </tbody>
                        </table>
                        <br/>
                        <Button className="ml-1" onClick={() => setEditGeo(false)}>Close</Button>
                    </Modal.Body>
                </Modal>
            </Container>
        </>
    )
}
