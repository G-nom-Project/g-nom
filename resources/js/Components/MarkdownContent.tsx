import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BASE_URL = import.meta.env.VITE_BASE_URL ?? '';

interface MarkdownContentProps {
    file_name: string;
}

export default function MarkdownContent({ file_name }: MarkdownContentProps) {
    const [customMarkdown, setCustomMarkdown] = useState('');

    useEffect(() => {
        fetch(`${BASE_URL}/customization/${file_name}`)
            .then((response) => {
                if (!response.ok) {
                    // 404 = no customization, which is fine
                    return '';
                }

                return response.text();
            })
            .then(setCustomMarkdown)
            .catch(() => {
                // Ignore network errors and just render the normal content
                setCustomMarkdown('');
            });
    }, [file_name]);


    return (
        <>
            {customMarkdown && <ReactMarkdown remarkPlugins={[remarkGfm]}>{customMarkdown}</ReactMarkdown> || <br/>}
        </>
    )
}
