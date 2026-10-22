import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';


const ConservationLevelBadge = ({ status }: { status: string|null}) => {
    const levels = {
        'Least Concern': { short: 'LC', type: 'success' },
        'Near Threatened': { short: 'NL', type: 'secondary' },
        'Vulnerable': { short: 'NU', type: 'warning' },
        'Endangered': { short: 'EN', type: 'danger' },
        'Endangered status': { short: 'EN', type: 'danger' },
        'Critically Endangered': { short: 'CR', type: 'danger' },
        'Extinct in the Wild': { short: 'EW', type: 'dark' },
        'Extinct': { short: 'EX', type: 'dark' },
        'Data Deficient': { short: 'DD', type: 'secondary' },
    };

    return (
            levels[status as keyof typeof levels] &&
                <OverlayTrigger placement="top" overlay={<Tooltip id="button-tooltip-2">IUCN: <b>{status}</b></Tooltip>}>
                    <Badge bg={levels[status as keyof typeof levels].type} className="assembly-access-badge">
                        <i className="bi bi-activity"></i> {status}
                    </Badge>
                </OverlayTrigger>
            ||
                <OverlayTrigger placement="top" overlay={<Tooltip id="button-tooltip-2">IUCN status unknown</Tooltip>}>
                    <Badge bg='secondary' className="assembly-access-badge">
                        <i className="bi bi-activity"></i>
                    </Badge>
                </OverlayTrigger>
    );
}

export default ConservationLevelBadge;
