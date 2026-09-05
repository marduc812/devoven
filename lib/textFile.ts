/**
 * The rules for taking a file as text input, kept away from the DOM so they
 * can be tested. `Components/View/FileInput.tsx` is the surface that applies
 * them; every entry point — the button, a drop — goes through here, so a file
 * is refused for the same reason and in the same words everywhere.
 */

/** Past this a browser tab stops enjoying itself, and a draft no longer fits local storage. */
export const MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024;

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Decoding a JPEG as UTF-8 gives a screenful of nonsense: a NUL byte, or
 * replacement characters everywhere the decoder gave up.
 */
export function looksBinary(text: string): boolean {
  const sample = text.slice(0, 4096);
  if (sample.includes('\u0000')) return true;
  if (sample.length === 0) return false;
  const replacements = sample.split('\uFFFD').length - 1;
  return replacements / sample.length > 0.05;
}

/** Why this file is too big to load, or null when it fits. */
export function sizeError(name: string, size: number): string | null {
  if (size <= MAX_TEXT_FILE_BYTES) return null;
  return `"${name}" is ${formatSize(size)} — the limit is ${formatSize(MAX_TEXT_FILE_BYTES)}`;
}

/** Why what was read is not usable as text, or null when it is. */
export function contentError(name: string, text: string): string | null {
  return looksBinary(text) ? `"${name}" is not a text file` : null;
}

/**
 * A file's trailing newline is an artefact of the editor that wrote it, not a
 * character the user means to compare. Dropped only where the target holds a
 * single line.
 */
export function trimTrailingNewline(text: string): string {
  return text.replace(/\r?\n+$/, '');
}
