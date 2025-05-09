import { router } from '@inertiajs/react';

interface PaginationProps {
    links: { url: string | null; label: string; active: boolean }[];
}

const Pagination = ({ links }: PaginationProps) => {
    if (links.length <= 1) return null; // Hide pagination if there is only one page

    return (
        <nav>
            <ul className="pagination">
                {links.map((link, index) => {
                    if (!link.url) {
                        return (
                            <li key={index} className="page-item disabled">
                                <span className="page-link" dangerouslySetInnerHTML={{ __html: link.label }} />
                            </li>
                        );
                    }

                    return (
                        <li key={index} className={`page-item ${link.active ? 'active' : ''}`}>
                            <button
                                className="page-link"
                                onClick={() => router.visit(link.url!)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
};

export default Pagination;
