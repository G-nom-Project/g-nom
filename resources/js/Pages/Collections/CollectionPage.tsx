import TopNavBar from '@/Components/TopNavBar';
import { Button, Container, Form, Table } from 'react-bootstrap';
import { Assembly, Collection } from '@/types/data';
import { useState } from 'react';

export default function CollectionPage({collection, is_admin, assemblies} : {collection: Collection, is_admin: boolean, assemblies: Assembly[]}) {

    const [currID, setCurrID] = useState();
    const handleRemoveAssembly = (assembly_id: number) => {
        axios.post(`/collections/${collection.id}/remove-assembly`, {'assemblyID': assembly_id});
    }

    const handleAddAssembly = (assembly_id: number) => {
        if (assembly_id) {
            axios.post(`/collections/${collection.id}/add-assembly`, { assemblyID: assembly_id });
        }
    };

    return (
        <>
            <TopNavBar />
            <Container style={{ minHeight: '100vh' }}>
                <h2 className="display-6 fw-bold mb-3 mt-5 text-center">{collection.name}</h2>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Taxon</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assemblies.map((ass) => (
                            <tr>
                                <td>{ass.id}</td>
                                <td>{ass.name}</td>
                                <td>{ass.taxon_ncbiTaxonID}</td>
                                <td>
                                    <Button href={`/assemblies/${ass.id}`}>
                                        <i className="bi bi-search"></i>
                                    </Button>{' '}
                                    {is_admin && (
                                        <Button className="ml-2" variant="danger" onClick={() => handleRemoveAssembly(ass.id)}>
                                            <i className="bi bi-trash"></i>
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                <hr/>
                {
                    is_admin && (
                        <Form onSubmit={() => handleAddAssembly(currID)}>
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>AssemblyID</Form.Label>
                                <Form.Control type="number" placeholder="Assembly ID" onChange={(e) => setCurrID(e.target.value)}/>
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={!currID}>
                                Submit
                            </Button>
                        </Form>
                    )
                }
            </Container>
        </>
    );
}
