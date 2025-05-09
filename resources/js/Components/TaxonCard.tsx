import {
    Badge,
    Card,
    OverlayTrigger,
    Tooltip,
    ListGroup,
    Button, Row, Col, ListGroupItem,
} from 'react-bootstrap';
import placeholder from '../../static/img/dnaPlaceholder.PNG';

interface Props {
    assemblies: [];
    commonName: string | null;
    scientificName: string;
    imagepath: string | null;
    ncbiTaxonID: number;
    ncbiTaxonRank: string;
}

const TaxonCard = (props: Props) => {
    return (
        <Card className="md-2">
            <Card.Img
                className="image-class-name img-responsive"
                variant="top"
                src={placeholder}
                style={{
                    height: '200px',
                    objectFit: 'cover',
                    backgroundColor: '#D1D5DB',
                }}
            />
            <Card.Body>
                <Card.Title>
                    {props.scientificName}
                </Card.Title>
                <Card.Subtitle className="text-muted mb-2">NCBI ID: {props.ncbiTaxonID} | {props.ncbiTaxonRank}</Card.Subtitle>
            </Card.Body>
            <ListGroup className="list-group-flush">
                <ListGroup.Item>
                    Common Name: {props.commonName || "No common name provided"}
                </ListGroup.Item>
                <ListGroup.Item>
                    Assemblies: {props.assemblies.length}
                </ListGroup.Item>
            </ListGroup>
        </Card>
    );
};

export default TaxonCard;
