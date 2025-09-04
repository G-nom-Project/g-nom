import TopNavBar from '@/Components/TopNavBar';
import { Button, Card, Col, Form, Row, Container } from 'react-bootstrap';
import React, { useState } from "react";
import {Assembly} from "@/types/data";

export default function BrowserSelection({ assemblies }) {
    const [assemblyID, SetAssemblyID] = useState<number>();

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
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => SetAssemblyID(e.target.value as number)}
                                    value={assemblyID}
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
