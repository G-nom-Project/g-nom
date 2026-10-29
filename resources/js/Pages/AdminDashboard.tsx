import TopNavBar from '@/Components/TopNavBar';
import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';
import axios from 'axios';
import { getEcho } from '@/echo';
import UserModal, { AdminUser } from '@/Components/UserModal';
import { User } from '@/types';

type HealthStatus = 'healthy' | 'warning' | 'failed';

type HealthCheck = {
    name: string;
    description: string;
    status: HealthStatus;
    detail: string;
};

type AdminJob = {
    name: string;
    description: string | React.ReactNode;
    icon: string;
    variant: 'primary' | 'outline-secondary' | 'outline-danger';
    action: string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    action_handle: Function;
    dangerous?: boolean;
};

const flushCache = () => {
    return axios.post(route('admin.flush'));
}

const cleanData = () => {
    return axios.post(route('admin.clean'));
}

const statusIcons: Record<HealthStatus, string> = {
    healthy: 'bi-check-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    failed: 'bi-x-circle-fill',
};

const statusLabels: Record<HealthStatus, string> = {
    healthy: 'Healthy',
    warning: 'Warning',
    failed: 'Failed',
};

const checkHorizon = () =>
    axios
        .get('/horizon/api/stats')
        .then(({ data }) => ({
            name: 'Laravel Horizon',
            description: 'Queue worker supervisor / ' + data.failedJobs + ' recently failed job(s)',
            status: data.status !== 'running' ? 'failed' : data.failedJobs == 0 ? 'healthy' : 'warning',
            detail: data.status === 'running' ? `${data.processes} workers active` : `Horizon is ${data.status}`,
            src: data
        }))
        .catch((error) => ({
            name: 'Laravel Horizon',
            description: 'Queue worker supervisor',
            status: 'failed',
            detail: error.message,
        }));

const checkReverb = () =>
    new Promise((resolve) => {
        const channelName = 'health';
        let settled = false;
        // eslint-disable-next-line prefer-const
        let timer;

        const entry = (status: string, detail: string) => ({
            name: 'Reverb',
            description: 'WebSocket server / Real-time notifications',
            status,
            detail,
        });

        let echo;
        try {
            echo = getEcho();
        } catch  {
            return resolve(entry('failed', 'Echo not initialised'));
        }

        const done = (ok: boolean, detail: string) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            echo.leave(channelName);
            resolve(entry(ok ? 'healthy' : 'failed', detail));
        };

        timer = setTimeout(() => done(false, 'Subscription timed out'), 5000);

        const channel = echo.private(channelName);

        channel.subscribed(() => done(true, 'Subscribed'));
        channel.error((error) => done(false, error?.message ?? 'Subscription error'));
    });

