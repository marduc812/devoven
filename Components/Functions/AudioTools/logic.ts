// Pure audio helpers. No DOM, no Web Audio — everything here operates on plain
// Float32Array channel data so it can be unit-tested in Node. The AudioContext
// glue that produces those arrays lives in index.tsx.

export const clamp = (value: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, value));

// ─── Levels ───────────────────────────────────────────────────────────────────

/** Decibels (dBFS) to a linear gain multiplier. 0 dB → 1. */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/** Linear gain to dBFS. Silence reports -Infinity. */
export function gainToDb(gain: number): number {
  if (gain <= 0) return -Infinity;
  return 20 * Math.log10(gain);
}

/** Largest absolute sample across every channel, 0..1+. */
export function peakAmplitude(channels: Float32Array[]): number {
  let peak = 0;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i++) {
      const abs = Math.abs(channel[i]);
      if (abs > peak) peak = abs;
    }
  }
  return peak;
}

/** Root-mean-square level across every channel, 0..1. */
export function rmsAmplitude(channels: Float32Array[]): number {
  let sum = 0;
  let count = 0;
  for (const channel of channels) {
    for (let i = 0; i < channel.length; i++) {
      sum += channel[i] * channel[i];
    }
    count += channel.length;
  }
  if (count === 0) return 0;
  return Math.sqrt(sum / count);
}

/**
 * Gain needed to bring `peak` up (or down) to `targetDb` dBFS.
 * Returns 1 for silent input — there is nothing to normalize.
 */
export function normalizationGain(peak: number, targetDb: number): number {
  if (peak <= 0) return 1;
  return dbToGain(targetDb) / peak;
}

// ─── Time formatting ──────────────────────────────────────────────────────────

/** Seconds to `m:ss.hh`, e.g. 83.456 → "1:23.46". */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.00';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return `${minutes}:${rest.toFixed(2).padStart(5, '0')}`;
}

/**
 * Parses `m:ss.hh`, `ss.hh`, or `h:mm:ss` into seconds.
 * Returns null for anything unparseable, so callers can show a field error.
 */
export function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === '') return null;

  const parts = trimmed.split(':');
  if (parts.length > 3) return null;

  let seconds = 0;
  for (const part of parts) {
    if (!/^\d*\.?\d*$/.test(part) || part === '' || part === '.') return null;
    const value = Number(part);
    if (!Number.isFinite(value)) return null;
    seconds = seconds * 60 + value;
  }
  return seconds;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Trimming ─────────────────────────────────────────────────────────────────

export type TrimRange =
  | { ok: true; start: number; end: number }
  | { ok: false; error: string };

/**
 * Validates a user-supplied start/end against the clip duration.
 * Empty start means 0; empty end means "to the end".
 */
export function resolveTrimRange(duration: number, startInput: string, endInput: string): TrimRange {
  const start = startInput.trim() === '' ? 0 : parseDuration(startInput);
  const end = endInput.trim() === '' ? duration : parseDuration(endInput);

  if (start === null) return { ok: false, error: 'Start time is not a valid time.' };
  if (end === null) return { ok: false, error: 'End time is not a valid time.' };
  if (start < 0 || end < 0) return { ok: false, error: 'Times cannot be negative.' };
  if (start >= duration) return { ok: false, error: 'Start time is past the end of the clip.' };
  if (end > duration) return { ok: false, error: 'End time is past the end of the clip.' };
  if (end <= start) return { ok: false, error: 'End time must be after the start time.' };

  return { ok: true, start, end };
}

// ─── Channel operations ───────────────────────────────────────────────────────

/** Averages every channel down to one. A mono input is returned unchanged. */
export function mixToMono(channels: Float32Array<ArrayBuffer>[]): Float32Array<ArrayBuffer> {
  if (channels.length === 0) return new Float32Array(0);
  if (channels.length === 1) return channels[0];

  const frames = channels[0].length;
  const mono = new Float32Array(frames);
  for (let i = 0; i < frames; i++) {
    let sum = 0;
    for (const channel of channels) sum += channel[i] ?? 0;
    mono[i] = sum / channels.length;
  }
  return mono;
}

/** Returns a new array scaled by `gain`, hard-clipped to [-1, 1]. */
export function applyGain(samples: Float32Array, gain: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    out[i] = clamp(samples[i] * gain, -1, 1);
  }
  return out;
}

/**
 * Linear fade in over the first `fadeInSec` and out over the last `fadeOutSec`.
 * Overlapping fades are shortened proportionally rather than cancelling out.
 */
