export type TailwindColor = { name: string; hex: string };

export type TailwindMatch = TailwindColor & { distance: number };

/**
 * The full Tailwind CSS v3 default palette: 22 families x 11 shades, plus the
 * white and black keywords. Values taken from tailwindcss/colors.
 */
export const TAILWIND_COLORS: TailwindColor[] = [
  // slate
  { name: 'slate-50', hex: '#f8fafc' }, { name: 'slate-100', hex: '#f1f5f9' }, { name: 'slate-200', hex: '#e2e8f0' },
  { name: 'slate-300', hex: '#cbd5e1' }, { name: 'slate-400', hex: '#94a3b8' }, { name: 'slate-500', hex: '#64748b' },
  { name: 'slate-600', hex: '#475569' }, { name: 'slate-700', hex: '#334155' }, { name: 'slate-800', hex: '#1e293b' },
  { name: 'slate-900', hex: '#0f172a' }, { name: 'slate-950', hex: '#020617' },
  // gray
  { name: 'gray-50', hex: '#f9fafb' }, { name: 'gray-100', hex: '#f3f4f6' }, { name: 'gray-200', hex: '#e5e7eb' },
  { name: 'gray-300', hex: '#d1d5db' }, { name: 'gray-400', hex: '#9ca3af' }, { name: 'gray-500', hex: '#6b7280' },
  { name: 'gray-600', hex: '#4b5563' }, { name: 'gray-700', hex: '#374151' }, { name: 'gray-800', hex: '#1f2937' },
  { name: 'gray-900', hex: '#111827' }, { name: 'gray-950', hex: '#030712' },
  // zinc
  { name: 'zinc-50', hex: '#fafafa' }, { name: 'zinc-100', hex: '#f4f4f5' }, { name: 'zinc-200', hex: '#e4e4e7' },
  { name: 'zinc-300', hex: '#d4d4d8' }, { name: 'zinc-400', hex: '#a1a1aa' }, { name: 'zinc-500', hex: '#71717a' },
  { name: 'zinc-600', hex: '#52525b' }, { name: 'zinc-700', hex: '#3f3f46' }, { name: 'zinc-800', hex: '#27272a' },
  { name: 'zinc-900', hex: '#18181b' }, { name: 'zinc-950', hex: '#09090b' },
  // neutral
  { name: 'neutral-50', hex: '#fafafa' }, { name: 'neutral-100', hex: '#f5f5f5' }, { name: 'neutral-200', hex: '#e5e5e5' },
  { name: 'neutral-300', hex: '#d4d4d4' }, { name: 'neutral-400', hex: '#a3a3a3' }, { name: 'neutral-500', hex: '#737373' },
  { name: 'neutral-600', hex: '#525252' }, { name: 'neutral-700', hex: '#404040' }, { name: 'neutral-800', hex: '#262626' },
  { name: 'neutral-900', hex: '#171717' }, { name: 'neutral-950', hex: '#0a0a0a' },
  // stone
  { name: 'stone-50', hex: '#fafaf9' }, { name: 'stone-100', hex: '#f5f5f4' }, { name: 'stone-200', hex: '#e7e5e4' },
  { name: 'stone-300', hex: '#d6d3d1' }, { name: 'stone-400', hex: '#a8a29e' }, { name: 'stone-500', hex: '#78716c' },
  { name: 'stone-600', hex: '#57534e' }, { name: 'stone-700', hex: '#44403c' }, { name: 'stone-800', hex: '#292524' },
  { name: 'stone-900', hex: '#1c1917' }, { name: 'stone-950', hex: '#0c0a09' },
  // red
  { name: 'red-50', hex: '#fef2f2' }, { name: 'red-100', hex: '#fee2e2' }, { name: 'red-200', hex: '#fecaca' },
  { name: 'red-300', hex: '#fca5a5' }, { name: 'red-400', hex: '#f87171' }, { name: 'red-500', hex: '#ef4444' },
  { name: 'red-600', hex: '#dc2626' }, { name: 'red-700', hex: '#b91c1c' }, { name: 'red-800', hex: '#991b1b' },
  { name: 'red-900', hex: '#7f1d1d' }, { name: 'red-950', hex: '#450a0a' },
  // orange
  { name: 'orange-50', hex: '#fff7ed' }, { name: 'orange-100', hex: '#ffedd5' }, { name: 'orange-200', hex: '#fed7aa' },
  { name: 'orange-300', hex: '#fdba74' }, { name: 'orange-400', hex: '#fb923c' }, { name: 'orange-500', hex: '#f97316' },
  { name: 'orange-600', hex: '#ea580c' }, { name: 'orange-700', hex: '#c2410c' }, { name: 'orange-800', hex: '#9a3412' },
  { name: 'orange-900', hex: '#7c2d12' }, { name: 'orange-950', hex: '#431407' },
  // amber
  { name: 'amber-50', hex: '#fffbeb' }, { name: 'amber-100', hex: '#fef3c7' }, { name: 'amber-200', hex: '#fde68a' },
  { name: 'amber-300', hex: '#fcd34d' }, { name: 'amber-400', hex: '#fbbf24' }, { name: 'amber-500', hex: '#f59e0b' },
  { name: 'amber-600', hex: '#d97706' }, { name: 'amber-700', hex: '#b45309' }, { name: 'amber-800', hex: '#92400e' },
  { name: 'amber-900', hex: '#78350f' }, { name: 'amber-950', hex: '#451a03' },
  // yellow
  { name: 'yellow-50', hex: '#fefce8' }, { name: 'yellow-100', hex: '#fef9c3' }, { name: 'yellow-200', hex: '#fef08a' },
  { name: 'yellow-300', hex: '#fde047' }, { name: 'yellow-400', hex: '#facc15' }, { name: 'yellow-500', hex: '#eab308' },
  { name: 'yellow-600', hex: '#ca8a04' }, { name: 'yellow-700', hex: '#a16207' }, { name: 'yellow-800', hex: '#854d0e' },
  { name: 'yellow-900', hex: '#713f12' }, { name: 'yellow-950', hex: '#422006' },
  // lime
  { name: 'lime-50', hex: '#f7fee7' }, { name: 'lime-100', hex: '#ecfccb' }, { name: 'lime-200', hex: '#d9f99d' },
  { name: 'lime-300', hex: '#bef264' }, { name: 'lime-400', hex: '#a3e635' }, { name: 'lime-500', hex: '#84cc16' },
  { name: 'lime-600', hex: '#65a30d' }, { name: 'lime-700', hex: '#4d7c0f' }, { name: 'lime-800', hex: '#3f6212' },
  { name: 'lime-900', hex: '#365314' }, { name: 'lime-950', hex: '#1a2e05' },
  // green
  { name: 'green-50', hex: '#f0fdf4' }, { name: 'green-100', hex: '#dcfce7' }, { name: 'green-200', hex: '#bbf7d0' },
  { name: 'green-300', hex: '#86efac' }, { name: 'green-400', hex: '#4ade80' }, { name: 'green-500', hex: '#22c55e' },
  { name: 'green-600', hex: '#16a34a' }, { name: 'green-700', hex: '#15803d' }, { name: 'green-800', hex: '#166534' },
  { name: 'green-900', hex: '#14532d' }, { name: 'green-950', hex: '#052e16' },
  // emerald
  { name: 'emerald-50', hex: '#ecfdf5' }, { name: 'emerald-100', hex: '#d1fae5' }, { name: 'emerald-200', hex: '#a7f3d0' },
  { name: 'emerald-300', hex: '#6ee7b7' }, { name: 'emerald-400', hex: '#34d399' }, { name: 'emerald-500', hex: '#10b981' },
  { name: 'emerald-600', hex: '#059669' }, { name: 'emerald-700', hex: '#047857' }, { name: 'emerald-800', hex: '#065f46' },
  { name: 'emerald-900', hex: '#064e3b' }, { name: 'emerald-950', hex: '#022c22' },
  // teal
  { name: 'teal-50', hex: '#f0fdfa' }, { name: 'teal-100', hex: '#ccfbf1' }, { name: 'teal-200', hex: '#99f6e4' },
  { name: 'teal-300', hex: '#5eead4' }, { name: 'teal-400', hex: '#2dd4bf' }, { name: 'teal-500', hex: '#14b8a6' },
  { name: 'teal-600', hex: '#0d9488' }, { name: 'teal-700', hex: '#0f766e' }, { name: 'teal-800', hex: '#115e59' },
  { name: 'teal-900', hex: '#134e4a' }, { name: 'teal-950', hex: '#042f2e' },
  // cyan
  { name: 'cyan-50', hex: '#ecfeff' }, { name: 'cyan-100', hex: '#cffafe' }, { name: 'cyan-200', hex: '#a5f3fc' },
  { name: 'cyan-300', hex: '#67e8f9' }, { name: 'cyan-400', hex: '#22d3ee' }, { name: 'cyan-500', hex: '#06b6d4' },
  { name: 'cyan-600', hex: '#0891b2' }, { name: 'cyan-700', hex: '#0e7490' }, { name: 'cyan-800', hex: '#155e75' },
  { name: 'cyan-900', hex: '#164e63' }, { name: 'cyan-950', hex: '#083344' },
  // sky
  { name: 'sky-50', hex: '#f0f9ff' }, { name: 'sky-100', hex: '#e0f2fe' }, { name: 'sky-200', hex: '#bae6fd' },
  { name: 'sky-300', hex: '#7dd3fc' }, { name: 'sky-400', hex: '#38bdf8' }, { name: 'sky-500', hex: '#0ea5e9' },
  { name: 'sky-600', hex: '#0284c7' }, { name: 'sky-700', hex: '#0369a1' }, { name: 'sky-800', hex: '#075985' },
  { name: 'sky-900', hex: '#0c4a6e' }, { name: 'sky-950', hex: '#082f49' },
  // blue
  { name: 'blue-50', hex: '#eff6ff' }, { name: 'blue-100', hex: '#dbeafe' }, { name: 'blue-200', hex: '#bfdbfe' },
  { name: 'blue-300', hex: '#93c5fd' }, { name: 'blue-400', hex: '#60a5fa' }, { name: 'blue-500', hex: '#3b82f6' },
  { name: 'blue-600', hex: '#2563eb' }, { name: 'blue-700', hex: '#1d4ed8' }, { name: 'blue-800', hex: '#1e40af' },
  { name: 'blue-900', hex: '#1e3a8a' }, { name: 'blue-950', hex: '#172554' },
  // indigo
  { name: 'indigo-50', hex: '#eef2ff' }, { name: 'indigo-100', hex: '#e0e7ff' }, { name: 'indigo-200', hex: '#c7d2fe' },
  { name: 'indigo-300', hex: '#a5b4fc' }, { name: 'indigo-400', hex: '#818cf8' }, { name: 'indigo-500', hex: '#6366f1' },
  { name: 'indigo-600', hex: '#4f46e5' }, { name: 'indigo-700', hex: '#4338ca' }, { name: 'indigo-800', hex: '#3730a3' },
  { name: 'indigo-900', hex: '#312e81' }, { name: 'indigo-950', hex: '#1e1b4b' },
  // violet
  { name: 'violet-50', hex: '#f5f3ff' }, { name: 'violet-100', hex: '#ede9fe' }, { name: 'violet-200', hex: '#ddd6fe' },
  { name: 'violet-300', hex: '#c4b5fd' }, { name: 'violet-400', hex: '#a78bfa' }, { name: 'violet-500', hex: '#8b5cf6' },
  { name: 'violet-600', hex: '#7c3aed' }, { name: 'violet-700', hex: '#6d28d9' }, { name: 'violet-800', hex: '#5b21b6' },
  { name: 'violet-900', hex: '#4c1d95' }, { name: 'violet-950', hex: '#2e1065' },
  // purple
  { name: 'purple-50', hex: '#faf5ff' }, { name: 'purple-100', hex: '#f3e8ff' }, { name: 'purple-200', hex: '#e9d5ff' },
  { name: 'purple-300', hex: '#d8b4fe' }, { name: 'purple-400', hex: '#c084fc' }, { name: 'purple-500', hex: '#a855f7' },
  { name: 'purple-600', hex: '#9333ea' }, { name: 'purple-700', hex: '#7e22ce' }, { name: 'purple-800', hex: '#6b21a8' },
  { name: 'purple-900', hex: '#581c87' }, { name: 'purple-950', hex: '#3b0764' },
  // fuchsia
  { name: 'fuchsia-50', hex: '#fdf4ff' }, { name: 'fuchsia-100', hex: '#fae8ff' }, { name: 'fuchsia-200', hex: '#f5d0fe' },
  { name: 'fuchsia-300', hex: '#f0abfc' }, { name: 'fuchsia-400', hex: '#e879f9' }, { name: 'fuchsia-500', hex: '#d946ef' },
  { name: 'fuchsia-600', hex: '#c026d3' }, { name: 'fuchsia-700', hex: '#a21caf' }, { name: 'fuchsia-800', hex: '#86198f' },
  { name: 'fuchsia-900', hex: '#701a75' }, { name: 'fuchsia-950', hex: '#4a044e' },
  // pink
  { name: 'pink-50', hex: '#fdf2f8' }, { name: 'pink-100', hex: '#fce7f3' }, { name: 'pink-200', hex: '#fbcfe8' },
  { name: 'pink-300', hex: '#f9a8d4' }, { name: 'pink-400', hex: '#f472b6' }, { name: 'pink-500', hex: '#ec4899' },
  { name: 'pink-600', hex: '#db2777' }, { name: 'pink-700', hex: '#be185d' }, { name: 'pink-800', hex: '#9d174d' },
  { name: 'pink-900', hex: '#831843' }, { name: 'pink-950', hex: '#500724' },
  // rose
  { name: 'rose-50', hex: '#fff1f2' }, { name: 'rose-100', hex: '#ffe4e6' }, { name: 'rose-200', hex: '#fecdd3' },
  { name: 'rose-300', hex: '#fda4af' }, { name: 'rose-400', hex: '#fb7185' }, { name: 'rose-500', hex: '#f43f5e' },
  { name: 'rose-600', hex: '#e11d48' }, { name: 'rose-700', hex: '#be123c' }, { name: 'rose-800', hex: '#9f1239' },
  { name: 'rose-900', hex: '#881337' }, { name: 'rose-950', hex: '#4c0519' },
  // keywords
  { name: 'white', hex: '#ffffff' }, { name: 'black', hex: '#000000' },
];

