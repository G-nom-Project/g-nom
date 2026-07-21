import TopNavBar from '@/Components/TopNavBar';
import { Badge, Button, Col, Container, Form, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap';
import { Assembly, Collection } from '@/types/data';
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import TreeOfLife from '@/Components/TreeOfLife';

export default function CollectionPage({collection, is_admin, assemblies, role} : {collection: Collection, is_admin: boolean, assemblies: Assembly[], role: string}) {
    console.log(assemblies);
    const [currID, setCurrID] = useState();
    const [currUserID, setCurrUserID] = useState();
    const [currUserRole, setCurrUserRole] = useState("viewer");

    const [currName, setCurrName] = useState(collection.name);
    const [currPublic, setCurrPublic] = useState(collection.is_public);
    const [newick, setNewick] = useState();

    const handleRemoveAssembly = async (assembly_id: number) => {
        await axios.post(`/collections/${collection.id}/remove-assembly`, { assemblyID: assembly_id });
        router.visit(`/collections/${collection.id}`);
    };

    const handleAddAssembly = async (e, assembly_id: number) => {
        e.preventDefault();
        if (assembly_id) {
            await axios.post(`/collections/${collection.id}/add-assembly`, { assemblyID: assembly_id });
            router.visit(`/collections/${collection.id}`);
        }
    };

    const handleAddUser = async () => {
        e.preventDefault();
        if (currUserID) {
            await axios.post(`/collections/${collection.id}/add-user`, { userID: parseInt(currUserID), role: currUserRole });
            router.visit(`/collections/${collection.id}`);
        }
    };

    const handleUpdateCollection = async (e) => {
        e.preventDefault();
        await axios.post(`/collections/${collection.id}`, { name: currName, is_public: currPublic });
        router.visit(`/collections/${collection.id}`);
    };

    useEffect(() => {
        axios.get(`/collections/${collection.id}/tree`)
            .then((res) => res.data)
            .then((data) => setNewick(data))
    })

    return (
        <>
            <TopNavBar />
            <Container>
                <div style={{ minHeight: '80vh' }}>
                    <h2 className="display-6 fw-bold mt-5 text-center">{collection.name}</h2>
                    <div className="mb-3 text-center">
                        <Badge>
                            {(collection.is_public && (
                                <>
                                    <i className="bi bi-eye"></i> public
                                </>
                            )) || (
                                <>
                                    <i className="bi bi-eye-slash"></i> private
                                </>
                            )}
                        </Badge>{' '}
                        <Badge>{assemblies.length} assemblies</Badge>
                        <br />
                        <Button className="mt-2" style={{ width: '25%' }} href={`/collections/${collection.id}/gallery`}>
                            <i className="bi bi-images"></i> Browse Gallery
                        </Button>
                    </div>
                    <Row>
                        <Col xs={2} />
                        <Col>
                            <div>
                                {newick && <TreeOfLife newick={newick} pass_query={null} search_query={null} />}
                            </div>
                        </Col>
                        <Col xs={2} />
                    </Row>

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
                                    <td>
                                        <a href={'/assemblies/' + ass.id}>{ass.name}</a>{' '}
                                        <OverlayTrigger
                                            overlay={
                                                <Tooltip id="tooltip-disabled">{(ass.public && 'Public access') || 'Internal use only'}</Tooltip>
                                            }
                                        >
                                            <Badge bg={(ass.public && 'success') || 'secondary'}>
                                                <i className={(ass.public && 'bi bi-unlock-fill') || 'bi bi-lock-fill'}></i>
                                            </Badge>
                                        </OverlayTrigger>
                                    </td>
                                    <td>
                                        <i>{ass.taxon.scientificName}</i>
                                    </td>
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
                </div>
                <hr />
                {(is_admin || role == 'editor') && (
                    <>
                        <p>
                            In order to add a assembly, you need to have at least <b>view</b> permission for the assembly and the <b>editor</b> role
                            for this collection. Please note that added assemblies will be visible to all members of this collection. Viewing
                            permission at collection level superseedes the assembly's own public/private settings.
                        </p>
                        <Form onSubmit={(e) => handleAddAssembly(e, currID)}>
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Add assembly to collection</Form.Label>
                                <Form.Control type="number" placeholder="Assembly ID" onChange={(e) => setCurrID(e.target.value)} />
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={!currID}>
                                Add assembly
                            </Button>
                        </Form>
                    </>
                )}

                {is_admin && (
                    <>
                        <Form onSubmit={(e) => handleAddUser(e)} className="mt-2">
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Add user to collection or change role</Form.Label>
                                <Form.Control type="number" placeholder="User ID" onChange={(e) => setCurrUserID(e.target.value)} />
                                <Form.Label>Set user role</Form.Label>
                                <Form.Select aria-label="Role selection" onChange={(e) => setCurrUserRole(e.target.value)} value={currUserRole}>
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                </Form.Select>
                            </Form.Group>
                            <Button variant="primary" type="submit" disabled={!currUserID}>
                                Add user
                            </Button>
                        </Form>
                        <Form onSubmit={(e) => handleUpdateCollection(e)} className="mt-2">
                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label>Change collection name</Form.Label>
                                <Form.Control placeholder="User ID" onChange={(e) => setCurrName(e.target.value)} value={currName} />
                                <Form.Label>Change visibility</Form.Label>
                                <Form.Switch label="Public" onClick={(e) => setCurrPublic(e.target.checked)} checked={currPublic} />
                            </Form.Group>
                            <Button variant="primary" type="submit">
                                Update Collection
                            </Button>
                        </Form>
                    </>
                )}

                <hr />
                <div className="d-flex mb-3 flex-wrap gap-2">
                    {collection.users.map((user) => (
                        <Badge bg="secondary" key={user.id}>
                            <i className="bi bi-person-circle me-1"></i>
                            {user.name} ({user.pivot.role})
                        </Badge>
                    ))}
                </div>
            </Container>
        </>
    );
}
