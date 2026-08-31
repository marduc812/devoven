// Shared class strings for the form-shaped tools built on `Panel`.
//
// The site is light-first: every utility here has a matching `.dark` override in
// app/globals.css, so a tool that sticks to these strings works in both themes
// without writing a second palette. Reaching for an arbitrary shade (text-gray-300,
// text-emerald-300) is how tools end up unreadable on white.

export const inputClass =
  'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none text-sm';

export const selectClass =
  'bg-white text-gray-900 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none text-sm';

export const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1';

/**
 * Read-only monospace result surface. Same padding and weight as the form beside it.
 * Carries no height of its own — set `min-h-[…]` or `rows` at the call site, since
 * two arbitrary `min-h` values in one class list resolve by stylesheet order, not
 * by which one you wrote last.
 */
export const paneClass =
  'bg-gray-50 text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 cursor-default resize-y font-mono text-xs';

export const btnClass =
  'bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export const btnSecondaryClass =
  'border border-gray-300 hover:border-gray-900 text-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

/** Segmented-control buttons: `segOn` is the selected state. */
export const segBase =
  'px-3 py-1.5 text-xs border transition-colors duration-150 cursor-pointer';
export const segOff = `${segBase} border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-900`;
export const segOn = `${segBase} border-emerald-200 bg-emerald-100 text-emerald-700 font-semibold`;

export const checkboxClass = 'w-4 h-4 accent-emerald-600 cursor-pointer';
export const checkboxLabelClass =
  'flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none';

/** Small caps section heading inside a tool body. */
export const sectionClass =
  'text-xs font-bold uppercase tracking-widest text-gray-500 border-b border-gray-200 pb-2 mb-4';

export const hintClass = 'text-xs text-gray-500 mt-1';
export const errorClass = 'text-sm text-red-700';
