import JBrowseView from '@/Components/AssemblyPage/JBrowseView';
import RepeatMaskerViewer from '@/Components/AssemblyPage/RepeatMaskerViewer';
import TaxMap from '@/Components/AssemblyPage/TaxMap';
import { TaxaminerDashboard } from '@/Components/AssemblyPage/TaxonomicAssignmentDashboard/dashboard';
import TopNavBar from '@/Components/TopNavBar';
import { getLineage, getTaxonInfo } from '@/REST/taxon';
import { Annotation, Assembly, fCatAnalysis, TaxonData } from '@/types/data';
import axios from 'axios';
import { useEffect, useState } from 'react';
import {
    Accordion,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    InputGroup,
    ListGroup,
    OverlayTrigger,
    Placeholder,
    Row,
    Tab,
    Tabs,
    Tooltip,
} from 'react-bootstrap';
import TaxonomicDistributionPlot from '@/Components/AssemblyPage/TaxonomicDistributionPlot';
import { Link } from '@inertiajs/react';
import CoveragePlot from '@/Components/AssemblyPage/CoveragePlot';
import CoverageThresholdsPlot from '@/Components/AssemblyPage/CoverageThresholdsPlot';
import SnailPlot from '@/Components/AssemblyPage/SnailPlot';
import MissingData from '@/Components/MissingData';
import BUSCOCompletenessBar from '@/Components/BUSCOCompletenessBar';
import FCatCompletenessBar from '@/Components/fCatCompletenessBar';


