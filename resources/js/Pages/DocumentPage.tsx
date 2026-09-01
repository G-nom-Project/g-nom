import { ResearchDocument, ResearchDocumentAuthor, ResearchDocumentReference } from '@/types/data';
import { Badge, Container, Table } from 'react-bootstrap';
import TopNavBar from '@/Components/TopNavBar';

export default function DocumentPage({ document } : {document: ResearchDocument}) {
    return (
        <>
            <TopNavBar/>
            <Container style={{ minHeight: '100vh' }} className="mt-2">
                <h1>{document.title}</h1>
                {document.authors.map((each: ResearchDocumentAuthor) => {
                    return (
                        <>
                            <Badge>{each.full_name}</Badge>{' '}
                        </>
                    );
                })}
                <br/>
                {
                    document.doi && <a href={"https://doi.org/" + document.doi}><Badge bg="success">{document.doi}</Badge></a>
                }
                <h2 className="mt-4">Abstract</h2>
                <hr />
                <p>
                    <i>{document.abstract && document.abstract || "No abstract found"}</i>
                </p>
                <h2 className="mt-4">References</h2>
                <hr />
                <p>References were automatically extracted by GROBID and may be malformed or incomplete.</p>
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Reference Text</th>
                        </tr>
                    </thead>
                    <tbody>
                        {document.references.map((each: ResearchDocumentReference) => {
                            return (
                                <tr>
                                    <td>{each.reference_id}</td>
                                    <td><i>{each.content}</i></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
            </Container>
        </>
    );
}
