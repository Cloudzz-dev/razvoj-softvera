/**
 * Lightweight HTML sanitization without jsdom dependency
 * Strips all HTML tags and decodes HTML entities for safe plain text output
 * 
 * Note: This replaces isomorphic-dompurify which causes ESM/CommonJS
 * conflicts with jsdom on Vercel serverless environment
 */
// TODO: Replace with DOMPurify when we add rich text support
// Current implementation is safe for plain text only
// HTML entity decode map for common entities
const htmlEntities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x27;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&#x2F;': '/',
    '&#x60;': '`',
    '&#x3D;': '=',
};

/**
 * Decodes HTML entities to their character equivalents
 */
function decodeHtmlEntities(text: string): string {
    // First decode named and hex entities we know about
    let decoded = text;
    for (const [entity, char] of Object.entries(htmlEntities)) {
        decoded = decoded.replace(new RegExp(entity, 'gi'), char);
    }

    // Decode numeric entities (&#123; format)
    decoded = decoded.replace(/&#(\d+);/g, (_, code) => {
        const num = parseInt(code, 10);
        return num > 0 && num < 65536 ? String.fromCharCode(num) : '';
    });

    // Decode hex entities (&#x1F; format)
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
        const num = parseInt(hex, 16);
        return num > 0 && num < 65536 ? String.fromCharCode(num) : '';
    });

    return decoded;
}

/**
 * Strips all HTML tags from content
 */
function stripHtmlTags(html: string): string {
    // Remove script and style tags with their content first
    let clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove all remaining HTML tags
    clean = clean.replace(/<[^>]*>/g, '');

    return clean;
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * Strips all HTML tags and dangerous content
 */
export function sanitizeHtml(dirty: string): string {
    if (typeof dirty !== 'string') {
        return '';
    }

    // First decode HTML entities (this reveals hidden tags like &lt;script&gt;)
    let clean = decodeHtmlEntities(dirty);

    // Then strip all HTML tags (including those that were encoded)
    clean = stripHtmlTags(clean);

    // Remove null bytes and other dangerous characters
    return clean.replace(/\0/g, '');
}

/**
 * Sanitizes content for plain text display
 * Removes HTML and trims whitespace
 */
export function sanitizeText(input: string): string {
    return sanitizeHtml(input).trim();
}

/**
 * Sanitizes message content specifically
 * Allows basic formatting but prevents XSS
 */
export function sanitizeMessage(content: string): string {
    return sanitizeHtml(content).trim();
}
