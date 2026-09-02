'use client';

import React from 'react';
import { ByteFormat } from './logic';

export const SELECT_CLASS =
  'border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900';

export const INPUT_CLASS =
  'border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900';

export const LABEL_CLASS = 'text-gray-500 text-xs uppercase tracking-widest';

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1">
    <label className={LABEL_CLASS}>{label}</label>
    {children}
  </div>
);

export const NumberField = ({
  label,
  value,
  onChange,
  width = 'w-28',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  width?: string;
}) => (
  <Field label={label}>
    <input
      type="text"
      inputMode="numeric"
      className={`${INPUT_CLASS} ${width}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </Field>
);

/** Salt / info / secret fields all accept the same three encodings. */
export const ByteFormatSelect = ({
  value,
  onChange,
}: {
  value: ByteFormat;
  onChange: (value: ByteFormat) => void;
}) => (
  <Field label="As">
    <select className={SELECT_CLASS} value={value} onChange={(e) => onChange(e.target.value as ByteFormat)}>
      <option value="utf8">Text</option>
      <option value="hex">Hex</option>
      <option value="base64">Base64</option>
    </select>
  </Field>
);

/**
 * Run `work` once the browser has painted. A bare setTimeout(0) is not enough:
 * it can fire before the frame that shows "Deriving…" reaches the screen, and
 * then a multi-second synchronous KDF freezes the page with the button still
 * reading "Derive". requestAnimationFrame lands before the paint, and the
 * timeout inside it lands after.
 */
export function afterPaint(work: () => void): void {
  if (typeof requestAnimationFrame !== 'function') {
    setTimeout(work, 0);
    return;
  }
  requestAnimationFrame(() => setTimeout(work, 0));
}

/**
 * PBKDF2, scrypt and Argon2 are slow on purpose, so they do not recompute on
 * every keystroke the way the hash tools do. This is that button.
 */
export const DeriveButton = ({
  onClick,
  busy,
}: {
  onClick: () => void;
  busy: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className="border border-gray-900 bg-gray-900 text-white px-5 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-gray-700 disabled:opacity-50 disabled:cursor-wait transition-colors"
  >
    {busy ? 'Deriving…' : 'Derive'}
  </button>
);
