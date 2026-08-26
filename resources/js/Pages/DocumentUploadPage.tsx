import TopNavBar from '@/Components/TopNavBar';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useState } from 'react';

export default function DocumentUploadPage() {
    const [documents, setDocuments] = useState<File[] | null>(null);
    const [status, setStatus] = useState<boolean|null>(null);
    const [statusText, setStatusText] = useState<string|null>(null);

    const handle_upload = () => {
        const formData = new FormData();

        documents.forEach((file) => {
            formData.append('files[]', file);
        });

        axios.post(route('documents.upload'), formData)
            .then((response) => {
                if (response.status === 200) {
                    setStatus(true);
                    setStatusText('Documents uploaded successfully');
                }
            })
            .catch((error) => {
                setStatus(false);
                setStatusText(error.toString());
            });
    };

    return (
        <>
            <TopNavBar />
            <Container className="mt-5">
                <h1>Upload a new document</h1>
                <Alert className="mt-3" variant="warning">
                    <Alert.Heading className="mt-0">
                        <i className="bi bi-exclamation-diamond"></i> Intellectual Property
                    </Alert.Heading>
                    <p>
                        Documents you upload here will be available to all other users of this G-nom Instance. Please verify copyright information of
                        the document and comply with your organization's policy on intellectual property.
                    </p>
                </Alert>
                <p>
                    You may upload research documents in .pdf format here. G-nom will store the document, parse it using GROBID and embed individual
                    chunks in a vector storage to enable AI agents to use contents of the document for their answers.
                </p>
                <Form.Group controlId="formFile" className="mt-3">
                    <Form.Control
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => {
                            const files = (e.target as HTMLInputElement).files;

                            if (files) {
                                setDocuments(Array.from(files));
                            }
                        }}
                    />
                    <Button onClick={() => handle_upload()} disabled={!documents} className="mt-2">
                        Upload document
                    </Button>
                </Form.Group>
                {status != null && (
                    <Alert className="mt-3" variant={status ? 'success' : 'danger'}>
                        <p>{statusText}</p>
                    </Alert>
                )}
            </Container>
        </>
    );
}
