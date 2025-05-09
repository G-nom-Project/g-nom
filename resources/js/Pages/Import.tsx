import NotificationListener from '@/Components/NotificationsListener';
import TaxonCard from '@/Components/TaxonCard';
import TopNavBar from '@/Components/TopNavBar';
import axios from 'axios';
import { SyntheticEvent, useState } from 'react';
import {
    Accordion,
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    InputGroup,
    Row,
} from 'react-bootstrap';

const default_taxon = {
    assemblies: [],
    commonName: 'No Taxon selected',
    scientificName: 'No Taxon selected',
    imagepath: null,
    ncbiTaxonID: '0000',
    taxonRank: "no rank"
};

export default function Import() {
    const [import_assembly, setImportAssembly] = useState<boolean>(false);
    const [ref_assembly, setRefAssembly] = useState<boolean>(false);
    const [assemblyFile, setAssemblyFile] = useState<File | null>(null);

    // Taxon Infos
    const [taxonID, setTaxonID] = useState<number>(-1);
    const [selectedTaxonID, setSelectedTaxonID] = useState<number>(-1);
    const [taxon, setTaxon] = useState<any>(default_taxon);
    const [assemblies, setAssemblies] = useState<any>();
    const [invalidID, setInvalidID] = useState(true);

    // Assembly Imports
    const [assemblyName, setAssemblyName] = useState<string>();

    // Existing assemblies
    const [assemblyID, setAssemblyID] = useState<number>(-1);

    // Annotation import
    const [annotationName, setAnnotationName] = useState<string>();
    const [annotationFile, setAnnotationFile] = useState<File | null>(null);
    // Mapping Import
    const [mappingName, setMappingName] = useState<string>();
    const [mappingFile, setMappingFile] = useState<File | null>(null);

    const updateTaxon = () => {
        axios.get('/taxon-assemblies/' + taxonID).then((taxon) => {
            if (taxon.data.taxon) {
                setInvalidID(false);
                setTaxon(taxon.data.taxon);
                setAssemblies(taxon.data.taxon.assemblies);
            } else {
                setInvalidID(true);
                setTaxon(default_taxon);
            }
            setSelectedTaxonID(taxonID);
        });
    };

    const handleAssemblyUpload = async () => {
        if (!assemblyFile) return;

        const formData = new FormData();
        formData.append('assembly', assemblyFile);
        formData.append('taxonID', parseInt(taxonID));
        formData.append('name', assemblyName);

        try {
            const response = await axios.post('/upload-assembly', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload success:', response.data);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const handleAnnotationUpload = async () => {
        if (!annotationFile) return;

        const formData = new FormData();
        formData.append('annotation', annotationFile);
        formData.append('assemblyID', assemblyID);
        formData.append('taxonID', parseInt(taxonID));
        formData.append('name', annotationName);

        try {
            const response = await axios.post('/upload-annotation', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload success:', response.data);
            return True
        } catch (error) {
            console.error('Upload failed:', error);
            return False
        }
    };


    const handleMappingUpload = async () => {
        if (!mappingFile) return;

        const formData = new FormData();
        formData.append('mapping', mappingFile);
        formData.append('assemblyID', assemblyID);
        formData.append('taxonID', parseInt(taxonID));
        formData.append('name', mappingName);

        try {
            const response = await axios.post('/upload-mapping', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            console.log('Upload success:', response.data);
            return True
        } catch (error) {
            console.error('Upload failed:', error);
            return False
        }
    };

    const handleUpload = async () => {
        if (assemblyName) {
            await handleAssemblyUpload()
        } else {
            if (annotationName) {
                const success = await handleAnnotationUpload();
                return success
            }
            if (mappingName) {
                const success = await handleMappingUpload();
                return success
            }
        }
    };

    return (
        <>
            <TopNavBar />
            <NotificationListener />
            <Container className="mt-2">
                <Row>
                    <Col>
                        <Card>
                            <Card.Body>
                                <Card.Title>Select Taxon</Card.Title>
                                <Row>
                                    <Col>
                                        <Form>
                                            <Form.Label>
                                                Enter NCBI Taxonomy ID
                                            </Form.Label>

                                            <InputGroup className="mb-3">
                                                <Form.Control
                                                    aria-label="NCBI taxonomy ID"
                                                    onChange={(
                                                        e: SyntheticEvent,
                                                    ) => {
                                                        setTaxonID(e.target.value);
                                                    }}
                                                />
                                            </InputGroup>
                                            <Button onClick={() => updateTaxon()}>
                                                Select Taxon ID
                                            </Button>
                                            <Alert
                                                className="mt-3"
                                                variant="danger"
                                                show={
                                                    invalidID &&
                                                    selectedTaxonID != -1
                                                }
                                            >
                                                <b>Invalid ID:</b> no Taxon found
                                                for NCBI ID
                                            </Alert>
                                        </Form>
                                    </Col>
                                    <Col>
                                        <Form.Label>Selected Taxon</Form.Label>
                                        <TaxonCard
                                            assemblies={taxon.assemblies}
                                            commonName={taxon.commonName}
                                            scientificName={
                                                taxon.scientificName
                                            }
                                            imagepath={taxon.imagepath}
                                            ncbiTaxonID={taxon.ncbiTaxonID}
                                            ncbiTaxonRank={taxon.taxonRank}
                                        />
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                {!invalidID && (
                    <Row>
                        <Col>
                            <Card className="mt-2">
                                <Card.Body>
                                    <Card.Title>
                                        Import or select a new assembly
                                    </Card.Title>

                                    <Form.Group>
                                        <Form.Check // prettier-ignore
                                            type="checkbox"
                                            id="assembly-import"
                                            label="Import a new assembly"
                                            onClick={(e: SyntheticEvent) =>
                                                setImportAssembly(
                                                    !import_assembly,
                                                )
                                            }
                                        />
                                        <Form.Label>
                                            Select Assembly file (.fa.gz)
                                        </Form.Label>
                                        <Form.Control
                                            type="file"
                                            disabled={!import_assembly}
                                            onChange={(e) =>
                                                setAssemblyFile(
                                                    e.target.files?.[0] ?? null,
                                                )
                                            }
                                        />
                                        <br />
                                        <Form.Label>
                                            Name your assembly
                                        </Form.Label>
                                        <Form.Control
                                            placeholder="Enter a custom name for this assembly"
                                            onChange={(e: any) => {setAssemblyName(e.target.value)}}/>
                                        <br />
                                        <Form.Check // prettier-ignore
                                            type="checkbox"
                                            id="assembly-import"
                                            label="This is a reference assembly"
                                            onClick={(e: SyntheticEvent) =>
                                                setRefAssembly(!ref_assembly)
                                            }
                                        />
                                        <Form.Control
                                            disabled={!ref_assembly}
                                            placeholder="Enter reference assembly ID"
                                        />
                                    </Form.Group>
                                    <hr />
                                    <Form.Group>
                                        <Form.Label>
                                            Select an existing assembly for this
                                            taxon
                                        </Form.Label>
                                        <Form.Select
                                        onChange={(e: any) => {setAssemblyID(e.target.value)}}
                                        >
                                            <option default>Select an assembly</option>
                                            {assemblies?.map((assembly) => {
                                                return <option value={assembly.id}>{assembly.name} {assembly.label && "|" + assembly.label} | {assembly.id}</option>
                                            })}
                                        </Form.Select>
                                    </Form.Group>
                                </Card.Body>
                            </Card>

                            <Card className="mt-2">
                                <Card.Body>
                                    <Card.Title>Import Analyses</Card.Title>
                                    <Card.Text>
                                        Select analysis to import below.
                                        Analysis imports are only available for
                                        existing assemblies.
                                    </Card.Text>
                                    <Accordion>
                                        <Accordion.Item eventKey="annotation">
                                            <Accordion.Header>
                                                Annotation
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <Form.Label>
                                                    Select GFF file
                                                </Form.Label>
                                                <Form.Control
                                                    type="file"
                                                    accept=".gff"
                                                    onChange={(e) =>
                                                        setAnnotationFile(
                                                            e.target.files?.[0] ?? null,
                                                        )
                                                    }
                                                />
                                                <br />
                                                <Form.Label>
                                                    Name annotation
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder="Enter a custom name for this annotation"
                                                    onChange={(e: any) => {setAnnotationName(e.target.value)}}/>
                                                <br />
                                            </Accordion.Body>
                                        </Accordion.Item>
                                        <Accordion.Item eventKey="mapping">
                                            <Accordion.Header>
                                                Mapping
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <Form.Label>
                                                    Select SAM / BAM file
                                                </Form.Label>
                                                <Form.Control
                                                    type="file"
                                                    accept=".sam,.bam"
                                                    onChange={(e) =>
                                                        setMappingFile(
                                                            e.target.files?.[0] ?? null,
                                                        )
                                                    }
                                                />
                                                <br />
                                                <Form.Label>
                                                    Name mapping
                                                </Form.Label>
                                                <Form.Control
                                                    placeholder="Enter a custom name for this annotation"
                                                    onChange={(e: any) => {setMappingName(e.target.value)}}/>
                                                <br />
                                            </Accordion.Body>
                                        </Accordion.Item>
                                        <Accordion.Item eventKey="busco">
                                            <Accordion.Header>
                                                BUSCO
                                            </Accordion.Header>
                                        </Accordion.Item>
                                        <Accordion.Item eventKey="fcat">
                                            <Accordion.Header>
                                                BUSCO
                                            </Accordion.Header>
                                        </Accordion.Item>
                                        <Accordion.Item eventKey="repeatmasker">
                                            <Accordion.Header>
                                                Repeatmasker
                                            </Accordion.Header>
                                        </Accordion.Item>
                                        <Accordion.Item eventKey="taxaminer">
                                            <Accordion.Header>
                                                taXaminer
                                            </Accordion.Header>
                                        </Accordion.Item>
                                    </Accordion>
                                </Card.Body>
                            </Card>
                            <Card className="mt-2">
                                <Card.Body>
                                    <Card.Title>Start Import job</Card.Title>
                                    <Card.Text>
                                        You will be notified once the import is
                                        finished.
                                    </Card.Text>
                                    <Button onClick={handleUpload}>
                                        Start Import
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                )}
            </Container>
        </>
    );
}
