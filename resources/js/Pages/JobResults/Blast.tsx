import TopNavBar from '@/Components/TopNavBar';
import { Badge, Button, Container, Table } from 'react-bootstrap';
import SmartTable from '@/Components/SmartTable';

const job_map = {
    pending: <Badge bg={'secondary'}>pending</Badge>,
    running: <Badge>running</Badge>,
    completed: <Badge bg={'success'}>completed</Badge>,
    failed: <Badge bg={'danger'}>failed</Badge>,
};

function formatDate(time_string) {
    const date = new Date(time_string);
    return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE')}`;
}

export default function BlastResult({ job, data }) {
    console.log(data);
    return (
        <>
            <TopNavBar />
            <Container style={{ minHeight: '100vh' }}>
                <h2 className="display-6 fw-bold mb-3 mt-5 text-center">Job</h2>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Status</th>
                            <th>Job Type</th>
                            <th>Queued</th>
                            <th>Started</th>
                            <th>Finished</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{job.id}</td>
                            <td>{job_map[job.status]}</td>
                            <td>{job.job_class}</td>
                            <td>{formatDate(job.created_at)}</td>
                            <td>{formatDate(job.finished_at)}</td>
                            <td>{formatDate(job.started_at)}</td>
                            <td>
                                <Button>
                                    <i className="bi bi-arrow-clockwise"></i>
                                </Button>
                                <Button className="ml-2" variant="danger" disabled>
                                    <i className="bi bi-trash"></i>
                                </Button>
                            </td>
                        </tr>
                    </tbody>
                </Table>
                <h2 className="display-6 fw-bold mb-3 mt-5 text-center">Query Results</h2>
                <SmartTable
                    row_keys={data.map((row) => {
                        return row['id'];
                    })}
                    col_keys={[
                        { label: 'QuerySeqID', value: 'qseqid' },
                        { label: 'SeqID', value: 'sseqid' },
                        { label: '% identity', value: 'pident' },
                        { label: 'Mismatches', value: 'mismatch' },
                        { label: 'Gaps', value: 'gapopen' },
                        { label: 'Start (Query)', value: 'qstart' },
                        { label: 'End (Query)', value: 'qend' },
                        { label: 'Start (Seq)', value: 'sstart' },
                        { label: 'End (Seq)', value: 'send' },
                        { label: 'e-value', value: 'evalue' },
                        { label: 'Bitscore', value: 'bitscore' },
                        { label: 'Actions', value: 'actions' },
                    ]}
                    master_data={data.map((row) => {
                        const assembly_id = row['stitle'].split('|')[1];
                        row['actions'] = (
                            <>
                                <Button size={'sm'} href={`/browser/${assembly_id}?location=${row['sseqid']}|${row['sstart']}|${row['send']}`}>
                                    <i className="bi bi-mouse"></i>
                                </Button>
                            </>
                        );
                        row['sseqid'] = (
                            <>
                                <Button size={'sm'} href={'/assemblies/' + assembly_id}>
                                    {assembly_id} <i className="bi bi-caret-right-fill"></i>
                                </Button>{' '}
                                <Button size={'sm'}>{row['sseqid']}</Button>
                            </>
                        );
                        return row;
                    })}
                    passClick={null}
                    searchable_keys={['qseqid', 'sseqid']}
                />
            </Container>
        </>
    );
}
