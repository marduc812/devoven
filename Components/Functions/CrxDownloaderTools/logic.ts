export const CRX_ENDPOINT = 'https://clients2.google.com/service/update2/crx';

// Chrome sends its own version here and the store replies with the newest build
// that version can run. A sentinel above any real release always gets the latest,
// so this default never needs bumping.
export const DEFAULT_PRODVERSION = '9999.0.0.0';

export const ID_LENGTH = 32;

// Extension IDs are the hex digest of the packing key remapped onto a-p.
const ID_PATTERN = /^[a-p]{32}$/;
const ID_RUN = /[a-p]+/g;

export type AcceptFormat = 'crx3' | 'crx2,crx3';

export type ExtractResult = { id: string } | { error: string };

export interface CrxUrlOptions {
  id: string;
  prodversion?: string;
  acceptformat?: AcceptFormat;
}

/**
 * The token a user most likely meant as the ID, used only to phrase the error
 * when no valid ID was found.
 */
function candidateToken(input: string): string {
  const withoutQuery = input.split(/[?#]/)[0];
  if (!withoutQuery.includes('/')) return withoutQuery;
  const segments = withoutQuery.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? '';
}

/**
 * Pull the extension ID out of a Chrome Web Store URL or a bare ID.
 *
 * Rather than matching the store's URL shapes — which have changed once already
 * and carry an optional slug — this looks for a run of exactly 32 characters in
 * the a-p alphabet. Slugs are human-readable and so contain characters outside
 * that range, which keeps them from colliding.
 */
export function extractExtensionId(input: string): ExtractResult {
  const trimmed = input.trim();
  if (!trimmed) return { error: 'Enter a Chrome Web Store URL or extension ID' };

  const runs = trimmed.match(ID_RUN) ?? [];
  const exact = runs.find(run => run.length === ID_LENGTH);
  if (exact) return { id: exact };

  const candidate = candidateToken(trimmed);
  // A bare token is an attempt at an ID whatever its length, but the last segment
  // of a URL is only worth complaining about specifically when it is long enough
  // to be a mistyped ID — otherwise an unrelated path like /some/page draws a
  // confusing "wrong length" message.
  const isBareToken = !trimmed.includes('/');
  const worthDiagnosing = candidate.length >= (isBareToken ? 1 : ID_LENGTH / 2);

  if (worthDiagnosing) {
    if (/^[a-p]+$/.test(candidate)) {
      return { error: `Extension IDs are ${ID_LENGTH} characters long (found ${candidate.length})` };
    }
    if (candidate.length === ID_LENGTH) {
      return { error: 'Extension IDs use only the letters a–p' };
    }
  }

  return { error: `Could not find a ${ID_LENGTH}-character extension ID in that input` };
}

/**
 * Build the update-service URL that serves the .crx file.
 *
 * The `x` parameter's value is itself a query string, so it is percent-encoded
 * whole: `=` becomes %3D and `&` becomes %26. Leaving it unencoded produces a
 * URL that looks right and silently returns nothing.
 */
export function buildCrxUrl(options: CrxUrlOptions): string {
  const { id, prodversion = DEFAULT_PRODVERSION, acceptformat = 'crx3' } = options;
  if (!ID_PATTERN.test(id)) throw new Error(`Invalid extension ID: ${id}`);

  const x = encodeURIComponent(`id=${id}&installsource=ondemand&uc`);
  return (
    `${CRX_ENDPOINT}?response=redirect` +
    `&acceptformat=${acceptformat}` +
    `&prodversion=${encodeURIComponent(prodversion)}` +
    `&x=${x}`
  );
}
