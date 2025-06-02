import {
    Card,
    ListGroup,
    Button,
    Form,
} from 'react-bootstrap';
import placeholder from '../../static/img/dnaPlaceholder.PNG';
import {useState} from "react";
import {Taxon} from "@/types/data";

interface Props {
    taxon: Taxon
    withAssemblySelection: boolean;
}

const TaxonCard = (props: Props) => {
    const [assemblyID, setAssemblyID] = useState(-1);

    return (
        <Card className="md-2">
            <Card.Img
                className="image-class-name img-responsive"
                variant="top"
                src={placeholder as string}
                style={{
                    height: '200px',
                    objectFit: 'cover',
                    backgroundColor: '#D1D5DB',
                }}
            />
            <Card.Body>
                <Card.Title>
                    {props.taxon.scientificName}
                </Card.Title>
                <Card.Subtitle className="text-muted mb-2">NCBI ID: {props.taxon.ncbiTaxonID} | {props.taxon.ncbiTaxonRank}</Card.Subtitle>
                <Card.Text>
                    {
                        // TODO: Taxon Info Text
                    }
                </Card.Text>
            </Card.Body>
            <ListGroup className="list-group-flush">
                {(props.withAssemblySelection && props.taxon.assemblies.length > 0) && (
                    <ListGroup.Item>
                        <Form.Group>
                            <Form.Label>
                                Select an existing assembly for this taxon
                            </Form.Label>
                            <Form.Select
                                onChange={(e: any) => {setAssemblyID(e.target.value)}}
                            >
                                <option default>Select an assembly</option>
                                {props.taxon.assemblies.map((assembly) => {
                                    return <option value={assembly.id}>{assembly.name} {assembly.label && "|" + assembly.label} | {assembly.id}</option>
                                })}
                            </Form.Select>
                            <br/>
                            <Button  href={`/assemblies/${assemblyID}`} disabled={assemblyID == -1}><i className="bi bi-arrow-right"></i> Go to Assembly</Button>
                        </Form.Group>
                    </ListGroup.Item>
                )}
                <ListGroup.Item>
                    Common Name: {props.taxon.commonName || "No common name provided"}
                </ListGroup.Item>
                <ListGroup.Item>
                    Assemblies: {props.taxon.assemblies.length}
                </ListGroup.Item>
            </ListGroup>
        </Card>
    );
};

export default TaxonCard;
