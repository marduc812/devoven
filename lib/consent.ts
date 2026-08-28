/**
 * Analytics consent, kept per browser in localStorage.
 *
 * Nothing analytics-related loads until someone says yes: "declined" and "not
 * asked yet" are treated the same, so a visitor who ignores the banner is never
 * measured. The tools themselves still run - this covers only Google Analytics
 * and Vercel Analytics, both of which reach off the page.
 */

export const CONSENT_KEY = 'devoven:cookie-consent';

export type ConsentChoice = 'accepted' | 'declined';

/** Cookie name prefixes Google Analytics writes. Cleared when consent is withdrawn. */
const ANALYTICS_COOKIE_PREFIXES = ['_ga', '_gid', '_gat', '_gcl'];

function getStorage(): Storage | null {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        return window.localStorage;
    } catch {
        // Storage blocked (private mode, cookies off). Treated as "no consent".
        return null;
    }
}

export function readConsent(): ConsentChoice | null {
    const raw = getStorage()?.getItem(CONSENT_KEY);
    return raw === 'accepted' || raw === 'declined' ? raw : null;
}

export function writeConsent(choice: ConsentChoice) {
    try {
        getStorage()?.setItem(CONSENT_KEY, choice);
    } catch {
        // Nothing to do: the choice holds for this page view either way.
    }
}

/**
 * Every domain a cookie could have been scoped to, from host-only up the tree:
 * www.devoven.com -> ['', '.www.devoven.com', '.devoven.com']. A cookie only
 * disappears when it is expired with the same domain it was set with.
 */
function cookieDomains(hostname: string): string[] {
    const parts = hostname.split('.');
    const domains = [''];
    for (let i = 0; i <= parts.length - 2; i++) {
        domains.push(`.${parts.slice(i).join('.')}`);
    }
    return domains;
}

/** Drops any GA cookies left behind by an earlier "accept". */
export function clearAnalyticsCookies() {
    if (typeof document === 'undefined') return;
    const domains = cookieDomains(window.location.hostname);

    for (const entry of document.cookie.split(';')) {
        const name = entry.split('=')[0].trim();
        if (!name || !ANALYTICS_COOKIE_PREFIXES.some((prefix) => name.startsWith(prefix))) continue;
        for (const domain of domains) {
            document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
        }
    }
}
