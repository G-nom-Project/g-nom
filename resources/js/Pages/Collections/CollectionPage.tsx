import TopNavBar from '@/Components/TopNavBar';
import { Head, Link, router } from '@inertiajs/react';
import {
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    OverlayTrigger,
    Row,
    Table,
    Tooltip,
} from 'react-bootstrap';
import type { Assembly, Collection } from '@/types/data';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import TreeOfLife from '@/Components/TreeOfLife';

export default function CollectionPage({ collection, is_admin, assemblies, role }: {
    collection: Collection;
    is_admin: boolean;
    assemblies: Assembly[];
    role: string;
}) {
    const [currID, setCurrID] = useState('');
    const [currUserID, setCurrUserID] = useState('');
    const [currUserRole, setCurrUserRole] = useState('viewer');

    const [currName, setCurrName] = useState(collection.name);
    const [currPublic, setCurrPublic] = useState(collection.is_public);
    const [newick, setNewick] = useState<string | null>(null);
    const [treeLoading, setTreeLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const canEdit = is_admin || role === 'editor';

    useEffect(() => {
        setCurrName(collection.name);
        setCurrPublic(collection.is_public);
    }, [collection.name, collection.is_public]);

    useEffect(() => {
        let active = true;

        setTreeLoading(true);
        setNewick(null);

        axios
            .get<string>(`/collections/${collection.id}/tree`)
            .then((response) => {
                if (active) setNewick(response.data);
            })
            .catch((error) => {
                console.error('Failed to load collection tree:', error);
            })
            .finally(() => {
                if (active) setTreeLoading(false);
            });

        return () => {
            active = false;
        };
    }, [collection.id]);

    const refreshCollection = () => {
        router.reload();
    };

    const handleRemoveAssembly = async (assemblyID: number) => {
        if (!window.confirm('Remove this assembly from the collection?')) return;

        try {
            setSubmitting(true);
            await axios.post(`/collections/${collection.id}/remove-assembly`, {
                assemblyID,
            });
            refreshCollection();
        } catch (error) {
            console.error('Failed to remove assembly:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddAssembly = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currID) return;

        try {
            setSubmitting(true);
            await axios.post(`/collections/${collection.id}/add-assembly`, {
                assemblyID: Number(currID),
            });
            setCurrID('');
            refreshCollection();
        } catch (error) {
            console.error('Failed to add assembly:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddUser = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!currUserID) return;

        try {
            setSubmitting(true);
            await axios.post(`/collections/${collection.id}/add-user`, {
                userID: Number(currUserID),
                role: currUserRole,
            });
            setCurrUserID('');
            refreshCollection();
        } catch (error) {
            console.error('Failed to update collection member:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateCollection = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setSubmitting(true);
            await axios.post(`/collections/${collection.id}`, {
                name: currName,
                is_public: currPublic,
            });
            refreshCollection();
        } catch (error) {
            console.error('Failed to update collection:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head title={collection.name} />
            <TopNavBar />
            <main className="collection-page">
                {/* Page header */}
                <header className="collection-page-header">
                    <Container fluid className="px-3 px-lg-4">
                        <div className="collection-page-header-inner">
                            <div className="collection-page-identity">
                                <div className="collection-page-eyebrow">
                                    <i className="bi bi-collection me-2" />
                                    Assembly collection
                                </div>

                                <h1 className="collection-page-title">
                                    {collection.name}
                                </h1>

                                <div className="collection-page-meta">
                                    <Badge
                                        bg={collection.is_public ? 'success' : 'secondary'}
                                        className="collection-meta-badge"
                                    >
                                        <i
                                            className={`bi ${
                                                collection.is_public
                                                    ? 'bi-unlock'
                                                    : 'bi-lock'
                                            } me-1`}
                                        />
                                        {collection.is_public ? 'Public' : 'Private'}
                                    </Badge>

                                    <Badge bg="secondary" className="collection-meta-badge">
                                        <i className="bi bi-database me-1" />
                                        {assemblies.length.toLocaleString('en-GB')}{' '}
                                        assemblies
                                    </Badge>

                                    <Badge bg="secondary" className="collection-meta-badge">
                                        <i className="bi bi-people me-1" />
                                        {collection.users.length}{' '}
                                        members
                                    </Badge>
                                </div>
                            </div>

                            <div className="collection-page-actions">
                                <Button
                                    as={Link}
                                    href={`/collections/${collection.id}/gallery`}
                                    variant="primary"
                                    className="collection-gallery-button"
                                >
                                    <i className="bi bi-images me-2" />
                                    Browse gallery
                                    <i className="bi bi-arrow-right ms-2" />
                                </Button>
                            </div>
                        </div>
                    </Container>
                </header>

                <Container fluid className="px-3 px-lg-4 py-4 py-lg-5">
                    {/* Tree of Life */}
                    <section className="collection-section">
                        <div className="collection-section-heading">
                            <div>
                                <h2 className="collection-section-title">
                                    <i className="bi bi-diagram-3 me-2 text-secondary" />
                                    Taxonomic overview
                                </h2>
                                <p className="text-secondary mb-0">
                                    Taxonomic relationships between assemblies
                                    in this collection.
                                </p>
                            </div>
                        </div>

                        <Card className="gnom-panel collection-tree-panel">
                            <Card.Body className="p-3 p-lg-4">
                                {treeLoading ? (
                                    <div className="collection-tree-state">
                                        <div
                                            className="spinner-border spinner-border-sm text-secondary"
                                            role="status"
                                        >
                                            <span className="visually-hidden">
                                                Loading tree...
                                            </span>
                                        </div>
                                        <span>Loading taxonomic tree...</span>
                                    </div>
                                ) : newick ? (
                                    <div className="collection-tree-viewport">
                                        <TreeOfLife
                                            newick={newick}
                                            pass_query={null}
                                            search_query={null}
                                        />
                                    </div>
                                ) : (
                                    <div className="collection-tree-state">
                                        <i className="bi bi-diagram-3" />
                                        <span>
                                            No taxonomic tree is available for
                                            this collection.
                                        </span>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </section>

                    {/* Assembly list */}
                    <section className="collection-section">
                        <div className="collection-section-heading">
                            <div>
                                <h2 className="collection-section-title">
                                    <i className="bi bi-database me-2 text-secondary" />
                                    Assemblies
                                </h2>
                                <p className="text-secondary mb-0">
                                    Genome assemblies included in this collection.
                                </p>
                            </div>

                            <Badge bg="secondary" className="collection-section-count">
                                {assemblies.length}
                            </Badge>
                        </div>

                        <Card className="gnom-panel collection-table-panel">
                            {assemblies.length > 0 ? (
                                <Table responsive hover className="collection-table mb-0">
                                    <thead>
                                        <tr>
                                            <th>Assembly</th>
                                            <th>Taxon</th>
                                            <th>Access</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                    {assemblies.map((ass) => (
                                        <tr key={ass.id}>
                                            <td>
                                                <div className="collection-assembly-cell">
                                                    <Link
                                                        href={`/assemblies/${ass.id}`}
                                                        className="collection-assembly-name"
                                                    >
                                                        {ass.name}
                                                    </Link>
                                                    <span className="collection-assembly-id">
                                                            ID: {ass.id}
                                                        </span>
                                                </div>
                                            </td>

                                            <td>
                                                    <span className="fst-italic">
                                                        {ass.taxon.scientificName}
                                                    </span>
                                            </td>

                                            <td>
                                                <Badge
                                                    bg={ass.public ? 'success' : 'secondary'}
                                                    className="collection-access-badge"
                                                >
                                                    <i
                                                        className={`bi ${
                                                            ass.public
                                                                ? 'bi-unlock'
                                                                : 'bi-lock'
                                                        } me-1`}
                                                    />
                                                    {ass.public ? 'Public' : 'Private'}
                                                </Badge>
                                            </td>

                                            <td>
                                                <div className="collection-table-actions">
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={
                                                            <Tooltip id={`view-${ass.id}`}>
                                                                View assembly
                                                            </Tooltip>
                                                        }
                                                    >
                                                        <Button
                                                            as={Link}
                                                            href={`/assemblies/${ass.id}`}
                                                            variant="outline-secondary"
                                                            className="collection-icon-button"
                                                            aria-label={`View ${ass.name}`}
                                                        >
                                                            <i className="bi bi-arrow-up-right" />
                                                        </Button>
                                                    </OverlayTrigger>

                                                    {is_admin && (
                                                        <OverlayTrigger
                                                            placement="top"
                                                            overlay={
                                                                <Tooltip id={`remove-${ass.id}`}>
                                                                    Remove from collection
                                                                </Tooltip>
                                                            }
                                                        >
                                                            <Button
                                                                variant="outline-danger"
                                                                className="collection-icon-button"
                                                                onClick={() =>
                                                                    handleRemoveAssembly(ass.id)
                                                                }
                                                                disabled={submitting}
                                                                aria-label={`Remove ${ass.name}`}
                                                            >
                                                                <i className="bi bi-trash" />
                                                            </Button>
                                                        </OverlayTrigger>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="collection-empty-state">
                                    <i className="bi bi-database" />
                                    <h3>No assemblies yet</h3>
                                    <p className="text-secondary mb-0">
                                        This collection does not contain any
                                        genome assemblies.
                                    </p>
                                </div>
                            )}
                        </Card>
                    </section>

                    {/* Management */}
                    {canEdit && (
                        <section className="collection-section">
                            <div className="collection-section-heading">
                                <div>
                                    <h2 className="collection-section-title">
                                        <i className="bi bi-sliders me-2 text-secondary" />
                                        Collection management
                                    </h2>
                                    <p className="text-secondary mb-0">
                                        Manage assemblies, members, and collection settings.
                                    </p>
                                </div>
                            </div>

                            <Row className="g-4">
                                <Col xs={12} lg={is_admin ? 4 : 12}>
                                    <Card className="gnom-panel collection-management-card h-100">
                                        <Card.Header>
                                            <i className="bi bi-plus-circle me-2" />
                                            Add assembly
                                        </Card.Header>

                                        <Card.Body>
                                            <p className="text-secondary small mb-4">
                                                Add an assembly by its ID. You must have
                                                viewing permission for the assembly.
                                                Collection members will be able to access
                                                assemblies added here.
                                            </p>

                                            <Form onSubmit={handleAddAssembly}>
                                                <Form.Group
                                                    className="mb-3"
                                                    controlId="collectionAssemblyID"
                                                >
                                                    <Form.Label>
                                                        Assembly ID
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        min={1}
                                                        placeholder="Enter assembly ID"
                                                        value={currID}
                                                        onChange={(e) =>
                                                            setCurrID(e.target.value)
                                                        }
                                                        required
                                                    />
                                                </Form.Group>

                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    disabled={!currID || submitting}
                                                >
                                                    <i className="bi bi-plus-lg me-2" />
                                                    Add assembly
                                                </Button>
                                            </Form>
                                        </Card.Body>
                                    </Card>
                                </Col>

                                {is_admin && (
                                    <>
                                        <Col xs={12} md={6} lg={4}>
                                            <Card className="gnom-panel collection-management-card h-100">
                                                <Card.Header>
                                                    <i className="bi bi-person-plus me-2" />
                                                    Manage members
                                                </Card.Header>

                                                <Card.Body>
                                                    <p className="text-secondary small mb-4">
                                                        Add a user to the collection or
                                                        update their existing role.
                                                    </p>

                                                    <Form onSubmit={handleAddUser}>
                                                        <Form.Group
                                                            className="mb-3"
                                                            controlId="collectionUserID"
                                                        >
                                                            <Form.Label>
                                                                User ID
                                                            </Form.Label>
                                                            <Form.Control
                                                                type="number"
                                                                min={1}
                                                                placeholder="Enter user ID"
                                                                value={currUserID}
                                                                onChange={(e) =>
                                                                    setCurrUserID(e.target.value)
                                                                }
                                                                required
                                                            />
                                                        </Form.Group>

                                                        <Form.Group
                                                            className="mb-3"
                                                            controlId="collectionUserRole"
                                                        >
                                                            <Form.Label>
                                                                Role
                                                            </Form.Label>
                                                            <Form.Select
                                                                value={currUserRole}
                                                                onChange={(e) =>
                                                                    setCurrUserRole(e.target.value)
                                                                }
                                                            >
                                                                <option value="viewer">
                                                                    Viewer
                                                                </option>
                                                                <option value="editor">
                                                                    Editor
                                                                </option>
                                                            </Form.Select>
                                                        </Form.Group>

                                                        <Button
                                                            type="submit"
                                                            disabled={!currUserID || submitting}
                                                        >
                                                            <i className="bi bi-person-plus me-2" />
                                                            Save member
                                                        </Button>
                                                    </Form>
                                                </Card.Body>
                                            </Card>
                                        </Col>

                                        <Col xs={12} md={6} lg={4}>
                                            <Card className="gnom-panel collection-management-card h-100">
                                                <Card.Header>
                                                    <i className="bi bi-gear me-2" />
                                                    Collection settings
                                                </Card.Header>

                                                <Card.Body>
                                                    <Form onSubmit={handleUpdateCollection}>
                                                        <Form.Group
                                                            className="mb-3"
                                                            controlId="collectionName"
                                                        >
                                                            <Form.Label>
                                                                Collection name
                                                            </Form.Label>
                                                            <Form.Control
                                                                value={currName}
                                                                onChange={(e) =>
                                                                    setCurrName(e.target.value)
                                                                }
                                                                required
                                                            />
                                                        </Form.Group>

                                                        <Form.Group
                                                            className="mb-4"
                                                            controlId="collectionPublic"
                                                        >
                                                            <Form.Label>
                                                                Visibility
                                                            </Form.Label>

                                                            <div className="collection-visibility-setting">
                                                                <div>
                                                                    <div className="fw-semibold small">
                                                                        Public collection
                                                                    </div>
                                                                    <div className="text-secondary small">
                                                                        Allow public access to
                                                                        this collection.
                                                                    </div>
                                                                </div>

                                                                <Form.Check
                                                                    type="switch"
                                                                    id="collectionPublicSwitch"
                                                                    checked={currPublic}
                                                                    onChange={(e) =>
                                                                        setCurrPublic(e.target.checked)
                                                                    }
                                                                    aria-label="Public collection"
                                                                />
                                                            </div>
                                                        </Form.Group>

                                                        <Button
                                                            type="submit"
                                                            disabled={submitting}
                                                        >
                                                            <i className="bi bi-check-lg me-2" />
                                                            Save changes
                                                        </Button>
                                                    </Form>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </>
                                )}
                            </Row>
                        </section>
                    )}

                    {/* Members */}
                    <section className="collection-section collection-members-section">
                        <div className="collection-section-heading">
                            <div>
                                <h2 className="collection-section-title">
                                    <i className="bi bi-people me-2 text-secondary" />
                                    Collection members
                                </h2>
                                <p className="text-secondary mb-0">
                                    Users with access to this collection.
                                </p>
                            </div>
                        </div>

                        <Card className="gnom-panel">
                            <Card.Body className="p-3 p-lg-4">
                                {collection.users.length > 0 ? (
                                    <div className="collection-members-list">
                                        {collection.users.map((user) => (
                                            <div
                                                key={user.id}
                                                className="collection-member"
                                            >
                                                <span className="collection-member-avatar">
                                                    <i className="bi bi-person" />
                                                </span>

                                                <span className="collection-member-name">
                                                    {user.name}
                                                </span>

                                                <Badge
                                                    bg="secondary"
                                                    className="collection-member-role"
                                                >
                                                    {user.pivot.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-secondary mb-0">
                                        No members are listed for this collection.
                                    </p>
                                )}
                            </Card.Body>
                        </Card>
                    </section>
                </Container>
            </main>
        </>
    );
}
