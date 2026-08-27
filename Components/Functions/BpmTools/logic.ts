// BPM / MS Converter - logic.ts

export interface NoteDuration {
  name: string;
  multiplier: number; // relative to quarter note
}

export const NOTE_DURATIONS: NoteDuration[] = [
  { name: 'Whole note', multiplier: 4 },
  { name: 'Dotted half note', multiplier: 3 },
  { name: 'Half note', multiplier: 2 },
  { name: 'Dotted quarter note', multiplier: 1.5 },
  { name: 'Quarter note (1 beat)', multiplier: 1 },
  { name: 'Dotted eighth note', multiplier: 0.75 },
  { name: 'Eighth note', multiplier: 0.5 },
  { name: 'Dotted sixteenth note', multiplier: 0.375 },
  { name: 'Sixteenth note', multiplier: 0.25 },
  { name: 'Thirty-second note', multiplier: 0.125 },
];

export function bpmToMs(bpm: number): number {
  return 60000 / bpm;
}

export function msToBpm(ms: number): number {
  return 60000 / ms;
}

export function noteDurations(bpm: number): Array<{ name: string; ms: number }> {
  const quarterMs = bpmToMs(bpm);
  return NOTE_DURATIONS.map(n => ({
    name: n.name,
    ms: Math.round(quarterMs * n.multiplier * 100) / 100,
  }));
}

function pad(s: string, width: number): string {
  while (s.length < width) s = s + ' ';
  return s;
}

export function convertBpm(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Detect if input is BPM or ms
  // If it ends with 'ms' or 'MS', treat as milliseconds
  // If it ends with 'bpm' or 'BPM', treat as BPM
  // Otherwise, try to detect: if > 500 treat as ms, else BPM
  let bpm: number;
  let msPerBeat: number;
  let mode: string;

  const lc = trimmed.toLowerCase();
  let numStr = trimmed;

  if (lc.endsWith('ms')) {
    numStr = trimmed.slice(0, -2).trim();
    const ms = parseFloat(numStr);
    if (isNaN(ms) || ms <= 0) return 'Invalid ms value. Enter e.g. 500ms';
    bpm = Math.round(msToBpm(ms) * 100) / 100;
    msPerBeat = ms;
    mode = 'ms';
  } else if (lc.endsWith('bpm')) {
    numStr = trimmed.slice(0, -3).trim();
    const b = parseFloat(numStr);
    if (isNaN(b) || b <= 0) return 'Invalid BPM value. Enter e.g. 120bpm';
    bpm = b;
    msPerBeat = Math.round(bpmToMs(b) * 100) / 100;
    mode = 'bpm';
  } else {
    const n = parseFloat(trimmed);
    if (isNaN(n) || n <= 0) return 'Enter a BPM (e.g. 120) or ms value (e.g. 500ms)';
    // Heuristic: BPM is typically 20-400, ms per beat is typically 150-3000
    if (n >= 20 && n <= 400) {
      bpm = n;
      msPerBeat = Math.round(bpmToMs(n) * 100) / 100;
      mode = 'bpm';
    } else {
      // Treat as ms
      bpm = Math.round(msToBpm(n) * 100) / 100;
      msPerBeat = n;
      mode = 'ms';
    }
  }

  const lines: string[] = [];
  lines.push(`BPM:          ${bpm} beats per minute`);
  lines.push(`ms per beat:  ${msPerBeat} ms`);
  lines.push('');
  if (mode === 'bpm') {
    lines.push(`Tempo range:  ${bpm < 60 ? 'Largo (very slow)' : bpm < 66 ? 'Larghetto' : bpm < 76 ? 'Adagio' : bpm < 108 ? 'Andante/Moderato' : bpm < 120 ? 'Allegretto' : bpm < 168 ? 'Allegro' : bpm < 200 ? 'Presto' : 'Prestissimo'}`);
    lines.push('');
  }
  lines.push('=== Note Durations at ' + bpm + ' BPM ===');
  lines.push('');

  const durations = noteDurations(bpm);
  const maxNameLen = Math.max(...durations.map(d => d.name.length));
  for (const d of durations) {
    lines.push(pad(d.name + ':', maxNameLen + 2) + d.ms + ' ms');
  }

  return lines.join('\n');
}
