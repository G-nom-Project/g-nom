import TopNavBar from '@/Components/TopNavBar';
import { Badge, Button, Container, Table } from 'react-bootstrap';
import { TrackableJob } from '@/types/system';


const job_map = {
    'pending': <Badge bg={'secondary'}>pending</Badge>,
    'running': <Badge>running</Badge>,
    'completed': <Badge bg={'success'}>completed</Badge>,
    'failed': <Badge bg={'danger'}>failed</Badge>,
};

function formatDate(time_string: string | Date) {
    const date = new Date(time_string);
    return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE')}`;
}

export default function Jobs({jobs} : {jobs: TrackableJob[]}) {
    console.log(jobs);
    return (
        <>
            <TopNavBar />
            <Container style={{ minHeight: '100vh' }}>
                {jobs.length == 0 && 'No Jobs'}
                <h2 className="display-6 fw-bold mb-3 mt-5 text-center">My Jobs</h2>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Status</th>
                            <th>Job Type</th>
                            <th>Queue</th>
                            <th>Queued</th>
                            <th>Started</th>
                            <th>Finished</th>
                            <th>Results</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map((job) => (
                            <tr>
                                <td>{job.id}</td>
                                <td>{job_map[job.status]} <Badge>{job.progress}%</Badge></td>
                                <td>{job.job_class.replace("App\\Jobs\\", "")}</td>
                                <td>{job.queue}</td>
                                <td>{formatDate(job.created_at)}</td>
                                <td>{formatDate(job.finished_at)}</td>
                                <td>{formatDate(job.started_at)}</td>
                                <td>
                                    <Button href={`/job/${job.id}`}>
                                        <i className="bi bi-search"></i>
                                    </Button>
                                </td>
                                <td>
                                    <Button>
                                        <i className="bi bi-arrow-clockwise"></i>
                                    </Button>
                                    <Button className="ml-2" variant="danger" disabled>
                                        <i className="bi bi-trash"></i>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Container>
        </>
    );
}
