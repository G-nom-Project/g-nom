import { Link, usePage } from '@inertiajs/react';
import {
    Container,
    Dropdown,
    Nav,
    Navbar,
} from 'react-bootstrap';
import gnom_logo from '../../static/logo/gnom.png';

const TopBar = () => {
    const user = usePage().props.auth.user;
    const custom_logo: string|null = usePage().props.gnom.custom_logo;
    const app_url = usePage().props.gnom.app_url;

    const navigation = [
        {
            label: 'Assemblies',
            route: 'assemblies',
            icon: 'bi-grid-3x3-gap',
        },
        {
            label: 'Collections',
            route: 'collections.index',
            icon: 'bi-collection',
        },
        {
            label: 'Genome Browser',
            route: 'browser',
            icon: 'bi-display',
        },
        {
            label: 'Tree of Life',
            route: 'tol',
            icon: 'bi-diagram-3',
        },
    ];

    return (
        <Navbar expand="lg" variant="dark" data-bs-theme="dark" className="gnom-navbar">
            <Container fluid>
                {/* Branding */}
                <Navbar.Brand as={Link} href={route('welcome')} className="gnom-navbar-brand">
                    <img src={gnom_logo} className="gnom-navbar-logo" alt="G-nom" />

                    {custom_logo && (
                        <>
                            <span className="gnom-navbar-brand-divider" />

                            <img src={app_url + "/" + custom_logo} className="gnom-navbar-logo" alt="Partner logo" />
                        </>
                    )}
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="gnom-navbar-content" className="gnom-navbar-toggle" />

                <Navbar.Collapse id="gnom-navbar-content">
                    {/* Main navigation */}
                    <Nav className="gnom-navbar-links me-auto">
                        {navigation.map((item) => {
                            const url = route(item.route);
                            const isActive =
                                typeof window !== 'undefined' && window.location.pathname === new URL(url, window.location.origin).pathname;

                            return (
                                <Nav.Link key={item.route} as={Link} href={url} active={isActive} className="gnom-navbar-link">
                                    <i className={`bi ${item.icon}`} />
                                    <span>{item.label}</span>
                                </Nav.Link>
                            );
                        })}
                    </Nav>

                    {/* Account actions */}
                    <div className="gnom-navbar-actions">
                        {user && (
                            <Link href={route('bookmarks.get')} className="gnom-navbar-icon-button" title="Bookmarks" aria-label="Bookmarks">
                                <i className="bi bi-bookmark" />
                            </Link>
                        )}

                        <Dropdown align="end">
                            <Dropdown.Toggle variant="outline-light" className="gnom-navbar-account">
                                <span className="gnom-navbar-avatar">
                                    <i className="bi bi-person-fill" />
                                </span>

                                <span className="gnom-navbar-account-name">{user?.name || 'Guest'}</span>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="gnom-navbar-dropdown">
                                {user ? (
                                    <>
                                        <Dropdown.Header>
                                            Signed in as
                                            <div className="fw-semibold text-body mt-1">{user.name}</div>
                                        </Dropdown.Header>

                                        <Dropdown.Divider />

                                        <Dropdown.Item as={Link} href={route('dashboard')}>
                                            <i className="bi bi-speedometer2 me-2" />
                                            Dashboard
                                        </Dropdown.Item>

                                        <Dropdown.Item as={Link} href={route('bookmarks.get')}>
                                            <i className="bi bi-bookmark me-2" />
                                            Bookmarks
                                        </Dropdown.Item>

                                        <Dropdown.Divider />

                                        <Dropdown.Item as={Link} href={route('logout')} method="post" className="text-danger">
                                            <i className="bi bi-box-arrow-right me-2" />
                                            Sign out
                                        </Dropdown.Item>
                                    </>
                                ) : (
                                    <Dropdown.Item as={Link} href={route('dashboard')}>
                                        <i className="bi bi-box-arrow-in-right me-2" />
                                        Sign in
                                    </Dropdown.Item>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default TopBar;
