/**
 * Small, dependency-free rich text boundary.
 *
 * The editor can provide a stronger sanitizer (for example DOMPurify) through
 * the `RichTextSanitizer` seam.  The fallback is intentionally conservative so
 * imported Svelte/Quill HTML is safe even when the app is rendered without a
 * DOM.  It is not intended to be a full HTML parser.
 */

export interface RichTextSanitizer {
    sanitize(value: string): string;
}

const ALLOWED_TAGS = new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "blockquote",
    "code",
    "pre",
    "a",
]);

const PLACEHOLDER_HTML = new Set([
    "",
    "<p></p>",
    "<p><br></p>",
    "<ul><li></li></ul>",
    "<ol><li></li></ol>",
]);

const escapeText = (value: string): string =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

const safeUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    // Relative URLs, https/http, mailto, and tel are useful in resumes.  Any
    // other protocol is dropped to prevent javascript/data URL execution.
    if (/^(?:https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
    return "";
};

const stripDangerousBlocks = (value: string): string =>
    value
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<\s*(script|style|iframe|object|embed|template|form)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
        .replace(/<\s*(script|style|iframe|object|embed|template|form)\b[^>]*\/?>/gi, "");

const sanitizeAttributes = (tagName: string, raw: string): string => {
    if (tagName === "br") return "<br>";
    if (tagName !== "a") return `<${tagName}>`;
    const hrefMatch = raw.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    const href = safeUrl(hrefMatch?.[2] ?? "");
    return href ? `<a href="${escapeText(href)}" rel="noreferrer noopener">` : "<a>";
};

/** Sanitize HTML and collapse the empty Quill placeholders used by Svelte. */
export const sanitizeRichText = (value: unknown): string => {
    const source = typeof value === "string" ? value.trim() : "";
    if (PLACEHOLDER_HTML.has(source.toLowerCase())) return "";
    const stripped = stripDangerousBlocks(source)
        // Remove event handlers and style/class attributes before tag parsing.
        .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
        .replace(/\s+(?:style|class|id|src|srcdoc|action|formaction)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

    const sanitized = stripped.replace(/<\s*(\/?)\s*([a-z0-9-]+)([^>]*)>/gi, (_match, slash: string, rawName: string, attrs: string) => {
        const tagName = rawName.toLowerCase();
        if (!ALLOWED_TAGS.has(tagName)) return "";
        if (slash) return `</${tagName}>`;
        return sanitizeAttributes(tagName, attrs);
    });
    // Strip any malformed angle brackets that were not recognised as tags.
    const cleaned = sanitized.replace(/<(?!(?:\/?(?:p|br|strong|b|em|i|u|s|ul|ol|li|h1|h2|h3|blockquote|code|pre|a)(?:\s|>|\/)))[^>]*>/gi, "");
    const normalized = cleaned
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .trim();
    return PLACEHOLDER_HTML.has(normalized.toLowerCase()) ? "" : normalized;
};

export const defaultRichTextSanitizer: RichTextSanitizer = {
    sanitize(value: string): string {
        return sanitizeRichText(value);
    },
};
