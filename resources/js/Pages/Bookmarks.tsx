import AssemblyCard from '@/Components/AssemblyCard';
import Pagination from '@/Components/Pagination';
import TopNavBar from '@/Components/TopNavBar';
import { AggregatedAssembly } from '@/types/data';
import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

interface PaginatedAssemblies {
    data: AggregatedAssembly[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function Bookmarks({ assemblies }: { assemblies: PaginatedAssemblies }) {

    return (
        <>
            <TopNavBar />
            <Container fluid>
            <Row md={4} className="g-4 m-1" style={{minHeight: '100vh'}}>
                {assemblies.data.map((each: AggregatedAssembly) => {
                    return (
                        <Col key={each.id} xs={12} sm={6} lg={6} xl={4} xxl={3} className="d-flex mb-3">
                            <AssemblyCard
                                assemblyName={each.name}
                                assemblyID={each.id}
                                ncbiID={each.taxon.ncbiTaxonID}
                                info_text={each.taxon.infos[0]?.headline || each.wikipedia_summary}
                                last_update={'Never'}
                                public={each.public}
                                mappings={each.mappings_count}
                                annotations={each.genomic_annotations_count}
                                buscos={each.busco_analyses_count}
                                n50={each.n50}
                                maxBuscoScore={10}
                                repeatmaskers={each.repeatmasker_analyses_count}
                                taxaminers={each.taxaminer_analyses_count}
                                taxon_updated_at={each.taxon.updated_at}
                                is_bookmarked={each.is_bookmarked}
                                taxon_name={each.taxon.scientificName}
                                conservation_status={each.conservation_status}
                                wiki_image={each.wiki_image}
                                is_wiki_text={each.wikipedia_summary && !each.taxon.infos[0]?.headline}
                                collections={each.collections}
                            />
                        </Col>
                    );
                })}
            </Row>
            <Row className="justify-content-center mb-3">
                <Col xs="auto">
                    <Pagination links={assemblies.links} />
                </Col>
            </Row>
            </Container>
        </>
    );
}
