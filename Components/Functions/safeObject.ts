// Pure TypeScript — no browser APIs, no React.
//
// Helpers for building objects whose *keys* come from user input: parsed
// config sections, dotted paths, header names, anything the person on the
// other side of the textarea chose.
//
// A plain `{}` inherits from `Object.prototype`, so a handful of key names
// are not data. `'__proto__' in {}` is true, `obj['__proto__']` hands back
// `Object.prototype` itself, and a parser that walks into it writes onto the
// object every other object on the page inherits from. `constructor` and
// `prototype` behave the same way. A null-prototype object has none of those
// inherited slots, so those names round-trip as ordinary keys, existence
// checks answer honestly, and `JSON.stringify` still serialises the result.
//
// Use `emptyRecord()` wherever a parser accumulates user-chosen keys, and
// `isUnsafeKey()` when an object with a real prototype has to be indexed by
// one of them.

/** Key names that are inherited slots on a plain `{}` rather than data. */
export const UNSAFE_KEYS = ['__proto__', 'constructor', 'prototype'];

export function isUnsafeKey(key: string): boolean {
  return UNSAFE_KEYS.includes(key);
}

/** An accumulator with no prototype, safe to index with user-chosen keys. */
export function emptyRecord<T = unknown>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}
