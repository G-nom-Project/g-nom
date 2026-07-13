import { Collection } from '@/types/data';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

const CollectionsBadge = ({ collections }: { collections: Collection[]}) => {
    const collections_list = collections.map((each: Collection) => {
        return each.name
    })
    const collections_string = collections_list.join(',')


    return (
        <>
            {(collections.length > 0 && (
                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">{'Part of ' + collections_string}</Tooltip>}>
                    <Badge>
                        <i className="bi bi-collection"></i>
                    </Badge>
                </OverlayTrigger>
            )) || (
                <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Not part of any collection</Tooltip>}>
                    <Badge bg={'none'} style={{ backgroundColor: 'lightgrey' }}>
                        <i className="bi bi-collection"></i>
                    </Badge>
                </OverlayTrigger>
            )}
        </>
    );

}

export default CollectionsBadge;
