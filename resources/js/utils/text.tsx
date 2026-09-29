export function truncateAtWord(text: string, maxLength: number, suffix = '...') {
    if (text.length <= maxLength) {
        return text;
    }

    // Take the substring up to the maximum length
    let truncated = text.slice(0, maxLength);

    // If a space exists, cut at the last full word
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
        truncated = truncated.slice(0, lastSpace);
    }

    // Remove trailing punctuation/spaces if desired
    truncated = truncated.trim();
    return truncated + suffix;
}

export const copyMessage = async (message: string) => {
    if (navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = message;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';

    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
};
