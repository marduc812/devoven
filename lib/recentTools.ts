/**
 * Per-browser record of which tools someone actually uses.
 *
 * A visit bumps a counter and stamps the time; the landing page reads the top
 * entries back to show a "Recently Used" strip. Everything lives in
 * localStorage - like the tools themselves, nothing leaves the tab.
 */

export const RECENT_TOOLS_KEY = 'devoven:recent-tools';

/** Entries kept in storage. Past this, the least-used tool is dropped. */
export const MAX_TRACKED = 40;

export type ToolUsage = {
  /** Tool path, e.g. '/encoding/base64-encode'. Doubles as the id. */
  link: string;
  name: string;
  /** Menu group the tool belongs to, e.g. 'encode'. */
  category: string;
  count: number;
  /** Epoch milliseconds of the most recent visit. */
  lastUsed: number;
};

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>;

function getStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    // Storage blocked (private mode, cookies off). Tracking is optional.
    return null;
  }
}

function isUsage(value: unknown): value is ToolUsage {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.link === 'string' &&
    entry.link.length > 0 &&
    typeof entry.name === 'string' &&
    typeof entry.category === 'string' &&
    typeof entry.count === 'number' &&
    Number.isFinite(entry.count) &&
    typeof entry.lastUsed === 'number' &&
    Number.isFinite(entry.lastUsed)
  );
}

export function parseUsage(raw: string | null): ToolUsage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isUsage);
  } catch {
    return [];
  }
}

/**
 * Most used first, ties broken by how recently the tool was opened - so a tool
 * used once today outranks another used once last month.
 */
export function sortUsage(entries: ToolUsage[]): ToolUsage[] {
  return [...entries].sort(
    (a, b) => b.count - a.count || b.lastUsed - a.lastUsed
  );
}

/** Returns the list with `visit` counted, sorted and trimmed to MAX_TRACKED. */
export function recordUsage(
  entries: ToolUsage[],
  visit: Omit<ToolUsage, 'count' | 'lastUsed'>,
  now: number = Date.now()
): ToolUsage[] {
  const existing = entries.find((entry) => entry.link === visit.link);
  const updated: ToolUsage = {
    ...visit,
    count: (existing?.count ?? 0) + 1,
    lastUsed: now,
  };
  const rest = entries.filter((entry) => entry.link !== visit.link);
  return sortUsage([updated, ...rest]).slice(0, MAX_TRACKED);
}

export function readUsage(): ToolUsage[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    return sortUsage(parseUsage(storage.getItem(RECENT_TOOLS_KEY)));
  } catch {
    return [];
  }
}

/** Counts a visit and returns the stored list. A no-op without storage. */
export function trackToolUsage(
  visit: Omit<ToolUsage, 'count' | 'lastUsed'>
): ToolUsage[] {
  const storage = getStorage();
  if (!storage) return [];
  const next = recordUsage(readUsage(), visit);
  try {
    storage.setItem(RECENT_TOOLS_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or storage revoked mid-session - not worth surfacing.
  }
  return next;
}

export function clearUsage(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(RECENT_TOOLS_KEY);
  } catch {
    // Ignore - nothing the user can act on.
  }
}
