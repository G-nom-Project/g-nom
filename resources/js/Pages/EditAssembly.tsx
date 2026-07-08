import { Head } from '@inertiajs/react';
import { Button, Card, Container } from 'react-bootstrap';
import { Assembly } from '@/types/data';
import TopNavBar from '@/Components/TopNavBar';

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
                <table className="table-striped table">
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
                </table>
            );
        }
    };

    return (
        <>
            <Head title={'Edit Assembly #' + assembly.id} />
            <TopNavBar />
            <Container style={{ minHeight: '100vh' }}>
                <h1 className="mt-2">
                    Edit assembly {assembly.name} (#{assembly.id})
                </h1>
                <Card className="mt-5">
                    <Card.Body>
                        <Card.Title>Annotations</Card.Title>
                        {simple_table(assembly.genomic_annotations, 'annotations')}
                    </Card.Body>
                </Card>
                <Card className="mt-5">
                    <Card.Body>
                        <Card.Title>Mappings</Card.Title>
                        {simple_table(assembly.mappings, 'mappings')}
                    </Card.Body>
                </Card>
                <Card className="mt-5">
                    <Card.Body>
                        <Card.Title>Annotation Completeness (BUSCO)</Card.Title>
                        {simple_table(assembly.busco_analyses, 'buscos')}
                    </Card.Body>
                </Card>
                <Card className="mt-5">
                    <Card.Body>
                        <Card.Title>Annotation Completeness (fCat)</Card.Title>
                        {simple_table(assembly.fcat_analyses, 'fcats')}
                    </Card.Body>
                </Card>
                <Card className="mt-5">
                    <Card.Body>
                        <Card.Title>Repeatmasker</Card.Title>
                        <p>Note: Removing a Repeatmasker analysis will also remove the associated .gff file.</p>
                        {simple_table(assembly.repeatmasker_analyses, 'repeatmaskers')}
                    </Card.Body>
                </Card>
                <Card className="mt-5">
                    <Card.Body>
                        <Card.Title>taXaminer Analyses</Card.Title>
                        {simple_table(assembly.taxaminer_analyses, 'taxaminers')}
                    </Card.Body>
                </Card>
            </Container>
        </>
    );
}