export default function AdminDashboard({db, cache_healthy, qlever, vault, data, users}:{
    db: { db_size: string; cache_hit_pct: string };
    cache_healthy: boolean;
    qlever: { 'num-triples-normal': number };
    vault: { disk_total: number, disk_free: number };
    data: {
        assemblies: number;
        taxa: number;
        users: number;
        collections: number;
        analyses: number;
        public_assemblies: number;
        public_collections: number;
    }
    users: User[];
}) {
    const [health, setHealth] = useState<HealthCheck[]>([]);

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

    const filteredUsers = users.filter((user) => {
        const matchesSearch = `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase());

        return matchesSearch && (roleFilter === 'all' || user.role === roleFilter);
    });

    const healthyCount = health.filter((check) => check.status === 'healthy').length;
    const warningCount = health.filter((check) => check.status === 'warning').length;
    const failedCount = health.filter((check) => check.status === 'failed').length;

    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    const handleAddUser = () => {
        setSelectedUser(null);
        setShowUserModal(true);
    };

    const handleEditUser = (user: User) => {
        setSelectedUser(user);
        setShowUserModal(true);
    };

    const handleImpersonateUser = (user_id: number) => {
        return axios.post(route('admin.users.impersonate', user_id));
    };

    const handleLockUser = (user_id: number) => {
        return axios.post(route('admin.users.lock', user_id));
    };

    const handleUnLockUser = (user_id: number) => {
        return axios.post(route('admin.users.unlock', user_id));
    };

    const handleCloseUserModal = () => {
        setShowUserModal(false);
        setSelectedUser(null);
    };

    const updateTaxonomy = () => {
        axios.post(route('admin.taxonomy')).then(() => {
            setSelectedAction("Update Taxonomy");
            setSelectedNotification("Started download and import Job");
        })
            .catch((error) => {
                setSelectedNotification('Failed: ' + error.message);
            })
            .finally(() => {
                setSelectedAction('Update Taxonomy');
            })
    };

    const updateIndex = () => {
        setSelectedAction('Update Qlever Index');
        setSelectedNotification('...');
        axios.post(route('admin.index')).then((response) => {
            setSelectedNotification(response.data.message);
        })
            .catch((error) => {
                setSelectedNotification('Failed: ' + error.message);
            })
            .finally(() => {
                setSelectedAction('Update Taxonomy');
            })
    };

    const pruneJobs = () => {
        setSelectedAction('Prune Jobs');
        setSelectedNotification('...');
        axios.post(route('admin.prune')).then(() => {
            setSelectedNotification('Success');
        })
            .catch((error) => {
                setSelectedNotification('Failed: ' + error.message);
            })
    };

    const stats = [
        { label: 'Genome assemblies', value: data.assemblies, icon: 'bi-database', detail: data.public_assemblies + ' public' },
        { label: 'Taxa', value: data.taxa, icon: 'bi-diagram-3', detail: 'with data' },
        { label: 'Users', value: data.users, icon: 'bi-people', detail: 'registered' },
        { label: 'Collection(s)', value: data.collections, icon: 'bi-collection', detail: data.public_collections + ' public collection(s)' },
        { label: 'Available analyses', value: data.analyses, icon: 'bi-activity', detail: 'BUSCO, fCat and others' },
        { label: 'Knowledge graph triples', value: qlever && qlever['num-triples-normal'] || '-', icon: 'bi-share', detail: 'QLever index' },
    ];

    const jobs: AdminJob[] = [
        {
            name: 'Clear application cache',
            description: <>Invalidate cached application data and regenerate it on demand.<br/>This includes: visualization data, summary statistics & federated wikidata.</>,
            icon: 'bi-arrow-clockwise',
            variant: 'outline-secondary',
            action: 'Clear cache',
            action_handle: flushCache,
        },
        {
            name: 'Cleanup temporary files',
            description: <>Remove expired temporary uploads and intermediate files.<br/>Files older than one week will be removed.</>,
            icon: 'bi-folder-x',
            variant: 'outline-secondary',
            action: 'Run cleanup',
            action_handle: cleanData,
        },
        {
            name: 'Refresh taxonomy',
            description: <>Synchronize taxonomy metadata with the configured NCBI source.<br/><code>https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/new_taxdump/new_taxdump.tar.gz</code></>,
            icon: 'bi-diagram-3',
            variant: 'outline-secondary',
            action: 'Refresh taxonomy',
            action_handle: updateTaxonomy,
        },
        {
            name: 'Rebuild knowledge graph',
            description: 'Recreate the QLever index from available RDF data.',
            icon: 'bi-share',
            variant: 'outline-secondary',
            action: 'Rebuild index',
            action_handle: updateIndex,
        },
        {
            name: 'Prune job history',
            description: 'Failed jobs and jobs which were completed longer than one week ago or started longer than two weeks ago will be pruned.',
            icon: 'bi-trash3',
            variant: 'outline-danger',
            action: 'Prune history',
            dangerous: true,
            action_handle: pruneJobs
        },
    ];


    useEffect(() => {
        let cancelled = false;

        const loadHealth = async () => {
            const curr_health = [];

            if (db) {
                curr_health.push({
                    name: 'PostgreSQL',
                    description: `Primary application database / ${db.db_size}`,
                    status: parseFloat(db.cache_hit_pct) < 99 ? 'warning' : 'healthy',
                    detail: 'Connected',
                });
            } else {
                curr_health.push({
                    name: 'PostgreSQL',
                    description: 'Primary application database',
                    status: 'failed',
                    detail: 'Not Connected',
                });
            }

            curr_health.push({
                name: 'Cache',
                description: 'Cached data and queue backend',
                status: cache_healthy ? 'healthy' : 'failed',
                detail: cache_healthy ? 'Connected' : 'Not Connected',
            });

            const [horizon, reverb] = await Promise.all([checkHorizon(), checkReverb()]);
            curr_health.push(horizon, reverb);
            if (qlever) {
                curr_health.push({
                    name: 'Qlever',
                    description: 'Triple store and knowledge graph',
                    status: qlever['num-triples-normal'] > 0 ? 'healthy' : 'failed',
                    detail: qlever['num-triples-normal'].toLocaleString('en-GB') + ' triples',
                });
            }

            const store_pct = (vault.disk_total - vault.disk_free) / vault.disk_total * 100
            curr_health.push({
                name: 'Filesystem',
                description: 'Data storage',
                status: store_pct < 80 && 'healthy' || 'warning', detail: store_pct.toFixed(1) + '% used' });

            if (!cancelled) {
                setHealth(curr_health);
            }
        };

        loadHealth();

        return () => {
            cancelled = true;
        };
    }, [db, cache_healthy]);

    return (
        <>
            <Head title="Administration" />
            <TopNavBar />
            <main className="admin-page">
                <UserModal show={showUserModal} onHide={handleCloseUserModal} user={selectedUser} />
                {/* Header */}
                <header className="admin-page-header">
                    <Container fluid className="px-lg-4 px-3">
                        <div className="admin-page-header-inner">
                            <div>
                                <div className="admin-page-eyebrow">
                                    <i className="bi bi-shield-lock me-2" />
                                    G-nom administration
                                </div>
                                <h1 className="admin-page-title">System dashboard</h1>
                                <p className="text-secondary mb-0">Monitor application health, manage users and maintain genomic resources.</p>
                            </div>
                            <div className="admin-header-actions">
                                <Badge bg="secondary" className="admin-environment-badge">
                                    <i className="bi bi-server me-2" />
                                    Production
                                </Badge>
                                <Button variant="outline-secondary" onClick={() => window.location.reload()}>
                                    <i className="bi bi-arrow-clockwise me-2" />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                    </Container>
                </header>

                <Container fluid className="px-lg-4 py-lg-5 px-3 py-4">
                    {/* Statistics */}
                    <section className="admin-section">
                        <div className="admin-section-heading">
                            <div>
                                <h2 className="admin-section-title">Database overview</h2>
                                <p className="text-secondary mb-0">Key metrics across the G-nom platform.</p>
                            </div>
                        </div>

                        <Row className="g-3">
                            {stats.map((stat) => (
                                <Col key={stat.label} xs={12} sm={6} lg={4} xxl={2}>
                                    <Card className="gnom-panel admin-stat-card h-100">
                                        <Card.Body>
                                            <div className="admin-stat-icon">
                                                <i className={`bi ${stat.icon}`} />
                                            </div>
                                            <div className="admin-stat-value">{stat.value.toLocaleString('en-GB')}</div>
                                            <div className="admin-stat-label">{stat.label}</div>
                                            <div className="admin-stat-detail">{stat.detail}</div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </section>

                    {/* Health + Queue */}
                    <section className="admin-section">
                        <Row className="g-4">
                            <Col xs={12} xl={8}>
                                <Card className="gnom-panel h-100">
                                    <Card.Header className="admin-card-header">
                                        <span>
                                            <i className="bi bi-heart-pulse me-2" />
                                            System health
                                        </span>
                                        <div className="admin-health-summary">
                                            <Badge bg="success">{healthyCount} healthy</Badge>
                                            <Badge bg="warning" text="dark">
                                                {warningCount} warning
                                            </Badge>
                                            <Badge bg="danger">{failedCount} failed</Badge>
                                        </div>
                                    </Card.Header>

                                    <Card.Body className="p-0">
                                        <div className="admin-health-list">
                                            {health.map((check) => (
                                                <div className="admin-health-item" key={check.name}>
                                                    <div className={`admin-health-icon ${check.status}`}>
                                                        <i className={`bi ${statusIcons[check.status]}`} />
                                                    </div>
                                                    <div className="admin-health-info">
                                                        <div className="fw-semibold">{check.name}</div>
                                                        <div className="text-secondary small">{check.description}</div>
                                                    </div>
                                                    <div className="admin-health-result">
                                                        <span className={`admin-health-detail ${check.status}`}>{check.detail}</span>
                                                        <span className="text-secondary small">{statusLabels[check.status]}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>

                            <Col xs={12} xl={4}>
                                <Card className="gnom-panel admin-storage-card">
                                    <Card.Header>
                                        <i className="bi bi-device-hdd me-2" />
                                        Storage usage
                                    </Card.Header>
                                    <Card.Body>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="fw-semibold">Vault</span>
                                            <span className="text-secondary">
                                                {(((vault.disk_total - vault.disk_free) / vault.disk_total) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="progress admin-storage-progress mb-3">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${(vault.disk_free / vault.disk_total) * 10}%` }}
                                                role="progressbar"
                                                aria-valuenow={82}
                                                aria-valuemin={(((vault.disk_total - vault.disk_free) / vault.disk_total) * 100).toFixed(0)}
                                                aria-valuemax={100}
                                            />
                                        </div>
                                        <div className="d-flex justify-content-between small text-secondary">
                                            <span>{((vault.disk_total - vault.disk_free) / 1024 ** 3).toFixed(1)}GB used</span>
                                            <span>{(vault.disk_total / 1024 ** 3).toFixed(1)}GB total</span>
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </section>

                    {/* Users */}
                    <section className="admin-section">
                        <div className="admin-section-heading">
                            <div>
                                <h2 className="admin-section-title">User management</h2>
                                <p className="text-secondary mb-0">Browse accounts, inspect roles and manage access.</p>
                            </div>
                            <Button variant="primary" onClick={handleAddUser}>
                                <i className="bi bi-person-plus me-2" />
                                Add user
                            </Button>
                        </div>

                        <Card className="gnom-panel admin-users-panel">
                            <Card.Body className="admin-users-toolbar">
                                <Form.Control
                                    placeholder="Search users..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="admin-user-search"
                                    aria-label="Search users"
                                />
                                <Form.Select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="admin-role-filter"
                                    aria-label="Filter by role"
                                >
                                    <option value="all">All roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="user">User</option>
                                </Form.Select>
                            </Card.Body>

                            <Table responsive hover className="admin-users-table mb-0">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <span className="admin-user-avatar">
                                                        <i className="bi bi-person" />
                                                    </span>
                                                    <div>
                                                        <div className="fw-semibold">{user.name}</div>
                                                        <div className="text-secondary small">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg={user.role === 'admin' ? 'primary' : 'secondary'}>{user.role}</Badge>
                                            </td>
                                            <td>
                                                <span className={user.is_locked && 'admin-user-status locked' || 'admin-user-status active'}>
                                                    <span className="admin-status-dot" />
                                                    {user.is_locked && "Locked" || "Active"}
                                                </span>
                                            </td>
                                            <td className="text-secondary">{user.created_at}</td>
                                            <td>
                                                <div className="admin-user-actions">
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        aria-label={`Edit ${user.name}`}
                                                        onClick={() => handleEditUser(user)}
                                                        title="Edit user"
                                                    >
                                                        <i className="bi bi-pencil" />
                                                    </Button>
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        title="Impersonate User"
                                                        onClick={() => handleImpersonateUser(user.id)}
                                                    >
                                                        <i className="bi bi-incognito" />
                                                    </Button>
                                                    {
                                                        user.role !== 'admin' &&
                                                        <Button
                                                            variant={(user.is_locked && 'outline-success') || 'outline-danger'}
                                                            size="sm"
                                                            title={(user.is_locked && 'Unlock account') || 'Lock account'}
                                                            onClick={() => {
                                                                if (!user.is_locked) {
                                                                    handleLockUser(user.id);
                                                                } else {
                                                                    handleUnLockUser(user.id);
                                                                }
                                                            }}
                                                        >
                                                            <i className="bi bi-person-fill-lock" />
                                                        </Button>
                                                    }

                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-secondary py-5 text-center">
                                                No users match your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                            <Card.Footer className="admin-table-footer">
                                Showing {filteredUsers.length} of {users.length} users
                            </Card.Footer>
                        </Card>
                    </section>

                    {/* Jobs */}
                    <section className="admin-section">
                        <div className="admin-section-heading">
                            <div>
                                <h2 className="admin-section-title">Administrative operations</h2>
                                <p className="text-secondary mb-0">Maintenance tasks and background operations.</p>
                            </div>
                        </div>

                        <Row className="g-3">
                            {jobs.map((job) => (
                                <Col key={job.name} xs={12} md={6} xl={4}>
                                    <Card className="gnom-panel admin-job-card h-100">
                                        <Card.Body>
                                            <div className={`admin-job-icon ${job.dangerous ? 'danger' : ''}`}>
                                                <i className={`bi ${job.icon}`} />
                                            </div>
                                            <h3 className="admin-job-title">{job.name}</h3>
                                            <p className="text-secondary small admin-job-description">{job.description}</p>
                                            <Button variant={job.variant} onClick={() => job.action_handle()} className="admin-job-button">
                                                {job.action}
                                                <i className="bi bi-arrow-right ms-2" />
                                            </Button>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        {selectedAction && (
                            <div className="alert alert-info mb-0 mt-3" role="status">
                                <i className="bi bi-info-circle me-2" />
                                <strong>{selectedAction}</strong> selected. {selectedNotification}
                                <Button variant="link" size="sm" onClick={() => setSelectedAction(null)} className="ms-2">
                                    Dismiss
                                </Button>
                            </div>
                        )}
                    </section>
                </Container>
            </main>
        </>
    );
}
