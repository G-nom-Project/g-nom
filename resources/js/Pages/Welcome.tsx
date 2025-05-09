import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {Button, Card, Col, Container, Form, ListGroup, Row} from 'react-bootstrap'
import TopBar from "@/Components/TopNavBar";
import {useEffect} from "react";
import axios from "axios";
import NotificationListener from "@/Components/NotificationsListener";

export default function Welcome({
    auth,
    laravelVersion,
    phpVersion,
}: PageProps<{ laravelVersion: string; phpVersion: string }>) {
    const handleImageError = () => {
        document
            .getElementById('screenshot-container')
            ?.classList.add('!hidden');
        document.getElementById('docs-card')?.classList.add('!row-span-1');
        document
            .getElementById('docs-card-content')
            ?.classList.add('!flex-row');
        document.getElementById('background')?.classList.add('!hidden');
    };



    const DnaLength = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];

    return (
        <>
            <Head title="G-nom" />

            <TopBar/>
            <Container fluid>
                <Row classnName={"mt-2"}>
                    <Col xs={3}>
                        <Card className="mt-2 shadow">
                            <Card.Body>
                                <div className="align-center">
                                    {DnaLength.map((element) => (
                                        <div
                                            className="line"
                                            style={{
                                                marginTop: "15px",
                                                animationDelay: element * 0.1 + "s",
                                                animationDuration: "2s",
                                                marginLeft: "50%"
                                            }}
                                        ></div>
                                    ))}
                                </div>
                            </Card.Body>
                            <Card.Footer>From sequence to function</Card.Footer>
                        </Card>
                    </Col>
                    <Col>
                        <Card className="mt-2 shadow">
                            <Card.Body>
                                <Card.Title>News & Recent Changes</Card.Title>
                                <Card.Subtitle className="text-muted">NCBI ID</Card.Subtitle>
                                <Card.Text>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</Card.Text>
                            </Card.Body>
                            <ListGroup variant="flush">
                                <ListGroup.Item>Added on:</ListGroup.Item>
                            </ListGroup>
                        </Card>
                    </Col>
                    <Col>
                        <Card className="mt-2 shadow">
                            <Card.Body>
                                <Card.Title>Navigation</Card.Title>
                                <Form>
                                    <Form.Label>Choose either option to start browsing the G-nom database</Form.Label>
                                    <Row>
                                        <Col>
                                            <Button variant="primary" href="assemblies" style={{width: "100%"}}>
                                                <i className="bi bi-search"></i> Search for assemblies by Name, ID...
                                            </Button>
                                        </Col>
                                        <Col xs={2}>
                                            <div className='d-flex'>
                                                <hr className='my-auto flex-grow-1 mt-3'></hr>
                                                <div className="px-3 text-muted fw-bold mt-1">or</div>
                                                <hr className="my-auto flex-grow-1 mt-3"></hr>
                                            </div>
                                        </Col>
                                        <Col xs={6}>
                                            <Button style={{width: "100%"}} href="/tol"><i className="bi bi-arrows-move"></i>{'  '}Browse the tree of life (experimental)</Button>
                                        </Col>
                                    </Row>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
}
