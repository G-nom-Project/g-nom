import AssemblyCard from '@/Components/AssemblyCard';
import Pagination from '@/Components/Pagination';
import TopNavBar from '@/Components/TopNavBar';
import { AggregatedAssembly } from '@/types/data';
import { useEffect } from 'react';
import { Col, Row } from 'react-bootstrap';

interface PaginatedAssemblies {
    data: AggregatedAssembly[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function Bookmarks({ assemblies }: { assemblies: PaginatedAssemblies }) {
    useEffect(() => {
        // Print the assemblies data to the console
        console.log('Assemblies:', assemblies);
    }, [assemblies]);

    return (
        <>
            <TopNavBar />
            <Row md={4} className="g-4 m-1">
                {assemblies.data.map((each: AggregatedAssembly) => {
                    return (
                        <Col className="d-flex align-items-stretch mb-3">
                            <AssemblyCard
                                assemblyName={each.name}
                                assemblyID={each.id}
                                ncbiID={each.taxon_id}
                                info_text={each.infoText || 'No info text'}
                                last_update={'NEver'}
                                public={true}
                                mappings={each.mappings_count as number}
                                annotations={each.genomic_annotations_count}
                                buscos={each.busco_analyses_count}
                                n50={each.n50}
                                maxBuscoScore={10}
                                repeatmaskers={each.repeatmasker_analyses_count}
                                taxaminers={each.taxaminer_analyses_count}
                            />
                        </Col>
                    );
                })}
            </Row>
            <Pagination links={assemblies.links} />
        </>
    );
}
