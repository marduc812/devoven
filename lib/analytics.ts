/**
 * Keeps user data out of the analytics stream.
 *
 * Tools carry their state in the query string: `?from=<whatever was pasted>`
 * on every text tool, `?p=<encoded pipeline>` which /blocks syncs into the
 * address bar as you build. Both Vercel Analytics and Google Analytics record
 * the full page URL, so without this the payload of a share link - a password,
 * a token, a private note - would be sent to a third party along with the hit.
 *
 * Only the page identity is ever needed to count a visit, so everything after
 * the path is dropped: query, fragment, and any userinfo in the authority.
 */

export function sanitizeAnalyticsUrl(url: string): string {
    try {
        // A base makes path-only inputs ("/encoding/base64?from=x") parse too;
        // it is only consulted when `url` is relative, so absolute URLs keep
        // their own origin.
        const parsed = new URL(url, 'https://relative.invalid');
        const clean = `${parsed.origin}${parsed.pathname}`;
        return parsed.origin === 'https://relative.invalid' ? parsed.pathname : clean;
    } catch {
        // Not parseable as a URL. Cut at the first delimiter by hand rather
        // than passing the raw string through.
        return url.split(/[?#]/)[0];
    }
}
