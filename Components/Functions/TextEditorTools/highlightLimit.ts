// Bound native Range allocation and fallback DOM marks independently of search.
// Keep this lower than Monaco's limit because our mirror uses browser DOM ranges.
export const HIGHLIGHT_LIMIT = 1000;
