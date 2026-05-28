import { router } from '@inertiajs/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
}

const Pagination = ({ links }: PaginationProps) => {
    if (links.length <= 1) return null;

    const previousLink = links[0];
    const nextLink = links[links.length - 1];
    const pageLinks = links.slice(1, -1);

    const currentIndex = pageLinks.findIndex((link) => link.active);
    const visibleIndices = new Set<number>();

    for (let i = 0; i < pageLinks.length; i++) {
        const isFirst = i === 0;
        const isLast = i === pageLinks.length - 1;
        const isNearCurrent = Math.abs(i - currentIndex) <= 2;

        if (isFirst || isLast || isNearCurrent) {
            visibleIndices.add(i);
        }
    }

    const renderLink = (link: PaginationLink, key: string | number) => {
        if (!link.url) {
            return (
                <li key={key} className="page-item disabled">
                    <span className="page-link" dangerouslySetInnerHTML={{ __html: link.label }} />
                </li>
            );
        }

        return (
            <li key={key} className={`page-item ${link.active ? 'active' : ''}`}>
                <button type="button" className="page-link" onClick={() => router.visit(link.url)} dangerouslySetInnerHTML={{ __html: link.label }} />
            </li>
        );
    };

    const renderEllipsis = (key: string) => (
        <li key={key} className="page-item disabled">
            <span className="page-link">...</span>
        </li>
    );

    const renderedPageLinks: React.ReactNode[] = [];
    let previousVisibleIndex: number | null = null;

    for (let i = 0; i < pageLinks.length; i++) {
        if (!visibleIndices.has(i)) continue;

        // Insert ellipsis if there is a gap
        if (previousVisibleIndex !== null && i - previousVisibleIndex > 1) {
            renderedPageLinks.push(renderEllipsis(`ellipsis-${i}`));
        }
        renderedPageLinks.push(renderLink(pageLinks[i], `page-${i}`));
        previousVisibleIndex = i;
    }

    return (
        <nav>
            <ul className="pagination">
                {/* Previous */}
                {renderLink(previousLink, 'previous')}
                {/* Page numbers with ellipses */}
                {renderedPageLinks}
                {/* Next */}
                {renderLink(nextLink, 'next')}
            </ul>
        </nav>
    );
};

export default Pagination;
