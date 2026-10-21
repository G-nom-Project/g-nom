import TopNavBar from '@/Components/TopNavBar';
import { Badge, Button, Card, Container, Form, Table } from 'react-bootstrap';
import { Collection } from '@/types/data';
import { useState } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

export default function CollectionsPage({collections, can_create, user_id} : {collections: Collection[], can_create: boolean, user_id: number}) {

    const [currName, setCurrName] = useState();
    const [isPublic, setIsPublic] = useState<boolean>(false);

    const handleCreateCollection = (e) => {
        e.preventDefault();
        axios
            .put('/collections/', { name: currName, public: isPublic })
            .then((response) => response.data)
            .then((data) => router.visit('/collections/' + data.collection.id));
    };

    const handleDelete = async (collection_id: number) => {
        await axios.delete('/collections/' + collection_id);
        router.visit('/collections');
    };

    return (
        <>
            <TopNavBar />
            <Container style={{ minHeight: '100vh' }}>
                <h2 className="display-6 fw-bold mb-3 mt-5 text-center">Collections</h2>
                <Card className="gnom-panel collection-table-panel">
                    <Table responsive hover className="collection-table mb-0">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Access</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {collections.map((each) => (
                                <tr>
                                    <td>{each.id}</td>
                                    <td>{each.name}</td>
                                    <td>
                                        <Badge bg={each.is_public ? 'success' : 'secondary'} className="collection-access-badge">
                                            <i className={`bi ${each.is_public ? 'bi-unlock' : 'bi-lock'} me-1`} />
                                            {each.is_public ? 'Public' : 'Private'}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="collection-table-actions">
                                            <Button href={`/collections/${each.id}`} variant="outline-secondary" className="collection-icon-button">
                                                <i className="bi bi-arrow-up-right" />
                                            </Button>{' '}
                                            {each.user_id == user_id && (
                                                <Button
                                                    className="collection-icon-button"
                                                    variant="outline-danger"
                                                    onClick={() => handleDelete(each.id)}
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
                <hr />
                {can_create && (
                    <Card className="gnom-panel collection-management-card h-100">
                        <Card.Body>
                            <Form onSubmit={(e) => handleCreateCollection(e)}>
                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Create new collection</Form.Label>
                                    <Form.Control type="name" placeholder="Collection Name" onChange={(e) => setCurrName(e.target.value)} />
                                    <Form.Check // prettier-ignore
                                        type="switch"
                                        id="custom-switch"
                                        label="Set as public"
                                        className="mt-2"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                    />
                                </Form.Group>
                                <Button variant="primary" type="submit" disabled={!currName}>
                                    Submit
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                )}
            </Container>
        </>
    );
}
