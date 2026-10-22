import {
    Badge,
    Button,
    Card,
    OverlayTrigger,
    Tooltip,
} from 'react-bootstrap';
import axios from 'axios';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import ConservationLevelBadge from '@/Components/Badges/ConservationLevelBadge';
import BUSCOCompletenessBar from '@/Components/BUSCOCompletenessBar';
import FCatCompletenessBar from '@/Components/fCatCompletenessBar';
import { truncateAtWord } from '@/utils/text';
import { BuscoAnalysis, Collection, fCatAnalysis } from '@/types/data';


interface Props {
    assemblyName: string,
    assemblyID: number,
    ncbiID: number,
    info_text: string | null,
    mappings: number,
    annotations: number,
    public: boolean,
    buscos: BuscoAnalysis[],
    fcats: fCatAnalysis[],
    n50: number,
    maxBuscoScore: number,
    repeatmaskers: number,
    taxaminers: number,
    taxon_updated_at: string,
    is_bookmarked: boolean | null,
    taxon_name: string,
    conservation_status: string | null,
    wiki_image: string | null,
    is_wiki_text: boolean | null,
    collections: Collection[],
    last_update?: string
}

export default function AssemblyCard(props: Props) {
    const [isBookmarked, setIsBookmarked] = useState(
        props.is_bookmarked ?? false
    );
    const [bookmarkPending, setBookmarkPending] = useState(false);

    const toggleBookmark = async () => {
        if (bookmarkPending) return;

        setBookmarkPending(true);

        try {
            if (isBookmarked) {
                await axios.delete(
                    `/assemblies/${props.assemblyID}/bookmark`
                );
                setIsBookmarked(false);
            } else {
                await axios.post(
                    `/assemblies/${props.assemblyID}/bookmark`
                );
                setIsBookmarked(true);
            }
        } catch (error) {
            console.error('Failed to update bookmark:', error);
        } finally {
            setBookmarkPending(false);
        }
    };

    const imageUrl =
        props.wiki_image ||
        `${route('taxon.image', [props.ncbiID])}?updated=${props.taxon_updated_at}`;

    const showDetails = () => {
        router.visit(route('assemblies.show', [props.assemblyID]));
    };

    return (
        <Card className="assembly-card h-100">

            {/* Image */}
            <div className="assembly-card-image">
                <Card.Img
                    variant="top"
                    src={imageUrl}
                    alt={props.taxon_name}
                />

                <div className="assembly-image-badges">
                    <OverlayTrigger
                        overlay={
                            <Tooltip>
                                {props.public
                                    ? 'Public access'
                                    : 'Internal use only'}
                            </Tooltip>
                        }
                    >
                        <Badge
                            bg={props.public ? 'success' : 'secondary'}
                            className="assembly-access-badge"
                        >
                            <i
                                className={`bi bi-${
                                    props.public
                                        ? 'unlock'
                                        : 'lock'
                                } me-1`}
                            />
                            {props.public ? 'Public' : 'Internal'}
                        </Badge>
                    </OverlayTrigger>
                    {' '}
                    <ConservationLevelBadge
                        status={props.conservation_status}
                    />
                </div>
            </div>

            <Card.Body className="d-flex flex-column p-4">

                {/* Title and bookmark */}
                <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1 overflow-hidden">
                        <h3 className="assembly-card-title">
                            <a
                                href={`/assemblies/${props.assemblyID}`}
                                className="text-decoration-none"
                            >
                                {props.taxon_name}
                            </a>
                        </h3>
                        <div className="assembly-card-subtitle">
                            <span className="text-truncate d-block">
                                <i>{props.assemblyName}</i>
                            </span>
                        </div>
                    </div>

                    <Button
                        variant="light"
                        className={`assembly-bookmark ${
                            isBookmarked ? 'active' : ''
                        }`}
                        onClick={toggleBookmark}
                        disabled={bookmarkPending}
                        aria-label={
                            isBookmarked
                                ? 'Remove bookmark'
                                : 'Add bookmark'
                        }
                        title={
                            isBookmarked
                                ? 'Remove bookmark'
                                : 'Add bookmark'
                        }
                    >
                        <i
                            className={`bi bi-bookmark${
                                isBookmarked ? '-fill' : ''
                            }`}
                        />
                    </Button>
                </div>

                {/* Description */}
                <div className="assembly-description">
                    {props.info_text ? (
                        <p className="mb-0">
                            {truncateAtWord(props.info_text, 240)}
                            {props.is_wiki_text && (
                                <i
                                    className="bi bi-wikipedia ms-2 text-secondary"
                                    title="Wikipedia source"
                                />
                            )}
                        </p>
                    ) : (
                        <p className="text-secondary fst-italic mb-0">
                            No description available.
                        </p>
                    )}
                </div>

                <hr className="assembly-divider" />

                {/* Data availability */}
                <div className="assembly-section-label">
                    AVAILABLE DATA
                </div>

                <div className="assembly-metrics">
                    <div className="assembly-metric">
                        <span className="assembly-metric-value">
                            {props.annotations}
                        </span>
                        <span className="assembly-metric-label">
                            Annotations
                        </span>
                    </div>

                    <div className="assembly-metric">
                        <span className="assembly-metric-value">
                            {props.mappings}
                        </span>
                        <span className="assembly-metric-label">
                            Mappings
                        </span>
                    </div>

                    <div className="assembly-metric">
                        <span className="assembly-metric-value">
                            {props.repeatmaskers > 0 ? (
                                <i className="bi bi-check-lg text-success" />
                            ) : (
                                <span className="text-secondary">—</span>
                            )}
                        </span>
                        <span className="assembly-metric-label">
                            RepeatMasker
                        </span>
                    </div>

                    <div className="assembly-metric">
                        <span className="assembly-metric-value">
                            {props.taxaminers}
                        </span>
                        <span className="assembly-metric-label">
                            taXaminer
                        </span>
                    </div>
                </div>

                <hr className="assembly-divider" />

                {/* Quality */}
                <div className="assembly-section-label">
                    ASSEMBLY QUALITY
                </div>

                <div className="assembly-quality mb-2">
                    <BUSCOCompletenessBar
                        analyses={props.buscos}
                    />

                    {props.fcats.length > 0 ? (
                        <FCatCompletenessBar
                            analysis={props.fcats[0]}
                            name="fCat"
                        />
                    ) : (
                        <BUSCOCompletenessBar
                            analyses={[]}
                            name="fCat"
                        />
                    )}
                </div>
                <hr className="assembly-divider" />
                {/* Footer */}
                <div className="mt-auto">
                    <Button
                        variant="primary"
                        className="assembly-details-button w-100"
                        onClick={showDetails}
                    >
                        <span>View assembly</span>
                        <i className="bi bi-arrow-up-right" />
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
}
