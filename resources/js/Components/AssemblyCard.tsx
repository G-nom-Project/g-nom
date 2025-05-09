import {
    Badge,
    Card,
    OverlayTrigger,
    Tooltip,
    ListGroup,
    Button, Row, Col,
} from 'react-bootstrap';
import placeholder from '../../static/img/dnaPlaceholder.PNG';

interface Props {
    assemblyName: string;
    assemblyID: number;
    ncbiID: number;
    info_text: string;
    mappings: number;
    annotations: number;
    last_update: string;
    public: boolean;
    buscos: number;
    n50: number;
    maxBuscoScore: number;
    repeatmaskers: number;
    taxaminers: number;

}

const AssemblyCard = (props: Props) => {
    return (
        <Card className="md-2 m-2" style={{ width: '100%' }}>
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
                    <a className="text-decoration-none" href={`/assemblies/${props.assemblyID}`}>{props.assemblyName}</a>
                    <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">{(props.public && "Public access") || "Internal use only"}</Tooltip>}>
                        <Badge className="mx-2" bg={(props.public && "success") || "secondary"}><i className={(props.public && "bi bi-unlock-fill") || "bi bi-lock-fill"}></i></Badge>
                    </OverlayTrigger>
                </Card.Title>
                <Card.Subtitle className="text-muted mb-2">NCBI ID: {props.ncbiID}</Card.Subtitle>
                <Card.Text style={{maxHeight:"300px"}}>{props.info_text || <p className="text-muted"><b>No info text available.</b></p>}</Card.Text>
            </Card.Body>
            <ListGroup className="list-group-flush">
                <ListGroup.Item>
                    <Button><i className={"bi bi-bookmark-plus"}></i></Button>
                    <Button className="m-2" href={`/assemblies/${props.assemblyID}`}>Show details <i className="bi bi-arrow-right-circle"></i></Button>
                </ListGroup.Item>
                <ListGroup.Item>
                    <Row>
                        <Col>
                            Annotations: {(props.annotations == 0 && <b className="text-danger">0 available</b>) || <b className="text-success">{props.annotations} available</b>}
                        </Col>
                        <Col>
                            Mappings: {(props.mappings == 0 && <b className="text-danger">0 available</b>) || <b className="text-success">{props.mappings} available</b>}
                        </Col>
                    </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                    <Row>
                        <Col>
                            BUSCO: {(props.buscos === 0 && <b className="text-danger">Not available</b>) || <b className="text-muted">{Math.round(props.maxBuscoScore * 10) / 10}</b>}
                        </Col>
                        <Col>
                            N50: {(props.n50 === 0 && <b className="text-danger">Not available</b>) || <b className="text-muted">{props.n50.toLocaleString().replaceAll(".", ",")} bp</b>}
                        </Col>
                    </Row>

                </ListGroup.Item>
                <ListGroup.Item>
                    <Row>
                        <Col>
                            Repeatmasker: {(props.repeatmaskers === 0 && <b className="text-danger">Not available</b>) || <b className="text-success">Available</b>}
                        </Col>
                        <Col>
                            taXaminer: {(props.taxaminers === 0 && <b className="text-danger">0 available</b>) || <b className="text-success">{props.taxaminers} available</b>}
                        </Col>
                    </Row>

                </ListGroup.Item>
            </ListGroup>
        </Card>
    );
};

export default AssemblyCard;
