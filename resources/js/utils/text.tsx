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
