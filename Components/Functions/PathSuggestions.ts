import { menu } from '@/menu';
import { MenuLinkType } from '@/types';

// Path segments that name a category rather than a tool. They are useless as
// search terms (every tool in the category would match), but they do hint at
// where the user was heading, so they survive as a weak ranking bonus.
const CATEGORY_SEGMENTS = new Set([
    'encoding', 'hashing', 'converting', 'tools', 'text', 'image', 'network', 'blocks', 'search',
]);

// Joiners and boilerplate that show up in most tool names, slugs and old URLs.
const STOP_WORDS = new Set([
    'to', 'from', 'and', 'or', 'the', 'a', 'an', 'of', 'my',
    'online', 'free', 'tool', 'tools', 'index', 'page',
    'html', 'htm', 'php', 'aspx', 'jsp', 'www', 'com',
]);

const tokenize = (value: string): string[] =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .split(' ')
        .filter(Boolean);

/**
 * Bounded edit-distance check: are the two words one typo apart? Covers a single
 * substitution, an adjacent transposition, and a single insertion/deletion.
 */
export const isNearMatch = (a: string, b: string): boolean => {
    if (a === b) return true;

    const diff = a.length - b.length;
    if (Math.abs(diff) > 1) return false;

    if (diff === 0) {
        const mismatches: number[] = [];
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) {
                mismatches.push(i);
                if (mismatches.length > 2) return false;
            }
        }
        if (mismatches.length === 1) return true;
        if (mismatches.length !== 2) return false;

        const [x, y] = mismatches;
        return y === x + 1 && a[x] === b[y] && a[y] === b[x];
    }

    const longer = diff === 1 ? a : b;
    const shorter = diff === 1 ? b : a;
    let i = 0;
    let j = 0;
    let skipped = false;

    while (i < longer.length && j < shorter.length) {
        if (longer[i] === shorter[j]) {
            i++;
            j++;
            continue;
        }
        if (skipped) return false;
        skipped = true;
        i++;
    }

    return true;
};

/** The tool slug a 404'd path was most likely aiming at, stripped of extensions. */
export const extractTargetSlug = (pathname: string): { slug: string; category?: string } => {
    let decoded = pathname;
    try {
        decoded = decodeURIComponent(pathname);
    } catch {
        // Malformed escape sequence - fall through with the raw path.
    }

    const segments = decoded.toLowerCase().split('/').filter(Boolean);
    const category = segments.find(segment => CATEGORY_SEGMENTS.has(segment));
    const target = [...segments].reverse().find(segment => !CATEGORY_SEGMENTS.has(segment)) ?? '';

    return { slug: target.replace(/\.(html?|php|aspx|jsp)$/, ''), category };
};

/**
 * Rank tools against a 404'd URL so the "Did you mean?" list actually reflects
 * what the user typed. Words in the path are matched against each tool's name,
 * slug and type, with whole-slug overlap and the category weighing in.
 */
export const getPathSuggestions = (pathname: string, limit = 5): MenuLinkType[] => {
    const { slug, category } = extractTargetSlug(pathname);
    const terms = tokenize(slug).filter(token => !STOP_WORDS.has(token));

    if (terms.length === 0) return [];

    const scored = menu
        .flatMap(group => group.links)
        .map(link => {
            const linkSlug = link.link.split('/').pop() ?? '';

            if (linkSlug === slug) return { link, score: Number.MAX_SAFE_INTEGER };

            const words = Array.from(new Set([
                ...tokenize(link.name),
                ...tokenize(linkSlug),
            ])).filter(word => !STOP_WORDS.has(word));

            // The type is shared by dozens of tools ("hash", "web", "color"), so
            // it only ever nudges the ranking - it can't carry a suggestion.
            const typeWords = tokenize(link.type);

            let score = 0;
            for (const term of terms) {
                if (words.includes(term)) {
                    score += 3;
                } else if (words.some(word =>
                    word.length > 2 && term.length > 2 && (word.startsWith(term) || term.startsWith(word))
                )) {
                    score += 1.5;
                } else if (term.length > 3 && words.some(word => isNearMatch(term, word))) {
                    // Tolerate a typo: /base46-encdoe still finds Base64 Encode.
                    score += 1;
                } else if (typeWords.includes(term)) {
                    score += 1;
                }
            }

            if (score === 0) return { link, score: 0 };

            // Whole-slug overlap is a far stronger signal than loose word hits.
            if (linkSlug.includes(slug) || slug.includes(linkSlug)) score += 2;
            if (category && link.link.startsWith(`/${category}/`)) score += 0.5;

            return { link, score };
        })
        .filter(entry => entry.score >= 2.5);

    scored.sort((a, b) => b.score - a.score || a.link.name.length - b.link.name.length);

    return scored.slice(0, limit).map(entry => entry.link);
};
