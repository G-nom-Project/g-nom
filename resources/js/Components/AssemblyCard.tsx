import { Badge, Button, Card, Col, ListGroup, OverlayTrigger, Row, Tooltip } from 'react-bootstrap';
import axios from 'axios';
import { useState } from 'react';
import ConservationLevelBadge from '@/Components/Badges/ConservationLevelBadge';
import { truncateAtWord } from '@/utils/text';
import { router } from '@inertiajs/react';
import CollectionsBadge from '@/Components/Badges/CollectionsBadge';
import BUSCOCompletenessBar from '@/Components/BUSCOCompletenessBar';
import FCatCompletenessBar from '@/Components/fCatCompletenessBar';
import { BuscoAnalysis, fCatAnalysis } from '@/types/data';

interface Props {
    assemblyName: string;
    assemblyID: number;
    ncbiID: number;
    info_text: string;
    mappings: number;
    annotations: number;
    last_update: string;
    public: boolean;
    buscos: BuscoAnalysis[];
    fcats: fCatAnalysis[];
    n50: number;
    maxBuscoScore: number;
    repeatmaskers: number;
    taxaminers: number;
    taxon_updated_at: string;
    is_bookmarked: boolean | null;
    taxon_name: string;
    conservation_status: string|null;
    wiki_image: string | null;
    is_wiki_text: boolean | null;
    collections: [];
}



const AssemblyCard = (props: Props) => {
    const [isBookmarked, setIsBookmarked] = useState(props.is_bookmarked || false);

    const setBookmark = () => {
        axios.post(`/assemblies/${props.assemblyID}/bookmark`)
            .then(() => setIsBookmarked(true));
    }

    const deleteBookmark = () => {
        axios.delete(`/assemblies/${props.assemblyID}/bookmark`).then(() => setIsBookmarked(false));
    };


    return (
        <Card
            className="h-100"
            style={{
                width: '100%',
                minWidth: '280px',
            }}
        >
            <Card.Img
                className="image-class-name img-responsive"
                variant="top"
                src={props.wiki_image || `${route('taxon.image', [props.ncbiID])}?updated=${props.taxon_updated_at}`}
                style={{
                    height: '200px',
                    objectFit: 'cover',
                    backgroundColor: '#D1D5DB',
                }}
            />
            <Card.Body>
                <Card.Title>
                    <a className="text-decoration-none" href={`/assemblies/${props.assemblyID}`}>
                        {props.taxon_name}
                    </a>
                    <br />
                    <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">{(props.public && 'Public access') || 'Internal use only'}</Tooltip>}>
                        <Badge bg={(props.public && 'success') || 'secondary'}>
                            <i className={(props.public && 'bi bi-unlock-fill') || 'bi bi-lock-fill'}></i>
                        </Badge>
                    </OverlayTrigger>{' '}
                    <CollectionsBadge collections={props.collections} />{' '}
                    {<ConservationLevelBadge status={props.conservation_status}></ConservationLevelBadge>}
                </Card.Title>
                <Card.Subtitle className="text-muted mb-2">
                    <i>{props.assemblyName}</i> (NCBI: {props.ncbiID})
                </Card.Subtitle>
                <Card.Text style={{ height: '14rem' }}>
                    {(props.info_text && truncateAtWord(props.info_text, 450)) || (
                        <p className="text-muted">
                            <b>No info text available.</b>
                        </p>
                    )}{' '}
                    {props.is_wiki_text && (
                        <Badge>
                            <i className="bi bi-wikipedia"></i>
                        </Badge>
                    )}
                </Card.Text>
            </Card.Body>
            <ListGroup className="list-group-flush">
                <ListGroup.Item>
                    <Button
                        onClick={(!isBookmarked && (() => setBookmark())) || (() => deleteBookmark())}
                        variant={isBookmarked ? 'danger' : 'primary'}
                    >
                        <i className={!isBookmarked ? 'bi bi-bookmark-plus' : 'bi bi-bookmark-dash'}></i>
                    </Button>
                    <Button className="m-2" onClick={() => router.visit(route('assemblies.show', [props.assemblyID]))}>
                        Show details <i className="bi bi-arrow-right-circle"></i>
                    </Button>
                </ListGroup.Item>
                <ListGroup.Item>
                    <Row>
                        <Col>
                            Annotations:{' '}
                            {(props.annotations == 0 && <b className="text-danger">0 available</b>) || (
                                <b className="text-success">{props.annotations} available</b>
                            )}
                        </Col>
                        <Col>
                            Mappings:{' '}
                            {(props.mappings == 0 && <b className="text-danger">0 available</b>) || (
                                <b className="text-success">{props.mappings} available</b>
                            )}
                        </Col>
                    </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                    <Row>
                        <Col>
                            Repeatmasker:{' '}
                            {(props.repeatmaskers === 0 && <i className="bi bi-x-lg text-danger" />) || <i className="bi bi-check-lg text-success" />}
                        </Col>
                        <Col>
                            taXaminer:{' '}
                            {(props.taxaminers === 0 && <b className="text-danger">0 available</b>) || (
                                <b className="text-success">{props.taxaminers} available</b>
                            )}
                        </Col>
                    </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                    {(props.buscos.length > 0 && <BUSCOCompletenessBar analyses={props.buscos} />) || (
                        <BUSCOCompletenessBar analyses={[]}/>
                    )}

                    {(props.fcats.length > 0 && <FCatCompletenessBar analysis={props.fcats[0]} />) || (
                        <BUSCOCompletenessBar analyses={[]} name={'fCat'} />
                    )}
                </ListGroup.Item>
            </ListGroup>
        </Card>
    );
};

export default AssemblyCard;
