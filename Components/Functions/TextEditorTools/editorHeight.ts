// Sizing rules for the editor surface. Kept out of the component so the clamping
// can be unit tested without a DOM.

/** Below this the gutter, the caret and the scrollbar stop being usable together. */
export const MIN_EDITOR_HEIGHT = 160;

/** Room left for the toolbar above and the counters below when dragged to the limit. */
const VIEWPORT_MARGIN = 120;

/** One arrow-key press on the drag handle. */
export const HEIGHT_STEP = 24;

/**
 * The tallest the surface may get on a given viewport. A short window (or a phone
 * in landscape) can be smaller than the minimum, and the minimum wins there —
 * the page scrolls instead of the editor collapsing to a slit.
 */
export function maxEditorHeight(viewportHeight: number): number {
  return Math.max(MIN_EDITOR_HEIGHT, Math.round(viewportHeight - VIEWPORT_MARGIN));
}

/** Clamps a dragged or keyed height into the usable range for this viewport. */
export function clampEditorHeight(height: number, viewportHeight: number): number {
  if (!Number.isFinite(height)) return MIN_EDITOR_HEIGHT;
  return Math.min(Math.max(Math.round(height), MIN_EDITOR_HEIGHT), maxEditorHeight(viewportHeight));
}
