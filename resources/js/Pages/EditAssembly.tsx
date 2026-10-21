import { Head } from '@inertiajs/react';
import { Button, Card, Container, Table } from 'react-bootstrap';
import { Assembly } from '@/types/data';
import TopNavBar from '@/Components/TopNavBar';
import React from 'react';

interface SimpleData {
    id: number;
    name: string;
}


export default function AssemblyEditPage({ assembly }: { assembly: Assembly }) {

    const handleDelete = async (id: number, type: string) => {
        await axios.delete(`/${type}/${id}`, {});
    };

    const simple_table = (simple_data: SimpleData[], type: string) => {
        {
            if (simple_data.length === 0) {
                return 'No data';
            }
            return (
                <Table responsive hover className="collection-table mb-0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {simple_data.map((each) => {
                            return (
                                <tr key={each.id}>
                                    <td>{each.id}</td>
                                    <td>{each.name || (type === 'repeatmaskers' && "Default" || "---")}</td>
                                    <td>
                                        <Button variant="danger" onClick={() => handleDelete(each.id, type)}>
                                            <i className="bi bi-trash"></i> Delete
                                        </Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            );
        }
    };

    return (
        <>
            <Head title={'Edit Assembly #' + assembly.id} />
            <TopNavBar />
            <Container style={{ minHeight: '100vh' }}>
                <Card className="gnom-panel mt-2">
                    <Card.Header>Annotations</Card.Header>
                    <Card.Body>{simple_table(assembly.genomic_annotations, 'annotations')}</Card.Body>
                </Card>
                <Card className="gnom-panel mt-2">
                    <Card.Header>Mappings</Card.Header>
                    <Card.Body>{simple_table(assembly.mappings, 'mappings')}</Card.Body>
                </Card>
                <Card className="gnom-panel mt-2">
                    <Card.Header>Completeness assessment (BUSCO)</Card.Header>
                    <Card.Body>{simple_table(assembly.busco_analyses, 'buscos')}</Card.Body>
                </Card>
                <Card className="gnom-panel mt-2">
                    <Card.Header>Completeness assessment (fCat)</Card.Header>
                    <Card.Body>{simple_table(assembly.fcat_analyses, 'fcats')}</Card.Body>
                </Card>
                <Card className="gnom-panel mt-2">
                    <Card.Header>Repeatmasker</Card.Header>
                    <Card.Body>
                        <p>Note: Removing a Repeatmasker analysis will also remove the associated .gff file.</p>
                        {simple_table(assembly.repeatmasker_analyses, 'repeatmaskers')}
                    </Card.Body>
                </Card>
                <Card className="gnom-panel mb-5 mt-2">
                    <Card.Header>taXaminer analyses</Card.Header>
                    <Card.Body>{simple_table(assembly.taxaminer_analyses, 'taxaminers')}</Card.Body>
                </Card>
            </Container>
        </>
    );
}