export function applyFade(
  samples: Float32Array,
  sampleRate: number,
  fadeInSec: number,
  fadeOutSec: number,
): Float32Array<ArrayBuffer> {
  const out = Float32Array.from(samples);
  const total = samples.length;
  if (total === 0 || sampleRate <= 0) return out;

  let inFrames = Math.min(Math.max(0, Math.round(fadeInSec * sampleRate)), total);
  let outFrames = Math.min(Math.max(0, Math.round(fadeOutSec * sampleRate)), total);

  if (inFrames + outFrames > total) {
    const scale = total / (inFrames + outFrames);
    inFrames = Math.floor(inFrames * scale);
    outFrames = Math.floor(outFrames * scale);
  }

  for (let i = 0; i < inFrames; i++) {
    out[i] *= i / inFrames;
  }
  for (let i = 0; i < outFrames; i++) {
    out[total - 1 - i] *= i / outFrames;
  }
  return out;
}

// ─── Silence detection ────────────────────────────────────────────────────────

export type Range = { start: number; end: number };

/**
 * Windows the signal at 10 ms and reports the stretches quieter than
 * `thresholdDb` that last at least `minSilenceSec`. Times are in seconds.
 */
export function findSilenceRanges(
  samples: Float32Array,
  sampleRate: number,
  thresholdDb: number,
  minSilenceSec: number,
): Range[] {
  if (samples.length === 0 || sampleRate <= 0) return [];

  const windowFrames = Math.max(1, Math.round(sampleRate * 0.01));
  const threshold = dbToGain(thresholdDb);
  const ranges: Range[] = [];
  let runStart: number | null = null;

  const windows = Math.ceil(samples.length / windowFrames);
  for (let w = 0; w < windows; w++) {
    const from = w * windowFrames;
    const to = Math.min(samples.length, from + windowFrames);

    let sum = 0;
    for (let i = from; i < to; i++) sum += samples[i] * samples[i];
    const rms = Math.sqrt(sum / (to - from));

    const quiet = rms < threshold;
    if (quiet && runStart === null) {
      runStart = from;
    } else if (!quiet && runStart !== null) {
      ranges.push({ start: runStart / sampleRate, end: from / sampleRate });
      runStart = null;
    }
  }
  if (runStart !== null) {
    ranges.push({ start: runStart / sampleRate, end: samples.length / sampleRate });
  }

  return ranges.filter(r => r.end - r.start >= minSilenceSec);
}

/** The complement of `silences` within [0, duration] — the parts worth keeping. */
export function invertRanges(silences: Range[], duration: number): Range[] {
  const kept: Range[] = [];
  let cursor = 0;
  for (const silence of silences) {
    if (silence.start > cursor) kept.push({ start: cursor, end: Math.min(silence.start, duration) });
    cursor = Math.max(cursor, silence.end);
  }
  if (cursor < duration) kept.push({ start: cursor, end: duration });
  return kept.filter(r => r.end > r.start);
}

/** Only the leading and trailing silence, for "trim edges" mode. */
export function edgeSilenceOnly(silences: Range[], duration: number): Range[] {
  const edges: Range[] = [];
  for (const silence of silences) {
    if (silence.start <= 1e-6) edges.push(silence);
    else if (Math.abs(silence.end - duration) <= 1e-6) edges.push(silence);
  }
  return edges;
}

// ─── Waveform ─────────────────────────────────────────────────────────────────

export type Peak = { min: number; max: number };

/** Buckets the signal into `buckets` min/max pairs for canvas drawing. */
export function buildWaveformPeaks(samples: Float32Array, buckets: number): Peak[] {
  if (buckets <= 0 || samples.length === 0) return [];

  const peaks: Peak[] = [];
  const size = samples.length / buckets;
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor(b * size);
    const to = Math.min(samples.length, Math.max(from + 1, Math.floor((b + 1) * size)));

    let min = samples[from];
    let max = samples[from];
    for (let i = from + 1; i < to; i++) {
      if (samples[i] < min) min = samples[i];
      if (samples[i] > max) max = samples[i];
    }
    peaks.push({ min, max });
  }
  return peaks;
}

/**
 * The gain curve `applyFade` will apply, sampled at `points` evenly-spaced
 * instants, so the waveform graph can draw the same shape the render produces.
 */
export function fadeEnvelope(
  duration: number,
  fadeInSec: number,
  fadeOutSec: number,
  points = 120,
): number[] {
  const count = Math.max(2, Math.floor(points));
  if (duration <= 0) return new Array(count).fill(1);

  let fadeIn = clamp(fadeInSec, 0, duration);
  let fadeOut = clamp(fadeOutSec, 0, duration);
  // Same proportional shortening applyFade uses when the two fades overlap.
  if (fadeIn + fadeOut > duration) {
    const scale = duration / (fadeIn + fadeOut);
    fadeIn *= scale;
    fadeOut *= scale;
  }

  return Array.from({ length: count }, (_, index) => {
    const at = (index / (count - 1)) * duration;
    const rising = fadeIn > 0 ? at / fadeIn : 1;
    const falling = fadeOut > 0 ? (duration - at) / fadeOut : 1;
    return clamp(Math.min(rising, falling), 0, 1);
  });
}