/** Families in palette order, so the ramp view lists shades 50 → 950. */
export const TAILWIND_FAMILIES: string[] = TAILWIND_COLORS.map(c => c.name.split('-')[0]).filter(
  (name, i, all) => all.indexOf(name) === i && name !== 'white' && name !== 'black',
);

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  if (h.length === 3) return [parseInt(h[0]+h[0],16), parseInt(h[1]+h[1],16), parseInt(h[2]+h[2],16)];
  if (h.length !== 6) throw new Error(`Invalid hex: ${hex}`);
  const rgb: [number, number, number] = [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  if (rgb.some(v => isNaN(v))) throw new Error(`Invalid hex: ${hex}`);
  return rgb;
}

/** Accepts `3b82f6`, `#3b82f6` and `#38f`, and normalises to `#3b82f6`. */
export function normalizeHex(input: string): string {
  const raw = input.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$/.test(raw) && !/^[0-9a-fA-F]{6}$/.test(raw)) {
    throw new Error('Enter a 3 or 6 digit hex colour, for example #3b82f6');
  }
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
  return `#${full.toLowerCase()}`;
}

function colorDistance(a: [number,number,number], b: [number,number,number]): number {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}

/** The largest possible RGB distance, used to scale the match bars. */
export const MAX_DISTANCE = Math.sqrt(3 * 255 ** 2);

export function findClosestTailwindColors(hex: string, top = 5): TailwindMatch[] {
  const rgb = hexToRgb(hex);
  return TAILWIND_COLORS
    .map(c => ({ ...c, distance: colorDistance(rgb, hexToRgb(c.hex)) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, top);
}

/** Every shade of one family, in palette order. */
export function familyShades(family: string): TailwindColor[] {
  return TAILWIND_COLORS.filter(c => c.name.startsWith(`${family}-`));
}

export function formatTailwindColors(hex: string): string {
  const closest = findClosestTailwindColors(hex);
  const [r, g, b] = hexToRgb(hex);
  const header = `Input: ${hex} (rgb(${r}, ${g}, ${b}))\n\n=== Closest Tailwind Colors ===\n`;
  const rows = closest
    .map((c, i) => `${i + 1}. ${c.name.padEnd(15)} ${c.hex}  (distance: ${c.distance.toFixed(1)})`)
    .join('\n');
  const best = closest[0];
  const usage = `\n\n=== Usage ===\nClass:    bg-${best.name} / text-${best.name} / border-${best.name}\nHex:      ${best.hex}`;
  return header + rows + usage;
}