export default function Assemblies({ assembly, is_read_only } : { assembly: Assembly, is_read_only: boolean }) {
    const [renderCompleteness, setRenderCompleteness] = useState<boolean>(false);
    const [renderRepeats, setRenderRepeats] = useState<boolean>(false);
    const [location, setLocation] = useState<string>('');
    const [lineage, setLineage] = useState<TaxonData[] | null>(null);
    const [geoData, setGeoData] = useState([]);
    const [activeTab, setActiveTab] = useState('image');
    const [coverageTab, setCoverageTab] = useState(1);

    // Taxon Information
    const [taxonHeadline, setTaxonHeadline] = useState<string>("");
    // const [taxonInfo, setTaxonInfo] = useState<string>("");

    const [assignmentStats, setAssignmentStats] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(assembly.is_bookmarked);

    const setBookmark = () => {
        axios.post(`/assemblies/${assembly.id}/bookmark`)
            .then(() => setIsBookmarked(true));
    }

    const deleteBookmark = () => {
        axios.delete(`/assemblies/${assembly.id}/bookmark`).then(() => setIsBookmarked(false));
    };

    /**
     * When loading the page, pull the first taXaminer analyses and use the plot labels as compressed taxonomic assignment
     * for the overview plot. This plot will be replaced by taxSun in the future and this Effect will be removed.
     */
    useEffect(() => {
        if (assembly.taxaminer_analyses.length > 0) {

            axios.get(route('taxaminer.scatter', [assembly.taxon_ncbiTaxonID, assembly.id, assembly.taxaminer_analyses[0].id]))
                .then((response) => response.data)
                .then((data) => {
                    let transformed = data.map((trace) => {
                        const name = trace[0].plot_label;
                        const value = trace.length;
                        return { name: name, value: value };
                    });
                    transformed = transformed.filter((each) => each.name != "Unassigned");
                    transformed.sort(function(a, b) {
                        return b.value - a.value;
                    });
                    setAssignmentStats(transformed);
                });
        }
    }, [assembly])


    useEffect(() => {
        const fetchTaxonData = async () => {
            try {
                const info_response = await getTaxonInfo(assembly.taxon.ncbiTaxonID);
                if (info_response.data.infos[0]) {
                    //setTaxonInfo(info_response.data.infos[0]?.text);
                    setTaxonHeadline(info_response.data.infos[0]?.headline);
                } else {
                    if (assembly.wikipedia_summary) {
                        setTaxonHeadline(assembly.wikipedia_summary);
                    } else {
                        setTaxonHeadline('No Taxon headline available');
                    }
                    //setTaxonInfo('No Taxon infos provided');
                }

                // Taxon Geo Data
                const data = await getGeoData(assembly.taxon.ncbiTaxonID);
                setGeoData(data.geo_data);

                // NCBI Lineage
                const new_lineage = await getLineage(assembly.taxon.ncbiTaxonID);
                setLineage(new_lineage);
            } catch (error) {
                console.error('Error fetching Taxon data:', error);
            }
        };

        if (assembly?.taxon_ncbiTaxonID) {
            fetchTaxonData();
        }
    }, [assembly]);

    const getGeoData = async (ncbiTaxonID: number) => {
        try {
            const response = await axios.get(route('taxon.geo-data', [ncbiTaxonID]));
            return response.data;
        } catch (error) {
            console.error('Failed to geo data:', error);
            throw error;
        }
    };

    return (
        <>
            <head>
                <title>{assembly.taxon.commonName || assembly.taxon.scientificName}</title>
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
                    integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
                    crossOrigin=""
                />

                <script
                    src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js"
                    integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew=="
                    crossOrigin=""
                ></script>
            </head>
            <TopNavBar />
            <div className="assembly-page-header">
                <Container fluid>
                    <div className="assembly-page-header-inner">
                        {/* Assembly identity */}
                        <div className="assembly-page-identity">
                            <div className="assembly-page-taxon">
                                <span className="fst-italic">{assembly.taxon.scientificName}</span>

                                <i className="bi bi-chevron-right assembly-page-separator" aria-hidden="true" />

                                <span className="assembly-page-section">{assembly.label || assembly.name}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="assembly-page-actions">
                            <OverlayTrigger placement="bottom" overlay={<Tooltip id="assembly-edit-tooltip">Edit assembly</Tooltip>}>
                                <span className="d-inline-flex">
                                    {is_read_only ? (
                                        <Button variant="outline-secondary" className="assembly-page-action" disabled aria-label="Edit assembly">
                                            <i className="bi bi-pencil-square" />
                                        </Button>
                                    ) : (
                                        <Button
                                            as={Link}
                                            href={`/assemblies/${assembly.id}/edit`}
                                            variant="outline-secondary"
                                            className="assembly-page-action"
                                            aria-label="Edit assembly"
                                        >
                                            <i className="bi bi-pencil-square" />
                                        </Button>
                                    )}
                                </span>
                            </OverlayTrigger>

                            <OverlayTrigger placement="bottom" overlay={<Tooltip id="assembly-taxon-tooltip">View taxon</Tooltip>}>
                                <span className="d-inline-flex">
                                    {is_read_only ? (
                                        <Button variant="outline-secondary" className="assembly-page-action" disabled aria-label="View taxon">
                                            <i className="bi bi-diagram-2" />
                                        </Button>
                                    ) : (
                                        <Button
                                            href={`/taxon/${assembly.taxon.ncbiTaxonID}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            variant="outline-secondary"
                                            className="assembly-page-action"
                                            aria-label="View taxon"
                                        >
                                            <i className="bi bi-diagram-2" />
                                        </Button>
                                    )}
                                </span>
                            </OverlayTrigger>

                            <span className="assembly-page-action-divider" />

                            <OverlayTrigger
                                placement="bottom"
                                overlay={<Tooltip id="assembly-bookmark-tooltip">{isBookmarked ? 'Remove bookmark' : 'Bookmark assembly'}</Tooltip>}
                            >
                                <Button
                                    variant={isBookmarked ? 'primary' : 'outline-secondary'}
                                    className={`assembly-page-action ${isBookmarked ? 'is-bookmarked' : ''}`}
                                    onClick={() => (isBookmarked ? deleteBookmark() : setBookmark())}
                                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark assembly'}
                                    aria-pressed={isBookmarked}
                                >
                                    <i className={`bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}`} />
                                </Button>
                            </OverlayTrigger>
                        </div>
                    </div>
                </Container>
            </div>
            <Container fluid>
                <Row className="g-4 mt-2">
                    {/* Left: Image and map */}
                    <Col xs={12} lg={5}>
                        <Card className="gnom-panel shadow-sm">
                            <Tabs defaultActiveKey="image" className="taxon-visual-tabs pt-2" onSelect={(key) => setActiveTab(key)}>
                                <Tab
                                    title={
                                        <>
                                            <i className="bi bi-image me-2" />
                                            Image
                                        </>
                                    }
                                    eventKey="image"
                                >
                                    <div className="taxon-image-wrapper">
                                        <Card.Img
                                            src={
                                                assembly.wiki_image ||
                                                `${route('taxon.image', [assembly.taxon.ncbiTaxonID])}?updated=${assembly.taxon.updated_at}`
                                            }
                                            alt={assembly.taxon.commonName || assembly.taxon.scientificName}
                                            className="taxon-image"
                                        />
                                    </div>

                                    <Card.Body className="d-flex align-items-center justify-content-between gap-3 py-3">
                                        <div className="small text-secondary">
                                            {assembly.wiki_image
                                                ? 'Image from Wikimedia Commons'
                                                : assembly.taxon.imageCredit
                                                  ? `Image credit: ${assembly.taxon.imageCredit}`
                                                  : 'Image credit unavailable'}
                                        </div>

                                        {assembly.wiki_image && (
                                            <Button
                                                href={`https://commons.wikimedia.org/wiki/File:${assembly.wiki_image.split('/').pop()}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                variant="outline-secondary"
                                                size="sm"
                                                className="flex-shrink-0"
                                            >
                                                <i className="bi bi-box-arrow-up-right me-2" />
                                                Commons
                                            </Button>
                                        )}
                                    </Card.Body>
                                </Tab>
                                <Tab
                                    title={
                                        <>
                                            <i className="bi bi-geo-alt me-2" />
                                            Map
                                        </>
                                    }
                                    eventKey="overview-map"
                                >
                                    <div className="taxon-map-wrapper">
                                        {activeTab === 'overview-map' && <TaxMap isVisible={true} geoDataMeta={geoData} />}
                                    </div>
                                </Tab>
                            </Tabs>
                        </Card>
                    </Col>

                    {/* Right: Taxonomic information */}
                    <Col xs={12} lg={7}>
                        <Card className="taxon-info-card h-100 shadow-sm">
                            <Card.Body className="p-xl-5 p-4">
                                <div className="d-flex align-items-start mb-3 gap-3">
                                    <div className="taxon-title-icon">
                                        {assembly.taxon.phylopic ? (
                                            <img
                                                src={`${import.meta.env.VITE_BASE_URL}/taxon/${assembly.taxon.ncbiTaxonID}/icon?updated=${assembly.taxon.updated_at}`}
                                                alt=""
                                                className="taxon-phylopic"
                                                style={{ filter: 'invert(100%) brightness(40%)' }}
                                            />
                                        ) : (
                                            <i className="bi bi-leaf" />
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="small text-secondary text-uppercase fw-semibold mb-1">Species overview</div>

                                        <Card.Title as="h2" className="taxon-title mb-0" style={{ textTransform: 'capitalize' }}>
                                            {assembly.taxon.commonName || assembly.taxon.scientificName}
                                        </Card.Title>

                                        {assembly.taxon.commonName && (
                                            <div className="text-secondary fst-italic mt-1">{assembly.taxon.scientificName}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="taxon-summary mb-4">
                                    {taxonHeadline || assembly.wikipedia_summary ? (
                                        <p className="mb-0">{taxonHeadline || assembly.wikipedia_summary}</p>
                                    ) : (
                                        <Placeholder animation="glow">
                                            <Placeholder xs={12} />
                                            <Placeholder xs={10} />
                                            <Placeholder xs={7} />
                                        </Placeholder>
                                    )}
                                </div>

                                {/**
                                 <hr className="taxon-divider" />
                                <section className="taxon-details">
                                    <h3 className="h6 fw-semibold mb-3">
                                        About this taxon
                                    </h3>

                                    {taxonInfo ? (
                                        <p className="taxon-description mb-0">
                                            {taxonInfo}
                                        </p>
                                    ) : (
                                        <Placeholder animation="glow">
                                            <Placeholder xs={12} />
                                            <Placeholder xs={12} />
                                            <Placeholder xs={9} />
                                            <Placeholder xs={11} />
                                            <Placeholder xs={6} />
                                        </Placeholder>
                                    )}
                                </section>
                                    */}
                            </Card.Body>

                            <Card.Footer className="taxon-info-footer border-top px-xl-5 bg-transparent px-4 py-3">
                                <div className="mb-3">
                                    <div className="small text-secondary fw-semibold mb-2">TAXONOMIC LINEAGE</div>

                                    {lineage ? (
                                        <nav aria-label="Taxonomic lineage">
                                            <div className="taxon-lineage">
                                                {lineage.map((each, index) => (
                                                    <span key={`${each.ncbiTaxonID}-${index}`} className="taxon-lineage-item">
                                                        {index > 0 && <i className="bi bi-chevron-right text-secondary" aria-hidden="true" />}

                                                        {each.scientificName === 'root' ? (
                                                            <i className="bi bi-diagram-3 text-secondary" title="Root" />
                                                        ) : (
                                                            <a
                                                                href={`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=${each.ncbiTaxonID}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                {each.scientificName}
                                                            </a>
                                                        )}
                                                    </span>
                                                ))}
                                                <span className="taxon-id">NCBI: {assembly.taxon.ncbiTaxonID}</span>
                                            </div>
                                        </nav>
                                    ) : (
                                        <Placeholder animation="glow">
                                            <Placeholder xs={8} />
                                        </Placeholder>
                                    )}
                                </div>

                                <div className="d-flex align-items-center small text-secondary gap-2">
                                    <i className="bi bi-clock-history" />
                                    <span>Last updated: {assembly.updated_at}</span>
                                </div>
                            </Card.Footer>
                        </Card>
                    </Col>
                </Row>
                <Row>
                    <Accordion className="mb-2 mt-2" defaultActiveKey={['0']} alwaysOpen>
                        <Accordion.Item eventKey="0" className="assembly-accordion-item">
                            <Accordion.Header>
                                <span className="d-flex align-items-center gap-2">
                                    <i className="bi bi-bar-chart-line" />
                                    <span className="fw-semibold">Assembly Information</span>
                                </span>
                            </Accordion.Header>

                            <Accordion.Body className="p-lg-4 p-3">
                                {/* Overview */}
                                <Row className="g-4 align-items-stretch">
                                    {/* Snailplot */}
                                    <Col xs={12} xl={5}>
                                        <Card className="gnom-panel h-100">
                                            <Card.Header>
                                                <i className="bi bi-pie-chart me-2" />
                                                Snailplot
                                            </Card.Header>
                                            <Card.Body className="d-flex align-items-center justify-content-center">
                                                <div className="w-100 text-center">
                                                    <SnailPlot assembly_id={assembly.id} taxon_id={assembly.taxon_ncbiTaxonID} />
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>

                                    {/* Statistics and taxonomic distribution */}
                                    <Col xs={12} xl={7}>
                                        <div className="d-flex flex-column h-100 gap-4">
                                            <Card className="gnom-panel">
                                                <Card.Header>
                                                    <i className="bi bi-info-circle me-2" />
                                                    Assembly statistics
                                                </Card.Header>

                                                <Card.Body>
                                                    <Row className="g-3">
                                                        <Col xs={12}>
                                                            <div className="assembly-field">
                                                                <Form.Label>Database ID</Form.Label>
                                                                <InputGroup>
                                                                    <Form.Control value={assembly.id ?? ''} readOnly aria-label="Database ID" />
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        aria-label="Copy database ID"
                                                                        title="Copy database ID"
                                                                        onClick={() => navigator.clipboard.writeText(String(assembly.id))}
                                                                    >
                                                                        <i className="bi bi-clipboard2" />
                                                                    </Button>
                                                                </InputGroup>
                                                            </div>
                                                        </Col>

                                                        <Col xs={12}>
                                                            <div className="assembly-field">
                                                                <Form.Label>Label</Form.Label>
                                                                <InputGroup>
                                                                    <Form.Control value={assembly.name ?? ''} readOnly aria-label="Assembly label" />
                                                                    <Button
                                                                        variant="outline-secondary"
                                                                        aria-label="Copy assembly label"
                                                                        title="Copy assembly label"
                                                                        onClick={() => navigator.clipboard.writeText(String(assembly.name ?? ''))}
                                                                    >
                                                                        <i className="bi bi-clipboard2" />
                                                                    </Button>
                                                                </InputGroup>
                                                            </div>
                                                        </Col>

                                                        <Col xs={12} md={6}>
                                                            <div className="assembly-metadata">
                                                                <span>Imported into G-nom</span>
                                                                <strong>{assembly.created_at || '—'}</strong>
                                                            </div>
                                                        </Col>

                                                        <Col xs={12} md={6}>
                                                            <div className="assembly-metadata">
                                                                <span>Last update</span>
                                                                <strong>{assembly.updated_at || '—'}</strong>
                                                            </div>
                                                        </Col>
                                                    </Row>
                                                </Card.Body>
                                            </Card>

                                            <Card className="gnom-panel flex-grow-1">
                                                <Card.Header>
                                                    <i className="bi bi-diagram-3 me-2" />
                                                    Taxonomic profile
                                                </Card.Header>
                                                <Card.Body className="d-flex align-items-center justify-content-center">
                                                    {assignmentStats ? (
                                                        <div className="w-100">
                                                            <TaxonomicDistributionPlot taxa={assignmentStats} />
                                                        </div>
                                                    ) : (
                                                        <MissingData />
                                                    )}
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Read coverage */}
                                <Card className="gnom-panel mt-4">
                                    <Card.Header className="d-flex align-items-center flex-wrap gap-3">
                                        <div className="d-flex align-items-center me-auto gap-2">
                                            <i className="bi bi-activity" />
                                            <span>Read coverage</span>
                                            <a
                                                href="https://deeptools.readthedocs.io/en/stable/content/tools/plotCoverage.html"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="assembly-doc-link"
                                                aria-label="Read coverage documentation"
                                                title="deepTools documentation"
                                            >
                                                <i className="bi bi-box-arrow-up-right" />
                                            </a>
                                        </div>

                                        <div className="btn-group btn-group-sm" role="group" aria-label="Coverage plot type">
                                            <Button
                                                onClick={() => setCoverageTab(1)}
                                                variant={coverageTab === 1 ? 'primary' : 'outline-secondary'}
                                                aria-pressed={coverageTab === 1}
                                            >
                                                Coverage
                                            </Button>
                                            <Button
                                                onClick={() => setCoverageTab(2)}
                                                variant={coverageTab === 2 ? 'primary' : 'outline-secondary'}
                                                aria-pressed={coverageTab === 2}
                                            >
                                                Thresholds
                                            </Button>
                                        </div>
                                    </Card.Header>

                                    <Card.Body className="p-lg-4 p-3">
                                        {assembly.coverage ? (
                                            coverageTab === 1 ? (
                                                <CoveragePlot coverage_data={assembly.coverage} />
                                            ) : (
                                                <CoverageThresholdsPlot coverage_data={assembly.coverage} />
                                            )
                                        ) : (
                                            <MissingData />
                                        )}
                                    </Card.Body>
                                </Card>
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1" className="assembly-accordion-item mt-2">
                            <Accordion.Header>
                                <span className="d-flex align-items-center gap-2">
                                    <i className="bi bi-check2-circle" />
                                    <span className="fw-semibold">Annotation completeness</span>
                                </span>
                            </Accordion.Header>

                            <Accordion.Body onEntered={() => setRenderCompleteness(true)}>
                                {renderCompleteness && (
                                    <Row className="g-4">
                                        {/* BUSCO */}
                                        <Col xs={12} xl={6}>
                                            <Card className="completeness-panel h-100">
                                                <Card.Header>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="completeness-icon">
                                                            <i className="bi bi-shield-check" />
                                                        </div>
                                                        <div>
                                                            <Card.Title as="h5" className="mb-1">
                                                                BUSCO
                                                            </Card.Title>
                                                            <div className="small text-secondary">Conserved ortholog completeness</div>
                                                        </div>
                                                        <div className="ms-auto">
                                                            <Badge bg="secondary" pill>
                                                                {assembly.busco_analyses.length}{' '}
                                                                {assembly.busco_analyses.length == 1 ? 'analysis' : 'analyses'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </Card.Header>

                                                <Card.Body>
                                                    {assembly.busco_analyses.length === 0 ? (
                                                        <div className="completeness-empty">
                                                            <i className="bi bi-bar-chart-line" />
                                                            <div className="fw-semibold mt-2">No BUSCO analysis available</div>
                                                            <p className="small text-secondary mb-3">
                                                                Completeness results will appear here when an analysis is available.
                                                            </p>
                                                            <BUSCOCompletenessBar analyses={[]} name={null} />
                                                        </div>
                                                    ) : (
                                                        assembly.busco_analyses.map((each) => (
                                                            <div key={each.id} className="completeness-result">
                                                                <div className="d-flex align-items-center mb-3 flex-wrap gap-2">
                                                                    <Badge bg="light" text="dark">
                                                                        {each.buscoMode}
                                                                    </Badge>
                                                                    <Badge bg="light" text="dark">
                                                                        Dataset: {each.dataset}
                                                                    </Badge>
                                                                    <Badge bg="secondary">#{each.id}</Badge>
                                                                </div>

                                                                <BUSCOCompletenessBar analyses={[each]} name={null} />
                                                            </div>
                                                        ))
                                                    )}
                                                </Card.Body>

                                                <Card.Footer className="completeness-explainer">
                                                    <div className="small fw-semibold mb-2">About BUSCO</div>
                                                    <p className="small text-secondary mb-2">
                                                        BUSCO (Benchmarking Universal Single-Copy Orthologs) assesses assembly or annotation
                                                        completeness using conserved genes expected within a selected lineage. Results distinguish
                                                        complete single-copy, complete duplicated, fragmented, and missing BUSCOs.
                                                    </p>
                                                    <a
                                                        href="https://doi.org/10.1093/nar/gkae987"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="small"
                                                    >
                                                        BUSCO
                                                        <i className="bi bi-box-arrow-up-right ms-1" />
                                                    </a>
                                                </Card.Footer>
                                            </Card>
                                        </Col>

                                        {/* fCat */}
                                        <Col xs={12} xl={6}>
                                            <Card className="completeness-panel h-100">
                                                <Card.Header>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="completeness-icon">
                                                            <i className="bi bi-diagram-3" />
                                                        </div>
                                                        <div>
                                                            <Card.Title as="h5" className="mb-1">
                                                                fCat
                                                            </Card.Title>
                                                            <div className="small text-secondary">Feature-aware annotation completeness</div>
                                                        </div>
                                                        <div className="ms-auto">
                                                            <Badge bg="secondary" pill>
                                                                {assembly.fcat_analyses.length}{' '}
                                                                {assembly.fcat_analyses.length === 1 ? 'analysis' : 'analyses'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </Card.Header>

                                                <Card.Body>
                                                    {assembly.fcat_analyses.length === 0 ? (
                                                        <div className="completeness-empty">
                                                            <i className="bi bi-bar-chart-line" />
                                                            <div className="fw-semibold mt-2">No fCat analysis available</div>
                                                            <p className="small text-secondary mb-3">
                                                                Annotation completeness results will appear here when available.
                                                            </p>
                                                            <FCatCompletenessBar analysis={null} name={null} />
                                                        </div>
                                                    ) : (
                                                        assembly.fcat_analyses.map((each: fCatAnalysis) => (
                                                            <div key={each.id} className="completeness-result">
                                                                <div className="d-flex align-items-center mb-3 flex-wrap gap-2">
                                                                    <Badge bg="light" text="dark">
                                                                        Genome: {each.genomeID}
                                                                    </Badge>
                                                                    <Badge bg="secondary">#{each.id}</Badge>
                                                                </div>

                                                                <FCatCompletenessBar analysis={each} name={null} />
                                                            </div>
                                                        ))
                                                    )}
                                                </Card.Body>

                                                <Card.Footer className="completeness-explainer">
                                                    <div className="small fw-semibold mb-2">About fCat</div>
                                                    <p className="small text-secondary mb-2">
                                                        fCat (feature-aware completeness assessment) evaluates genome annotations by searching for
                                                        conserved clade-specific core genes. It uses fDOG ortholog searches and FAS domain
                                                        architecture similarity scores to help validate candidate orthologs across different analysis
                                                        modes.
                                                    </p>
                                                    <a
                                                        href="https://doi.org/10.7490/f1000research.1119126.1"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="small"
                                                    >
                                                        fCat
                                                        <i className="bi bi-box-arrow-up-right ms-1" />
                                                    </a>
                                                </Card.Footer>
                                            </Card>
                                        </Col>
                                    </Row>
                                )}
                            </Accordion.Body>
                        </Accordion.Item>
                        {assembly.repeatmasker_analyses.length > 0 && (
                            <Accordion.Item eventKey="3">
                                <Accordion.Header>
                                    <h4>Repeatmasker</h4>
                                </Accordion.Header>
                                <Accordion.Body onEntered={() => setRenderRepeats(true)}>
                                    {renderRepeats && <RepeatMaskerViewer repeatmasker={assembly.repeatmasker_analyses} />}
                                </Accordion.Body>
                            </Accordion.Item>
                        )}
                        <Accordion.Item eventKey="5" className="assembly-accordion-item mt-2">
                            <Accordion.Header>
                                <span className="d-flex align-items-center gap-2">
                                    <span className="material-symbols-outlined">lab_research</span>
                                    <span className="fw-semibold">Taxonomic composition</span>
                                </span>
                            </Accordion.Header>
                            <Accordion.Body>
                                {assembly.taxon.ncbiTaxonID && (
                                    <TaxaminerDashboard
                                        assembly_id={assembly.id}
                                        taxonID={assembly.taxon.ncbiTaxonID}
                                        analyses={assembly.taxaminer_analyses}
                                        setLocation={setLocation}
                                        setAutoScroll={null}
                                        userID={2}
                                    />
                                )}
                            </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="4" className="assembly-accordion-item mt-2">
                            <Accordion.Header>
                                <span className="d-flex align-items-center gap-2">
                                    <span className="material-symbols-outlined">genetics</span>
                                    <span className="fw-semibold">Genome Browser</span>
                                </span>
                            </Accordion.Header>

                            <Accordion.Body className="p-lg-4 p-3">
                                <Row className="g-4">
                                    {/* Annotation sidebar */}
                                    <Col xs={12} lg={3}>
                                        <Card className="genome-sidebar h-100">
                                            <Card.Header>
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-layers" />
                                                    <span>Available annotations</span>
                                                </div>
                                            </Card.Header>

                                            <Card.Body>
                                                <div className="genome-annotation-count mb-3">
                                                    <span className="genome-count-value">{assembly.genomic_annotations.length}</span>
                                                    <span className="text-secondary small">
                                                        annotation
                                                        {assembly.genomic_annotations.length === 1 ? '' : 's'} available
                                                    </span>
                                                </div>

                                                <p className="small text-secondary mb-3">
                                                    Browse the reference sequence and available annotations. Use the JBrowse track controls{' '}
                                                    <i className="bi bi-list-task" /> to show or hide tracks.
                                                </p>

                                                <Button href={`/browser/${assembly.id}`} target="_blank" rel="noopener noreferrer" className="w-100">
                                                    <i className="bi bi-box-arrow-up-right me-2" />
                                                    Open fullscreen
                                                </Button>
                                            </Card.Body>
                                            <div className="genome-track-heading">Tracks</div>
                                            <ListGroup variant="flush" className="genome-track-list">
                                                <ListGroup.Item className="genome-track-item">
                                                    <span className="genome-track-icon reference">
                                                        <i className="bi bi-database" />
                                                    </span>
                                                    <span className="genome-track-label">Assembly sequence</span>
                                                    <i className="bi bi-check-circle-fill genome-track-status" title="Reference sequence" />
                                                </ListGroup.Item>

                                                {assembly.genomic_annotations.map((annotation: Annotation) => (
                                                    <ListGroup.Item key={annotation.id} className="genome-track-item">
                                                        <span className="genome-track-icon annotation">
                                                            <i className="bi bi-align-center" />
                                                        </span>
                                                        <span className="genome-track-label" title={annotation.label || annotation.name}>
                                                            {annotation.label || annotation.name}
                                                        </span>
                                                    </ListGroup.Item>
                                                ))}

                                                {assembly.genomic_annotations.length === 0 && (
                                                    <ListGroup.Item className="genome-no-tracks">
                                                        <i className="bi bi-info-circle me-2" />
                                                        No additional annotations available.
                                                    </ListGroup.Item>
                                                )}
                                            </ListGroup>
                                        </Card>
                                    </Col>

                                    {/* JBrowse */}
                                    <Col xs={12} lg={9}>
                                        <Card className="gnom-panel">
                                            <Card.Header>
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className="bi bi-display" />
                                                    <span>Interactive genome browser</span>
                                                </div>
                                            </Card.Header>

                                            <Card.Body className="p-0">
                                                <div className="genome-browser-viewport">
                                                    {assembly && (
                                                        <JBrowseView
                                                            my_assembly={assembly}
                                                            annotations={assembly.genomic_annotations}
                                                            mappings={assembly.mappings}
                                                            location={location}
                                                        />
                                                    )}
                                                </div>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Accordion.Body>
                        </Accordion.Item>
                    </Accordion>
                </Row>
            </Container>
        </>
    );
}
