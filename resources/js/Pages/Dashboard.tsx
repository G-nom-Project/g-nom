import { Head } from '@inertiajs/react';
import { Card, Col, Row } from 'react-bootstrap';
import TopNavBar from '@/Components/TopNavBar';

export default function Dashboard() {
    return (
        <>
            <Head title="Dashboard" />
            <TopNavBar/>
            <div className="container py-4" style={{minHeight: "80vh"}}>
                <Row className="g-4">
                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Bookmarked assemblies</Card.Title>
                                <Card.Text>View assemblies bookmarked by you</Card.Text>
                                <a className="btn btn-primary" href="/bookmarks">
                                    Manage Bookmarks
                                </a>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>Jobs</Card.Title>
                                <Card.Text>Inspect the results of long running tasks.</Card.Text>
                                <a className="btn btn-primary" href="/jobs">
                                    Manage Jobs
                                </a>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card>
                            <Card.Body>
                                <Card.Title>API Tokens</Card.Title>
                                <Card.Text>Generate and manage API tokens for external apps.</Card.Text>
                                <a className="btn btn-primary" href="/api-tokens">
                                    Manage Tokens
                                </a>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row className="mt-4">
                    <Col>
                        <Card>
                            <Card.Body style={{ minHeight: '300px' }}>
                                <Card.Title>More content to come</Card.Title>
                                <Card.Text>...</Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </>
    );
}
