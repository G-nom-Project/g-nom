import { usePage } from '@inertiajs/react';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import gnom_logo from '../../static/logo/gnom.png';
import tbg_logo from '../../static/logo/tbg.svg';

const TopBar = () => {
    const user = usePage().props.auth.user;
    return (
        <Navbar bg="dark" variant="dark" expand="lg" data-bs-theme="dark">
            <Container fluid>
                <a href={'/'}>
                    <Navbar.Brand>
                        <img
                            src={gnom_logo}
                            width={'60vw'}
                            className="logo-gnom d-inline-block align-bottom"
                            alt="G-nom Logo"
                        />
                        <div className="d-inline-block mx-2 align-top">
                            <div
                                className="vr"
                                style={{
                                    height: '50px',
                                    width: '2px',
                                    color: 'white',
                                    opacity: '100%',
                                }}
                            ></div>
                        </div>
                        <img
                            src={tbg_logo}
                            width={'200vw'}
                            className="logo d-inline-block pb-2 align-bottom"
                            alt="AplBio Logo"
                        />
                    </Navbar.Brand>
                </a>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse>
                    <Nav className="me-auto">
                        <Nav.Link href={route('assemblies')}>
                            Assemblies
                        </Nav.Link>
                        <Nav.Link href={route('dashboard')}>Dashboard</Nav.Link>
                        <Nav.Link href={route('browser')}>
                            Genome Browser
                        </Nav.Link>
                        <Nav.Link href={route('tol')}>Tree of life</Nav.Link>
                    </Nav>
                    <Nav>
                        <Nav.Link>
                            <Button>
                                <i className="bi bi-person-circle" />{' '}
                                {(user && user.name) || 'Not logged in'}
                            </Button>
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default TopBar;
