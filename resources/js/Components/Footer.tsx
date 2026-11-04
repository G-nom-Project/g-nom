import { Col, Container, Row } from 'react-bootstrap';
import MarkdownContent from '@/Components/MarkdownContent';
import React from 'react';

const Footer = () => {
    return (
        <footer
            style={{
                backgroundColor: '#343a40',
                color: '#fff',
                padding: '40px 0',
            }}
        >
            <Container>
                <Row>
                    <Col md={8}>
                        <h4>About</h4>
                        <MarkdownContent file_name="footer.md" />
                    </Col>
                    <Col md={4}>
                        <h4>Links</h4>
                        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
                            <li>
                                <a href="/impressum" style={{ textDecoration: 'none' }}>
                                    <i className="bi bi-file-text"></i> Impressum
                                </a>
                            </li>
                        </ul>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col className="text-center">
                        <small>
                            G-nom is open-source software, made with ♥️ by the <a href="https://g-nom-project.github.io/antora-docs/">G-nom Project</a> and
                            licensed under the <a href="https://github.com/G-nom-Project/g-nom/blob/main/LICENSE">GPL 2.0 license</a>.
                        </small>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
