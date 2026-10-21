import TopNavBar from '@/Components/TopNavBar';
import { Assembly } from '@/types/data';
import React, { useState } from 'react';
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap';

export default function BrowserSelection({ assemblies }:{ assemblies: Assembly[] }) {
    const [assemblyID, SetAssemblyID] = useState<number|null>(null);

    return (
        <>
            <TopNavBar />
            <Container className="d-flex justify-content-center align-items-center vh-100">
                <Row>
                    <Col>
                        <Card className="gnom-panel text-center" style={{ minWidth: '50vh' }}>
                            <Card.Body>
                                <Card.Title>Select assembly</Card.Title>
                                <Form.Select
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => SetAssemblyID(e.target.value as number)}
                                    value={assemblyID as number}
                                >
                                    <option>Select assembly</option>
                                    {assemblies &&
                                        assemblies.map((assembly: Assembly) => (
                                            <option key={assembly.id} value={assembly.id}>
                                                {assembly.name}
                                            </option>
                                        ))}
                                </Form.Select>
                            </Card.Body>
                            <Button href={route('browser', [assemblyID])} className="m-3" disabled={!assemblyID}>
                                Launch Browser
                            </Button>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
