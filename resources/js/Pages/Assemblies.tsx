import AssemblyCard from '@/Components/AssemblyCard';
import Pagination from '@/Components/Pagination';
import TopNavBar from '@/Components/TopNavBar';
import { useEffect } from 'react';
import { Col, Container, Row } from 'react-bootstrap';

interface PaginatedAssemblies {
    data: any[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function Assemblies({
    assemblies,
}: {
    assemblies: PaginatedAssemblies;
}) {
    useEffect(() => {
        // Print the assemblies data to the console
        console.log('Assemblies:', assemblies);
    }, [assemblies]);

    return (
        <>
            <TopNavBar />

                <Row className="row-cols-1 row-cols-md-3">
                    {assemblies.data.map((each: any) => {
                        return (
                            <Col className="d-flex sm-6 align-items-stretch">
                                <AssemblyCard
                                    assemblyName={each.name}
                                    assemblyID={each.id}
                                    ncbiID={each.taxon_id}
                                    info_text={each.infoText}
                                    last_update={'Never'}
                                    public={true}
                                    mappings={each.mappings_count}
                                    annotations={each.genomic_annotations_count}
                                    buscos={each.busco_analyses_count}
                                    n50={each.n50}
                                    maxBuscoScore={10}
                                    repeatmaskers={
                                        each.repeatmasker_analyses_count
                                    }
                                    taxaminers={each.taxaminer_analyses_count}
                                />
                            </Col>
                        );
                    })}
                </Row>
                <Row className="justify-content-center mt-4">
                    <Col xs="auto">
                        <Pagination links={assemblies.links} />
                    </Col>
                </Row>

        </>
    );
}
