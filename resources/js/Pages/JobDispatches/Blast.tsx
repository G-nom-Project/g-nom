import TopNavBar from '@/Components/TopNavBar';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function DispatchBlast({wait}: {wait?: boolean}) {
    const [query, setQuery] = useState('');
    const [error, setError] = useState(null);

    const dispatchBlastJob = () => {
        axios.put('create-blast', {
            'query': query,
        })
            .then(() => router.visit('/jobs'))
            .catch((error) => setError(error));
    }

    return (
        <>
            <TopNavBar />
            <Container style={{ minHeight: '100vh' }}>
                <h1>Run Quick BLAST Job</h1>
                {wait && (
                    <Alert variant={'warning'}>
                        G-nom is currently rebuilding parts of the BLAST database. The start of your BLAST Job will be delayed until the rebuild is
                        finished.
                    </Alert>
                )}
                {error && <Alert variant="danger">Failed to dispatch: {error.toString()}</Alert>}
                <p className="text-muted">
                    Runs a quick BLASTn search against the entire nucleotide database of this G-nom Instance.
                </p>
                <Form>
                    <Form.Label>Enter Sequence</Form.Label>
                    <Form.Control as="textarea" aria-label="Sequence Input" rows={5} value={query} onChange={(e) => setQuery(e.target.value)} />
                    <Form.Text id="passwordHelpBlock" muted>
                        You sequence must be encoded as a nucleotide sequence and not exceed 2048 characters. Multiple
                        sequences may be submitted separated by headers prefixed by {'>'}, following FASTA convention.
                    </Form.Text>
                    <Button className="mt-2" onClick={() => dispatchBlastJob()} disabled={query.length > 2048}>
                        Submit Job
                    </Button>
                </Form>
            </Container>
        </>
    );
}
