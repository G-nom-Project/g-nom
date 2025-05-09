import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button, Toast, ToastContainer } from 'react-bootstrap';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

type Notification = {
    id: number;
    title: string;
    variant: string;
    message: string;
    assemblyID: null | number;
    icon: null | string;
};

const NotificationToasts = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const user = usePage().props.auth.user;

    useEffect(() => {
        // @ts-expect-error Echo is attached to window elsewhere
        if (typeof window.Echo === 'undefined') {
            console.error('Laravel Echo is not initialized');
            return;
        }

        // @ts-expect-error Echo is attached to window elsewhere
        window.Echo.private(`App.Models.User.${user.id}`).notification(
            (notification: Notification) => {
                setNotifications((prev) => [...prev, notification]);
            },
        );

        return () => {
            // @ts-expect-error Echo is attached to window elsewhere
            window.Echo.leaveChannel(`private-App.Models.User.${user.id}`);
        };
    }, [user.id]);

    const removeToast = (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    return (
        <ToastContainer position="top-end" className="p-3">
            <TransitionGroup>
                {notifications.map((notification) => (
                    <CSSTransition
                        key={notification.id}
                        timeout={500}
                        classNames="toast fade"
                    >
                        <Toast
                            className="mt-1"
                            onClose={() => removeToast(notification.id)}
                            delay={15000}
                            autohide
                        >
                            <Toast.Header>
                                <strong className="me-auto">
                                    {notification.icon && (
                                        <i className={notification.icon}></i>
                                    )}{' '}
                                    {notification.title}
                                </strong>
                            </Toast.Header>
                            <Toast.Body>
                                {notification.message}
                                {notification.assemblyID && (
                                    <div className="border-top mt-1 pt-1">
                                        <a
                                            href={
                                                'assemblies/' +
                                                notification.assemblyID
                                            }
                                        >
                                            View assembly
                                        </a>
                                    </div>
                                )}
                            </Toast.Body>
                        </Toast>
                    </CSSTransition>
                ))}
            </TransitionGroup>
        </ToastContainer>
    );
};

export default NotificationToasts;
