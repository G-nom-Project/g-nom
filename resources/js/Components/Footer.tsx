import { Container, Row, Col } from "react-bootstrap";

const Footer = () => {
    return (
        <footer
            style={{
                backgroundColor: "#343a40",
                color: "#fff",
                padding: "40px 0",
            }}
        >
            <Container>
                <Row>
                    <Col md={4}>
                        <h4>About G-nom</h4>
                        <p>
                            G-nom is a web-based platform for storage and analysis of genome assemblies. G-nom provides rich visualizations of assembly-level and inter-species analyses.
                        </p>
                    </Col>
                    <Col md={4}>
                        <h4>Links</h4>
                        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                            <li>
                                <a href="/impressum" style={{textDecoration: "none" }}>
                                    <i className="bi bi-file-text"></i> Impressum
                                </a>
                            </li>
                            <li>
                                <a href="/privacy" style={{textDecoration: "none" }}>
                                    <i className="bi bi-incognito"></i> Privacy Policy
                                </a>
                            </li>
                        </ul>
                    </Col>
                    <Col md={4}>
                        <h4>Contact Information</h4>
                        <address>
                            General questions? <div className="golden-text">info<i className="bi bi-at"></i>test.com</div>
                        </address>
                    </Col>
                </Row>
                <Row className="mt-4">
                    <Col className="text-center">
                        <small>Gnom is open source software, made with ♥️ by the <a href="https://g-nom-project.github.io/">G-nom Project</a></small>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
};

export default Footer;