// ─── File report ──────────────────────────────────────────────────────────────

export interface AudioStats {
  fileName: string;
  fileSize: number;
  mimeType: string;
  duration: number;
  sampleRate: number;
  channelCount: number;
  frames: number;
  /** Container bitrate, not codec bitrate — the decoded PCM is always float32. */
  bitrateKbps: number;
  peak: number;
  rms: number;
  channels: { peak: number; rms: number }[];
  /** Size the same audio would occupy as an uncompressed 16-bit WAV. */
  wavBytes: number;
}

export function buildAudioStats(
  channels: Float32Array[],
  sampleRate: number,
  file: { name: string; size: number; type?: string },
): AudioStats {
  const frames = channels[0]?.length ?? 0;
  const duration = sampleRate > 0 ? frames / sampleRate : 0;

  return {
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'unknown',
    duration,
    sampleRate,
    channelCount: channels.length,
    frames,
    bitrateKbps: duration > 0 ? (file.size * 8) / duration / 1000 : 0,
    peak: peakAmplitude(channels),
    rms: rmsAmplitude(channels),
    channels: channels.map(channel => ({
      peak: peakAmplitude([channel]),
      rms: rmsAmplitude([channel]),
    })),
    wavBytes: wavByteLength(frames, Math.max(1, channels.length)),
  };
}

/** dBFS with the -Infinity case spelled out, e.g. `-3.01 dBFS` / `silent`. */
export function formatDb(gain: number, decimals = 2): string {
  const db = gainToDb(gain);
  return Number.isFinite(db) ? `${db.toFixed(decimals)} dBFS` : 'silent';
}

export function describeChannels(count: number): string {
  if (count === 1) return 'mono';
  if (count === 2) return 'stereo';
  return `${count} channels`;
}

/** The plain-text report the Audio File Info tool offers for copying. */
export function formatAudioInfo(stats: AudioStats): string {
  return [
    `File            ${stats.fileName}`,
    `Size            ${formatFileSize(stats.fileSize)}`,
    `Type            ${stats.mimeType}`,
    '',
    `Duration        ${formatDuration(stats.duration)} (${stats.duration.toFixed(3)} s)`,
    `Sample rate     ${stats.sampleRate} Hz`,
    `Channels        ${stats.channelCount} (${describeChannels(stats.channelCount)})`,
    `Frames          ${stats.frames.toLocaleString()}`,
    `Avg. bitrate    ${stats.bitrateKbps.toFixed(0)} kbps`,
    '',
    `Peak level      ${formatDb(stats.peak)}`,
    `RMS level       ${formatDb(stats.rms)}`,
    ...stats.channels.map(
      (channel, index) =>
        `  Channel ${index + 1}     peak ${formatDb(channel.peak)}, RMS ${formatDb(channel.rms)}`,
    ),
    '',
    `As 16-bit WAV   ${formatFileSize(stats.wavBytes)}`,
  ].join('\n');
}

// ─── WAV encoding ─────────────────────────────────────────────────────────────

const writeAscii = (view: DataView, offset: number, text: string): void => {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
};

/** Bytes a 16-bit PCM WAV occupies for the given frame count and channels. */
export function wavByteLength(frames: number, channelCount: number): number {
  return 44 + frames * channelCount * 2;
}

/**
 * Interleaves and encodes channel data as a 16-bit PCM WAV.
 * Channels shorter than the longest are zero-padded.
 */
export function encodeWav(channels: Float32Array[], sampleRate: number): ArrayBuffer {
  const channelCount = Math.max(1, channels.length);
  const frames = channels.length === 0 ? 0 : Math.max(...channels.map(c => c.length));
  const dataBytes = frames * channelCount * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(view, 8, 'WAVE');

  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);            // PCM chunk size
  view.setUint16(20, 1, true);             // format: PCM
  view.setUint16(22, channelCount, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channelCount * 2, true); // byte rate
  view.setUint16(32, channelCount * 2, true);              // block align
  view.setUint16(34, 16, true);            // bits per sample

  writeAscii(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  let offset = 44;
  for (let frame = 0; frame < frames; frame++) {
    for (let c = 0; c < channelCount; c++) {
      const sample = clamp(channels[c]?.[frame] ?? 0, -1, 1);
      // Asymmetric scaling: int16 reaches -32768 but only +32767.
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return buffer;
}

// ─── Naming ───────────────────────────────────────────────────────────────────

/** `song.mp3` + `trimmed` + `wav` → `song-trimmed.wav`. */
export function outputFileName(original: string, suffix: string, extension: string): string {
  const base = original.replace(/\.[^./\\]+$/, '') || 'audio';
  return `${base}-${suffix}.${extension}`;
}
