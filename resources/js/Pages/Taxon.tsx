import TopNavBar from "@/Components/TopNavBar";
import NotificationListener from "@/Components/NotificationsListener";
import {Button, Card, Col, Container, Form, ListGroup, Modal, Placeholder, Row, Tab, Tabs} from "react-bootstrap";
import TaxMap from "@/Components/AssemblyPage/TaxMap";
import {getGeoData, getLineage, getTaxonInfo} from "@/REST/taxon";
import {useEffect, useState} from "react";
import InputGroup from 'react-bootstrap/InputGroup';
import axios from "axios";

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

    // Upload only
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [iconFile, setIconFile] = useState<File | null>(null);
    const [imageCredit, setImageCredit] = useState();

    const handleImageUpload = async () => {
        if (!imageFile) return;

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('taxonID', taxon.ncbiTaxonID);
        formData.append('credit', imageCredit);

        try {
            const response = await axios.post('/taxon/upload-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload success:', response.data);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const handleIconUpload = async () => {
        if (!iconFile) return;

        const formData = new FormData();
        formData.append('icon', iconFile);
        formData.append('taxonID', taxon.ncbiTaxonID);

        try {
            const response = await axios.post('/taxon/upload-icon', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload success:', response.data);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const handleUpdateTexts = async () => {
        const formData = new FormData();
        formData.append('taxonID', taxon.ncbiTaxonID);
        formData.append('headline', taxonHeadline);
        formData.append('text', taxonInfo);

        try {
            const response = await axios.post('/taxon/update-infos', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Update success:', response.data);
        } catch (error) {
            console.error('Update failed:', error);
        }
    }

    useEffect(() => {
        const fetchTaxonData = async () => {
            try {

                // Taxon Info Text
                const info_response = await getTaxonInfo(taxon.ncbiTaxonID);
                if (info_response.data.infos[0]) {
                    setTaxonInfo(info_response.data.infos[0]?.text)
                    setTaxonHeadline(info_response.data.infos[0]?.headline)
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
            fetchTaxonData().then( () =>
                setImageCredit(taxon.imageCredit)
            );
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
                                            src={`/taxon/${taxon.ncbiTaxonID}/image?updated=${taxon.updated_at}`}
                                            alt="Card image"
                                            style={{
                                                height: '400px',
                                                objectFit: 'cover',
                                                backgroundColor: '#D1D5DB',
                                            }}
                                        />
                                        <Card.Body>
                                            Image Credit: {imageCredit}
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
                                <Card.Text>
                                    <Form>
                                        <Form.Group className="mb-3">
                                            <Form.Control as="textarea" rows={3} value={taxonHeadline} onChange={(e) => setTaxonHeadline(e.target.value)}/>
                                        </Form.Group>
                                    </Form>
                                    <hr/>
                                    <Form>
                                        <Form.Group className="mb-3">
                                            <Form.Control as="textarea" rows={10} value={taxonInfo} onChange={(e) => setTaxonInfo(e.target.value)}/>
                                        </Form.Group>
                                    </Form>
                                    <Button onClick={() => handleUpdateTexts()}><i className="bi bi-pencil-square"></i> Save</Button>
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
                            <Form.Control type="file" onChange={(e) => setImageFile(e.target?.files?.[0] ?? null)}/>
                        </InputGroup>
                        <InputGroup className="mt-2">
                            <InputGroup.Text id="basic-addon1">Image Credit</InputGroup.Text>
                            <Form.Control type="text" onChange={(e) => setImageCredit(e.target.value)} value={imageCredit}></Form.Control>
                        </InputGroup>
                        <hr/>
                        <p>Upload a SVG Image to be shown in the top left navbar on all assembly pages with this Taxon ID.</p>
                        {
                            taxon.phylopic && <img
                                src={`/taxon/${taxon.ncbiTaxonID}/icon?updated=${taxon.updated_at}`}
                                alt="Taxon Icon"
                                style={{
                                    height: "80px",
                                    filter: "invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%)",
                                    backgroundColor: "grey",
                                    padding:"10px"
                                }}
                                className="m-1 rounded"
                            />
                        }
                        <InputGroup>
                            <Form.Control type="file" onChange={(e) => setIconFile(e.target?.files?.[0] ?? null)}/>
                        </InputGroup>
                        <hr/>
                        <p>You may have to reload the page for changes to take effect.</p>
                        <Button className="mt-1" variant="danger" onClick={() => setEditImage(false)}>Cancel</Button>
                        <Button className="ml-1 mt-1" variant="success" onClick={() => {handleImageUpload();handleIconUpload().then(r => setEditImage(false))}}>Save</Button>

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
