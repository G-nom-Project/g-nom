import TopNavBar from '@/Components/TopNavBar';
import TaxMap from '@/Components/AssemblyPage/TaxMap';
import { getGeoData, getLineage, getTaxonInfo } from '@/REST/taxon';
import { Taxon, TaxonData } from '@/types/data';
import {
    Badge, Card, Col, Container, Placeholder, Row
} from 'react-bootstrap';
import { useEffect, useState } from 'react';

export default function EditTaxon({ taxon }: { taxon: Taxon }) {
    const [lineage, setLineage] = useState<TaxonData[] | null>(null);
    const [geoData, setGeoData] = useState([]);
    // const [taxonHeadline, setTaxonHeadline] = useState('');
    const [taxonInfo, setTaxonInfo] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        // setTaxonHeadline(taxon.infos?.[0]?.headline || '');
        setTaxonInfo(taxon.infos?.[0]?.text || '');

        async function load() {
            setLoading(true);

            const [info, geo, ancestry] =
                await Promise.allSettled([
                    getTaxonInfo(taxon.ncbiTaxonID),
                    getGeoData(taxon.ncbiTaxonID),
                    getLineage(taxon.ncbiTaxonID),
                ]);

            if (cancelled) return;

            if (info.status === 'fulfilled') {
                const data = info.value.data.infos?.[0];
                if (data) {
                    //setTaxonHeadline(data.headline || '');
                    setTaxonInfo(data.text || '');
                }
            }

            if (geo.status === 'fulfilled') {
                setGeoData(geo.value.geo_data || []);
            }

            if (ancestry.status === 'fulfilled') {
                setLineage(ancestry.value);
            }

            setLoading(false);
        }

        load();

        return () => { cancelled = true; };
    }, [taxon.ncbiTaxonID, taxon.infos]);

    const imageUrl = taxon.wiki_image ||
        `${route('taxon.image', [taxon.ncbiTaxonID])}?updated=${taxon.updated_at}`;

    const title = taxon.commonName || taxon.scientificName;
    const hasMap = geoData.length > 0;

    return (
        <>
            <TopNavBar />

            <Container className="taxon-profile py-4 py-lg-5">

                {/* Hero */}
                <section className="taxon-hero mb-4">
                    <div className="taxon-hero-image">
                        <img src={imageUrl} alt={title || "Taxon Hero Image"} />
                        <div className="taxon-hero-gradient" />
                    </div>

                    <div className="taxon-hero-content">
                        <Badge bg="light" text="dark"
                               className="mb-3 fw-medium">
                            Species profile
                        </Badge>

                        <h1 className="display-5 fw-semibold mb-1" style={{textTransform: 'capitalize'}}>
                            {title}
                        </h1>

                        <p className="fs-5 fst-italic mb-3 opacity-75">
                            {taxon.scientificName}
                        </p>

                        <div className="d-flex flex-wrap gap-2">
                            <span className="taxon-hero-chip">
                                <i className="bi bi-database me-2" />
                                NCBI {taxon.ncbiTaxonID}
                            </span>
                        </div>
                    </div>

                    {taxon.imageCredit && (
                        <div className="taxon-image-credit">
                            {taxon.imageCredit}
                        </div>
                    )}
                </section>

                {/* Content */}
                <Row className="g-4 mb-4">
                    <Col lg={7}>
                        <Card className="gnom-panel h-100">
                            <Card.Body className="p-3 p-lg-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div>
                                        <div className="taxon-section-label mb-1">
                                            General Information
                                        </div>
                                        <h2 className="h5 fw-semibold mb-0">
                                            Taxon Overview
                                        </h2>
                                    </div>
                                    <i className="bi bi-book fs-4 text-secondary" />
                                </div>
                                {loading && !taxonInfo ? (
                                    <Placeholder animation="glow">
                                        <Placeholder xs={12} />
                                        <Placeholder xs={10} />
                                        <Placeholder xs={11} />
                                    </Placeholder>
                                ) : (
                                    <div className="taxon-description">
                                        {taxonInfo ||
                                            taxon.wikipedia_summary ||
                                            'No description available.'}
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        <Card className="gnom-panel h-100">
                            <Card.Body className="p-3 p-lg-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div>
                                        <div className="taxon-section-label mb-1">
                                            Distribution
                                        </div>
                                        <h2 className="h5 fw-semibold mb-0">
                                            Geodata records
                                        </h2>
                                    </div>
                                    <i className="bi bi-globe-europe-africa fs-4 text-secondary" />
                                </div>

                                <div className="taxon-map">
                                    {hasMap ? (
                                        <TaxMap
                                            isVisible={true}
                                            geoDataMeta={geoData}
                                        />
                                    ) : (
                                        <div className="d-flex align-items-center justify-content-center h-100 text-secondary">
                                            {loading
                                                ? 'Loading map…'
                                                : 'No geographic records available'}
                                        </div>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Taxonomy */}
                <Card className="gnom-panel mb-4">
                    <Card.Body className="p-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <div className="taxon-section-label mb-1">
                                    Classification
                                </div>
                                <h2 className="h5 fw-semibold mb-0">
                                    Taxonomic lineage
                                </h2>
                            </div>
                            <i className="bi bi-diagram-3 fs-4 text-secondary" />
                        </div>

                        <div className="d-flex flex-wrap align-items-center gap-2">
                            {lineage ? (
                                lineage
                                    .filter(item =>
                                        item.scientificName !== 'root'
                                    )
                                    .map((item, index) => (
                                        <div
                                            key={item.ncbiTaxonID}
                                            className="d-flex align-items-center gap-2"
                                        >
                                            {index > 0 && (
                                                <i className="bi bi-chevron-right text-secondary small" />
                                            )}
                                            <a
                                                className="taxon-lineage-chip"
                                                href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${item.ncbiTaxonID}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {item.scientificName}
                                            </a>
                                        </div>
                                    ))
                            ) : (
                                <Placeholder xs={8} animation="glow" />
                            )}
                        </div>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-between align-items-center px-1 small text-secondary">
                    <span>NCBI Taxonomy ID: {taxon.ncbiTaxonID}</span>
                    <span>Last updated: {taxon.updated_at}</span>
                </div>
            </Container>
        </>
    );
}
