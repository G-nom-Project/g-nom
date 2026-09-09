import { Link, router, usePage } from '@inertiajs/react';
import { Button, Container, Nav, Navbar } from 'react-bootstrap';
import gnom_logo from '../../static/logo/gnom.png';

const TopBar = () => {
    const user = usePage().props.auth.user;
    return (
        <Navbar bg="dark" variant="dark" expand="lg" data-bs-theme="dark">
            <Container fluid>
                <a href={route('welcome')}>
                    <Navbar.Brand>
                        <img src={gnom_logo} height={'60vw'} className="logo-gnom d-inline-block align-bottom" alt="G-nom Logo" />
                        {import.meta.env.VITE_CUSTOM_LOGO && (
                            <>
                                <div className="d-inline-block mx-2 align-bottom">
                                    <div
                                        className="vr"
                                        style={{
                                            height: '50px',
                                            width: '2px',
                                            color: '#064D05',
                                            opacity: '100%',
                                        }}
                                    ></div>
                                </div>
                                <img
                                    src={import.meta.env.BASE_URL + import.meta.env.VITE_CUSTOM_LOGO}
                                    height={'60vw'}
                                    className="logo-gnom d-inline-block align-bottom"
                                    alt="AplBio Logo"
                                />
                            </>
                        )}
                    </Navbar.Brand>
                </a>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse>
                    <Nav className="me-auto">
                        <Nav.Link href={route('assemblies')}>Assemblies</Nav.Link>
                        <Nav.Link href={route('collections.index')}>Collections</Nav.Link>
                        <Nav.Link href={route('browser')}>Genome Browser</Nav.Link>
                        <Nav.Link href={route('tol')}>Tree of life</Nav.Link>
                    </Nav>
                    <Nav>
                        <Nav.Link>
                            <Button href={route('dashboard')} onClick={() => router.visit('/dashboard')}>
                                <i className="bi bi-person-circle" /> {(user && user.name) || 'Not logged in'}
                            </Button>{' '}
                            {user && (
                                <>
                                    <Button href={route('bookmarks.get')} onClick={() => router.visit('/bookmarks')}>
                                        <i className="bi bi-bookmark"></i>
                                    </Button>{' '}
                                    <Link href={'/logout'} method={'post'} as={'b'}>
                                        <Button href={route('logout')} variant={'danger'}>
                                            <i className="bi bi-door-open"></i>
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default TopBar;
