import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';

type UserRole = 'admin' | 'user';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

interface UserModalProps {
    show: boolean;
    onHide: () => void;
    user?: AdminUser | null;
}

export default function UserModal({ show, onHide, user = null }: UserModalProps) {
    const isEditing = user !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'user' as UserRole,
    });

    useEffect(() => {
        if (show) {
            setData({
                name: user?.name ?? '',
                email: user?.email ?? '',
                password: '',
                password_confirmation: '',
                role: user?.role ?? 'user',
            });

            clearErrors();
        }
    }, [show, user?.id]);

    const handleClose = () => {
        reset();
        clearErrors();
        onHide();
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => handleClose(),
        };

        if (isEditing && user) {
            put(route('admin.user.edit', [user.id]), options);
        } else {
            post('/admin/users', options);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered size="lg" className="gnom-admin-modal">
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <div>
                        <Modal.Title>
                            <i className={`bi ${isEditing ? 'bi-person-gear' : 'bi-person-plus'} me-2`} />
                            {isEditing ? 'Edit user' : 'Add user'}
                        </Modal.Title>

                        <div className="text-secondary small mt-1">
                            {isEditing ? 'Update account details and permissions.' : 'Create a new user account.'}
                        </div>
                    </div>
                </Modal.Header>

                <Modal.Body>
                    <Form.Group className="mb-3" controlId="adminUserName">
                        <Form.Label>Full name</Form.Label>
                        <Form.Control
                            type="text"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            isInvalid={!!errors.name}
                            required
                        />
                        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="adminUserEmail">
                        <Form.Label>Email address</Form.Label>
                        <Form.Control
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            isInvalid={!!errors.email}
                            required
                        />
                        <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="adminUserRole">
                        <Form.Label>Role</Form.Label>
                        <Form.Select value={data.role} onChange={(e) => setData('role', e.target.value as UserRole)} isInvalid={!!errors.role}>
                            <option value="user">User</option>
                            <option value="admin">Administrator</option>
                        </Form.Select>

                        <Form.Text className="text-secondary">Administrators can access user management and system maintenance functions.</Form.Text>

                        <Form.Control.Feedback type="invalid">{errors.role}</Form.Control.Feedback>
                    </Form.Group>

                    <hr className="my-4" />

                    <h6 className="fw-semibold mb-3">
                        <i className="bi bi-shield-lock me-2" />
                        {isEditing ? 'Change password' : 'Password'}
                    </h6>

                    {isEditing && <p className="text-secondary small">Leave the password fields empty to keep the current password.</p>}

                    <Form.Group className="mb-3" controlId="adminUserPassword">
                        <Form.Label>{isEditing ? 'New password' : 'Password'}</Form.Label>

                        <Form.Control
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            isInvalid={!!errors.password}
                            required={!isEditing}
                            autoComplete="new-password"
                        />

                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group controlId="adminUserPasswordConfirmation">
                        <Form.Label>Confirm password</Form.Label>

                        <Form.Control
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            isInvalid={!!errors.password_confirmation}
                            required={!isEditing || data.password.length > 0}
                            autoComplete="new-password"
                        />

                        <Form.Control.Feedback type="invalid">{errors.password_confirmation}</Form.Control.Feedback>
                    </Form.Group>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={handleClose} disabled={processing}>
                        Cancel
                    </Button>

                    <Button variant="primary" type="submit" disabled={processing}>
                        {processing ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-check-lg me-2" />
                                {isEditing ? 'Save changes' : 'Create user'}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
}

export type { AdminUser };
