import TopNavBar from '@/Components/TopNavBar';
import { Button, Card, Col, Form, Row, Container } from 'react-bootstrap';
import { useState } from "react";

export default function BrowserSelection({ assemblies }) {
    const [assemblyID, SetAssemblyID] = useState<any>();

    return (
        <>
            <TopNavBar />
            <Container className="d-flex justify-content-center align-items-center vh-100">
                <Row>
                    <Col>
                        <Card className="text-center" style={{minWidth: "50vh"}}>
                            <Card.Body>
                                <Card.Title>Select assembly</Card.Title>
                                <Form.Select
                                    onChange={(e: any) => SetAssemblyID(e.target.value)}
                                    value={assemblyID}
                                >
                                    <option>Select assembly</option>
                                    {assemblies &&
                                        assemblies.map((assembly: any) => (
                                            <option key={assembly.id} value={assembly.id}>
                                                {assembly.name}
                                            </option>
                                        ))}
                                </Form.Select>
                            </Card.Body>
                            <Button href={'/browser/' + assemblyID} className="m-3">
                                Launch Browser
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
