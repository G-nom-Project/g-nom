import ConservationLevelBadge from '@/Components/ConservationLevelBadge';
import { truncateAtWord } from '@/utils/text';
import { router } from '@inertiajs/react';
import { Badge, Button, Card, Col, ListGroup, Row} from 'react-bootstrap';

import { useEffect, useState } from 'react';
import { Taxon } from '@/types/data';

interface Props {
    taxon: Taxon;
}
const RichTaxonCard = (props: Props) => {
    const [preferredText, setPreferredText] = useState('');
    const [isWikiText, setIsWikiText] = useState(false);

    useEffect(() => {
        if (props.taxon?.infos?.length > 0) {
            setPreferredText(props.taxon.infos[0].headline);
            setIsWikiText(false);
        } else if (props.taxon?.wikipedia_summary) {
            setPreferredText(props.taxon.wikipedia_summary);
            setIsWikiText(true);
        } else {
            setPreferredText('No information available.');
            setIsWikiText(false);
        }
    }, [props.taxon?.infos?.[0]?.headline, props.taxon?.wikipedia_summary]);

    return (
        <Card className="md-2 assembly-card m-3" style={{ width: '100%', maxHeight: '750px' }}>
            <Card.Img
                className="image-class-name img-responsive"
                variant="top"
                src={props.taxon.wiki_image || `/taxon/${props.taxon.ncbiTaxonID}/image?updated=${props.taxon.updated_at}`}
                style={{
                    height: '300px',
                    objectFit: 'cover',
                    backgroundColor: '#D1D5DB',
                }}
            />
            <Card.Body>
                <Card.Title>
                    <a className="text-decoration-none" href={`/assemblies?search=${props.taxon.ncbiTaxonID}`}>
                        {props.taxon.scientificName}
                    </a>
                    {'  '}
                    {<ConservationLevelBadge status={props.taxon.conservation_status}></ConservationLevelBadge>}
                </Card.Title>
                <Card.Subtitle className="text-muted mb-2">(NCBI: {props.taxon.ncbiTaxonID})</Card.Subtitle>
                <Card.Text style={{ maxHeight: '300px' }}>
                    {(truncateAtWord(preferredText, 500))}
                    {'  '}
                    {isWikiText && (
                        <Badge>
                            <i className="bi bi-wikipedia"></i>
                        </Badge>
                    )}
                </Card.Text>
            </Card.Body>
            <ListGroup className="list-group-flush">
                <ListGroup.Item>
                    {
                        // A numeric search query will automatically be rewritten to an exact taxID match on the backend
                    }
                    <Button onClick={() => router.visit('/assemblies?search=' + props.taxon.ncbiTaxonID)}>
                        Show all Assemblies <i className="bi bi-arrow-right-circle"></i>
                    </Button>
                </ListGroup.Item>
                <ListGroup.Item>
                    <Row>
                        <Col>
                            Assemblies: <b className="text-success">{props.taxon.assemblies.length} available</b>
                        </Col>
                        <Col>
                            Taxonomic rank: <b className={'text-muted'}>{props.taxon.taxonRank}</b>
                        </Col>
                    </Row>
                </ListGroup.Item>
            </ListGroup>
        </Card>
    );
};

export default RichTaxonCard;
