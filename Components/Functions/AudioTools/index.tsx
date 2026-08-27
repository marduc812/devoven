'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MediaConverter from '@/Components/MainView/MainPanel/MediaConverter';
import { MediaResult } from '@/types';
import Waveform from './Waveform';
import {
  applyFade,
  applyGain,
  AudioStats,
  buildAudioStats,
  buildWaveformPeaks,
  clamp,
  dbToGain,
  describeChannels,
  edgeSilenceOnly,
  encodeWav,
  fadeEnvelope,
  findSilenceRanges,
  formatAudioInfo,
  formatDb,
  formatDuration,
  formatFileSize,
  gainToDb,
  invertRanges,
  mixToMono,
  normalizationGain,
  outputFileName,
  peakAmplitude,
  Range,
  resolveTrimRange,
  rmsAmplitude,
} from './logic';

// ─── Shared plumbing ──────────────────────────────────────────────────────────

const ACCEPT = 'audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac,.opus,.webm';
const DECODE_ERROR = 'Could not decode that file. Try WAV, MP3, OGG, FLAC, M4A, or Opus.';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';
const fieldClass =
  'bg-white text-gray-900 p-2 border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

// Web Audio hands back Float32Arrays backed by a plain ArrayBuffer, and
// createBuffer/copyToChannel accept only that narrower type, so the channel
// arrays passed around this file are typed for it.
type Channel = Float32Array<ArrayBuffer>;

const channelsOf = (buffer: AudioBuffer): Channel[] =>
  Array.from({ length: buffer.numberOfChannels }, (_, i) => buffer.getChannelData(i));

const sliceChannels = (
  channels: Channel[],
  sampleRate: number,
  start: number,
  end: number,
): Channel[] => {
  const from = Math.max(0, Math.floor(start * sampleRate));
  const to = Math.min(channels[0]?.length ?? 0, Math.ceil(end * sampleRate));
  return channels.map(channel => channel.slice(from, to));
};

/** Concatenates several time ranges of the same clip into one continuous signal. */
const joinRanges = (channels: Channel[], sampleRate: number, ranges: Range[]): Channel[] => {
  const pieces = ranges.map(range => sliceChannels(channels, sampleRate, range.start, range.end));
  const frames = pieces.reduce((sum, piece) => sum + (piece[0]?.length ?? 0), 0);

  return channels.map((_, channelIndex) => {
    const out = new Float32Array(frames);
    let offset = 0;
    for (const piece of pieces) {
      out.set(piece[channelIndex], offset);
      offset += piece[channelIndex].length;
    }
    return out;
  });
};

/**
 * Re-renders through an OfflineAudioContext, which is how sample-rate conversion
 * and playback-rate changes get done without hand-rolling a resampler.
 */
const renderOffline = async (
  channels: Channel[],
  sampleRate: number,
  options: { targetRate?: number; playbackRate?: number } = {},
): Promise<{ channels: Channel[]; sampleRate: number }> => {
  const targetRate = options.targetRate ?? sampleRate;
  const playbackRate = options.playbackRate ?? 1;
  const frames = channels[0]?.length ?? 0;
  if (frames === 0) return { channels, sampleRate };

  const outFrames = Math.max(1, Math.ceil((frames / playbackRate) * (targetRate / sampleRate)));
  const ctx = new OfflineAudioContext(channels.length, outFrames, targetRate);

  const source = ctx.createBuffer(channels.length, frames, sampleRate);
  channels.forEach((channel, i) => source.copyToChannel(channel, i));

  const node = ctx.createBufferSource();
  node.buffer = source;
  node.playbackRate.value = playbackRate;
  node.connect(ctx.destination);
  node.start();

  const rendered = await ctx.startRendering();
  return { channels: channelsOf(rendered), sampleRate: targetRate };
};

const decodeFile = async (file: File): Promise<AudioBuffer> => {
  const bytes = await file.arrayBuffer();
  const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(bytes);
  } finally {
    ctx.close();
  }
};

type LoadedAudio = { file: File; buffer: AudioBuffer; url: string };

/** Holds one decoded input file and keeps its object URL from leaking. */
function useAudioSource() {
  const [loaded, setLoaded] = useState<LoadedAudio | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const urlRef = useRef('');

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const onFiles = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const buffer = await decodeFile(file);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(file);
      setLoaded({ file, buffer, url: urlRef.current });
    } catch {
      setError(DECODE_ERROR);
      setLoaded(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const clear = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = '';
    setLoaded(null);
    setError('');
  }, []);

  const source = loaded && {
    url: loaded.url,
    name: loaded.file.name,
    meta: `${formatDuration(loaded.buffer.duration)} — ${loaded.buffer.sampleRate} Hz, ${
      loaded.buffer.numberOfChannels === 1 ? 'mono' : `${loaded.buffer.numberOfChannels} ch`
    }, ${formatFileSize(loaded.file.size)}`,
  };

  return { loaded, source: source ?? undefined, error, setError, busy, onFiles, clear };
}

/** Publishes rendered channel data as a downloadable WAV, revoking the previous one. */
function useWavResult() {
  const [result, setResult] = useState<MediaResult | undefined>(undefined);
  const urlRef = useRef('');

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  const publish = useCallback(
    (channels: Channel[], sampleRate: number, fileName: string, extraMeta?: string) => {
      const wav = encodeWav(channels, sampleRate);
      const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;

      const frames = channels[0]?.length ?? 0;
      const duration = formatDuration(frames / sampleRate);
      setResult({
        url,
        fileName,
        meta: [duration, formatFileSize(wav.byteLength), extraMeta].filter(Boolean).join(' — '),
      });
    },
    [],
  );

  const reset = useCallback(() => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = '';
    setResult(undefined);
  }, []);

  return { result, publish, reset };
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="flex flex-col gap-1">
    <span className={labelClass}>{label}</span>
    {children}
  </label>
);

/**
 * The signal every graph draws. Folding to mono once per file keeps a stereo
 * clip from being re-summed on every option change.
 */
function useMonoSamples(buffer: AudioBuffer | undefined): Float32Array {
  return useMemo(
    () => (buffer ? mixToMono(channelsOf(buffer)) : new Float32Array(0)),
    [buffer],
  );
}

/** Waveform with the category's label row above it. */
const Graph = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5">
    <span className={labelClass}>{label}</span>
    {children}
  </div>
);

// ─── 1. Audio Converter ───────────────────────────────────────────────────────

export function AudioConverter() {
  const { loaded, source, error, setError, onFiles, clear } = useAudioSource();
  const { result, publish, reset } = useWavResult();
  const [rate, setRate] = useState('keep');
  const [mono, setMono] = useState(false);

  useEffect(() => {
    if (!loaded) { reset(); return; }
    let cancelled = false;

    (async () => {
      try {
        let channels = channelsOf(loaded.buffer);
        let sampleRate = loaded.buffer.sampleRate;

        if (mono) channels = [mixToMono(channels)];
        if (rate !== 'keep' && Number(rate) !== sampleRate) {
          const rendered = await renderOffline(channels, sampleRate, { targetRate: Number(rate) });
          channels = rendered.channels;
          sampleRate = rendered.sampleRate;
        }
        if (cancelled) return;
        publish(channels, sampleRate, outputFileName(loaded.file.name, 'converted', 'wav'),
          `${sampleRate} Hz, ${channels.length === 1 ? 'mono' : 'stereo'}`);
      } catch {
        if (!cancelled) setError('Could not resample this file at that rate.');
      }
    })();

    return () => { cancelled = true; };
  }, [loaded, rate, mono, publish, reset, setError]);

  return (
    <MediaConverter
      title="Audio Converter"
      description="Convert any audio your browser can read — MP3, OGG, FLAC, M4A, Opus — into an uncompressed WAV, optionally resampling or folding it to mono. Decoding and encoding both happen locally."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="audio"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      result={result}
      error={error}
      extraElements={
        <div className="flex flex-wrap gap-6 items-end">
          <Field label="Sample rate">
            <select value={rate} onChange={e => setRate(e.target.value)} className={fieldClass}>
              <option value="keep">Keep original</option>
              <option value="48000">48000 Hz</option>
              <option value="44100">44100 Hz</option>
              <option value="32000">32000 Hz</option>
              <option value="22050">22050 Hz</option>
              <option value="16000">16000 Hz</option>
              <option value="8000">8000 Hz</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 pb-2 cursor-pointer">
            <input type="checkbox" checked={mono} onChange={e => setMono(e.target.checked)} />
            <span className={labelClass}>Fold to mono</span>
          </label>
        </div>
      }
    />
  );
}

// ─── 2. Audio Trimmer ─────────────────────────────────────────────────────────

/** Never rounds past the end of the clip, which would fail validation. */
const stamp = (seconds: number) => formatDuration(Math.floor(seconds * 100) / 100);

export function AudioTrimmer() {
  const { loaded, source, error, onFiles, clear } = useAudioSource();
  const { result, publish, reset } = useWavResult();
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [rangeError, setRangeError] = useState('');
  // Dragging the waveform retimes the clip continuously; re-encoding a WAV on
  // every pointer move would stutter, so the render waits for the pointer up.
  const [dragging, setDragging] = useState(false);
  const samples = useMonoSamples(loaded?.buffer);

  const duration = loaded?.buffer.duration ?? 0;
  const range = loaded ? resolveTrimRange(duration, start, end) : null;
  const selection = range?.ok ? { start: range.start, end: range.end } : undefined;

  useEffect(() => {
    if (!loaded) { reset(); setRangeError(''); return; }
    if (dragging) return;

    const trim = resolveTrimRange(loaded.buffer.duration, start, end);
    if (!trim.ok) { setRangeError(trim.error); reset(); return; }

    setRangeError('');
    const channels = sliceChannels(channelsOf(loaded.buffer), loaded.buffer.sampleRate, trim.start, trim.end);
    publish(channels, loaded.buffer.sampleRate, outputFileName(loaded.file.name, 'trimmed', 'wav'),
      `${formatDuration(trim.start)} → ${formatDuration(trim.end)}`);
  }, [loaded, start, end, dragging, publish, reset]);

  const onSelectionChange = (next: Range, done: boolean) => {
    setStart(stamp(next.start));
    setEnd(stamp(next.end));
    setDragging(!done);
  };

  return (
    <MediaConverter
      title="Audio Trimmer"
      description="Cut a clip out of an audio file: drag across the waveform to pick the part you want, or type the times by hand. Times accept [1 12.5 2], [1 1:23 2], or [1 1:02:30 2]. Leave a field empty to run from the beginning or to the end."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="audio"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      result={result}
      error={error || rangeError}
      extraElements={
        <div className="flex flex-col gap-4">
          {loaded && (
            <Graph label="Drag to select — grab an edge to fine-tune">
              <Waveform
                samples={samples}
                duration={duration}
                selection={selection}
                onSelectionChange={onSelectionChange}
              />
            </Graph>
          )}
          <div className="flex flex-wrap gap-6 items-end">
            <Field label="Start">
              <input value={start} onChange={e => setStart(e.target.value)} placeholder="0:00" className={fieldClass} />
            </Field>
            <Field label="End">
              <input
                value={end}
                onChange={e => setEnd(e.target.value)}
                placeholder={loaded ? formatDuration(duration) : '0:00'}
                className={fieldClass}
              />
            </Field>
            {loaded && (
              <div className="flex flex-col gap-1 pb-1">
                <span className={labelClass}>Keeping</span>
                <span className="font-mono text-sm text-gray-700">
                  {selection
                    ? `${formatDuration(selection.end - selection.start)} of ${formatDuration(duration)}`
                    : '—'}
                </span>
              </div>
            )}
            {loaded && (start !== '' || end !== '') && (
              <button
                type="button"
                onClick={() => { setStart(''); setEnd(''); setDragging(false); }}
                className="pb-2 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
              >
                Whole clip
              </button>
            )}
          </div>
        </div>
      }
    />
  );
}

// ─── 3. Volume Normalizer ─────────────────────────────────────────────────────

export function VolumeNormalizer() {
  const { loaded, source, error, onFiles, clear } = useAudioSource();
  const { result, publish, reset } = useWavResult();
  const [targetDb, setTargetDb] = useState(-1);

  const samples = useMonoSamples(loaded?.buffer);
  const peak = loaded ? peakAmplitude(channelsOf(loaded.buffer)) : 0;

  useEffect(() => {
    if (!loaded) { reset(); return; }
    const channels = channelsOf(loaded.buffer);
    const gain = normalizationGain(peakAmplitude(channels), targetDb);
    publish(
      channels.map(channel => applyGain(channel, gain)),
      loaded.buffer.sampleRate,
      outputFileName(loaded.file.name, 'normalized', 'wav'),
      `${gain >= 1 ? '+' : ''}${gainToDb(gain).toFixed(1)} dB applied`,
    );
  }, [loaded, targetDb, publish, reset]);

  return (
    <MediaConverter
      title="Volume Normalizer"
      description="Scale a clip so its loudest sample lands on a chosen peak level. This is peak normalization — it changes the level without compressing the dynamics."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="audio"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      result={result}
      error={error}
      extraElements={
        <div className="flex flex-col gap-4">
          <Field label={`Target peak: ${targetDb} dBFS`}>
            <input
              type="range" min={-24} max={0} step={0.5} value={targetDb}
              onChange={e => setTargetDb(Number(e.target.value))}
              className="accent-gray-900 max-w-md"
            />
          </Field>
          {loaded && (
            <>
              <Graph label="Current level against the target">
                <Waveform
                  samples={samples}
                  duration={loaded.buffer.duration}
                  guides={[
                    { level: peak, label: `peak ${gainToDb(peak).toFixed(1)} dB` },
                    { level: dbToGain(targetDb), label: `target ${targetDb} dB` },
                  ]}
                />
              </Graph>
              <p className="text-xs text-gray-500 font-mono">
                Current peak {gainToDb(peak).toFixed(1)} dBFS — RMS{' '}
                {gainToDb(rmsAmplitude(channelsOf(loaded.buffer))).toFixed(1)} dBFS
              </p>
            </>
          )}
        </div>
      }
    />
  );
}

// ─── 4. Audio Speed Changer ───────────────────────────────────────────────────

export function AudioSpeed() {
  const { loaded, source, error, setError, onFiles, clear } = useAudioSource();
  const { result, publish, reset } = useWavResult();
  const [speed, setSpeed] = useState(1.5);

  useEffect(() => {
    if (!loaded) { reset(); return; }
    let cancelled = false;

    (async () => {
      try {
        const rendered = await renderOffline(channelsOf(loaded.buffer), loaded.buffer.sampleRate, {
          playbackRate: speed,
        });
        if (cancelled) return;
        publish(rendered.channels, rendered.sampleRate, outputFileName(loaded.file.name, `${speed}x`, 'wav'),
          `${speed}× speed`);
      } catch {
        if (!cancelled) setError('Could not re-render at that speed.');
      }
    })();

    return () => { cancelled = true; };
  }, [loaded, speed, publish, reset, setError]);

  return (
    <MediaConverter
      title="Audio Speed Changer"
      description="Speed a clip up or slow it down. This resamples rather than time-stretches, so pitch moves with the speed — the classic tape effect. Useful for podcasts, samples, and voice notes."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="audio"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      result={result}
      error={error}
      extraElements={
        <Field label={`Speed: ${speed}×`}>
          <input
            type="range" min={0.25} max={4} step={0.05} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="accent-gray-900 max-w-md"
          />
        </Field>
      }
    />
  );
}

// ─── 5. Stereo to Mono ────────────────────────────────────────────────────────

export function StereoToMono() {
  const { loaded, source, error, onFiles, clear } = useAudioSource();
  const { result, publish, reset } = useWavResult();

  useEffect(() => {
    if (!loaded) { reset(); return; }
    const channels = channelsOf(loaded.buffer);
    publish([mixToMono(channels)], loaded.buffer.sampleRate,
      outputFileName(loaded.file.name, 'mono', 'wav'),
      `${channels.length} ch → 1 ch`);
  }, [loaded, publish, reset]);

  return (
    <MediaConverter
      title="Stereo to Mono"
      description="Fold every channel down to a single mono track by averaging them. Halves the file size and is what most speech pipelines want as input."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="audio"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      result={result}
      error={error}
    />
  );
}

// ─── 6. Fade In / Out ─────────────────────────────────────────────────────────

export function AudioFade() {
  const { loaded, source, error, onFiles, clear } = useAudioSource();
  const { result, publish, reset } = useWavResult();
  const [fadeIn, setFadeIn] = useState(1);
  const [fadeOut, setFadeOut] = useState(1);
  const samples = useMonoSamples(loaded?.buffer);

  useEffect(() => {
    if (!loaded) { reset(); return; }
    const sampleRate = loaded.buffer.sampleRate;
    publish(
      channelsOf(loaded.buffer).map(channel => applyFade(channel, sampleRate, fadeIn, fadeOut)),
      sampleRate,
      outputFileName(loaded.file.name, 'faded', 'wav'),
      `${fadeIn}s in, ${fadeOut}s out`,
    );
  }, [loaded, fadeIn, fadeOut, publish, reset]);

  return (
    <MediaConverter
      title="Audio Fade In & Out"
      description="Apply a linear fade to the start and end of a clip. Fades that would overlap on a short clip are shortened proportionally instead of cancelling each other out."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="audio"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      result={result}
      error={error}
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-6 items-end">
            <Field label={`Fade in: ${fadeIn}s`}>
              <input
                type="range" min={0} max={10} step={0.1} value={fadeIn}
                onChange={e => setFadeIn(Number(e.target.value))} className="accent-gray-900"
              />
            </Field>
            <Field label={`Fade out: ${fadeOut}s`}>
              <input
                type="range" min={0} max={10} step={0.1} value={fadeOut}
                onChange={e => setFadeOut(Number(e.target.value))} className="accent-gray-900"
              />
            </Field>
          </div>
          {loaded && (
            <Graph label="Fade envelope over the clip">
              <Waveform
                samples={samples}
                duration={loaded.buffer.duration}
                envelope={fadeEnvelope(loaded.buffer.duration, fadeIn, fadeOut)}
              />
            </Graph>
          )}
        </div>
      }
    />
  );
}

// ─── 7. Silence Trimmer ───────────────────────────────────────────────────────

export function SilenceTrimmer() {
  const { loaded, source, error, onFiles, clear } = useAudioSource();
  const { result, publish, reset } = useWavResult();
  const [threshold, setThreshold] = useState(-45);
  const [minSilence, setMinSilence] = useState(0.5);
  const [mode, setMode] = useState<'edges' | 'all'>('edges');
  const samples = useMonoSamples(loaded?.buffer);

  // Detection drives both the graph and the render, so it runs once per option
  // change rather than separately for each.
  const analysis = useMemo(() => {
    if (!loaded) return null;
    const duration = loaded.buffer.duration;
    const silences = findSilenceRanges(samples, loaded.buffer.sampleRate, threshold, minSilence);
    const targets = mode === 'edges' ? edgeSilenceOnly(silences, duration) : silences;
    return {
      targets,
      keep: invertRanges(targets, duration),
      removed: targets.reduce((sum, range) => sum + (range.end - range.start), 0),
    };
  }, [loaded, samples, threshold, minSilence, mode]);

  useEffect(() => {
    if (!loaded || !analysis) { reset(); return; }

    const channels = channelsOf(loaded.buffer);
    const sampleRate = loaded.buffer.sampleRate;
    const trimmed =
      analysis.keep.length === 0
        ? channels.map(() => new Float32Array(0))
        : joinRanges(channels, sampleRate, analysis.keep);

    publish(trimmed, sampleRate, outputFileName(loaded.file.name, 'trimmed', 'wav'),
      `${formatDuration(analysis.removed)} of silence removed`);
  }, [loaded, analysis, publish, reset]);

  return (
    <MediaConverter
      title="Silence Trimmer"
      description="Detect quiet stretches and cut them out — either just the dead air at the top and tail, or every gap in the clip. Raise the threshold if quiet speech is being treated as silence."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="audio"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      result={result}
      error={error}
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-6 items-end">
            <Field label="Mode">
              <select value={mode} onChange={e => setMode(e.target.value as 'edges' | 'all')} className={fieldClass}>
                <option value="edges">Trim start and end only</option>
                <option value="all">Remove every silent gap</option>
              </select>
            </Field>
            <Field label={`Threshold: ${threshold} dBFS`}>
              <input
                type="range" min={-70} max={-20} step={1} value={threshold}
                onChange={e => setThreshold(Number(e.target.value))} className="accent-gray-900"
              />
            </Field>
            <Field label={`Min silence: ${minSilence.toFixed(1)}s`}>
              <input
                type="range" min={0.1} max={3} step={0.1} value={minSilence}
                onChange={e => setMinSilence(Number(e.target.value))} className="accent-gray-900"
              />
            </Field>
          </div>
          {loaded && analysis && (
            <Graph label="Shaded bands are the stretches being cut">
              <Waveform
                samples={samples}
                duration={loaded.buffer.duration}
                regions={analysis.targets.map(range => ({ ...range, tone: 'cut' as const }))}
                guides={[{ level: dbToGain(threshold), label: `${threshold} dB` }]}
              />
            </Graph>
          )}
          {loaded && analysis && (
            <p className="text-xs text-gray-500 font-mono">
              {analysis.targets.length === 0
                ? 'Nothing quiet enough to cut at this threshold.'
                : `Cutting ${analysis.targets.length} stretch${analysis.targets.length === 1 ? '' : 'es'} — ${formatDuration(analysis.removed)} of silence.`}
            </p>
          )}
        </div>
      }
    />
  );
}

// ─── 8. Audio Joiner ──────────────────────────────────────────────────────────

export function AudioJoiner() {
  const [files, setFiles] = useState<{ name: string; buffer: AudioBuffer }[]>([]);
  const [error, setError] = useState('');
  const { result, publish, reset } = useWavResult();

  const onFiles = useCallback(async (incoming: File[]) => {
    setError('');
    try {
      const decoded = await Promise.all(
        incoming.map(async file => ({ name: file.name, buffer: await decodeFile(file) })),
      );
      setFiles(previous => [...previous, ...decoded]);
    } catch {
      setError(DECODE_ERROR);
    }
  }, []);

  const clear = useCallback(() => { setFiles([]); setError(''); }, []);

  useEffect(() => {
    if (files.length === 0) { reset(); return; }
    let cancelled = false;

    (async () => {
      try {
        // Everything is rendered to the highest rate and widest channel count present,
        // otherwise the pieces would play back at the wrong speed once concatenated.
        const sampleRate = Math.max(...files.map(f => f.buffer.sampleRate));
        const channelCount = Math.max(...files.map(f => f.buffer.numberOfChannels));

        const parts: Channel[][] = [];
        for (const file of files) {
          let channels = channelsOf(file.buffer);
          while (channels.length < channelCount) channels = [...channels, channels[0]];
          if (file.buffer.sampleRate !== sampleRate) {
            channels = (await renderOffline(channels, file.buffer.sampleRate, { targetRate: sampleRate })).channels;
          }
          parts.push(channels);
        }
        if (cancelled) return;

        const frames = parts.reduce((sum, part) => sum + (part[0]?.length ?? 0), 0);
        const joined = Array.from({ length: channelCount }, (_, channelIndex) => {
          const out = new Float32Array(frames);
          let offset = 0;
          for (const part of parts) {
            out.set(part[channelIndex], offset);
            offset += part[channelIndex].length;
          }
          return out;
        });

        publish(joined, sampleRate, 'joined.wav', `${files.length} files at ${sampleRate} Hz`);
      } catch {
        if (!cancelled) setError('Could not join these files.');
      }
    })();

    return () => { cancelled = true; };
  }, [files, publish, reset]);

  return (
    <MediaConverter
      title="Audio Joiner"
      description="Concatenate several audio files into one track, in the order you add them. Mismatched sample rates and channel counts are resampled up to the widest format in the set."
      backColor="violet"
      accept={ACCEPT}
      multiple
      inputMedium="audio"
      outputMedium="audio"
      hint="Drop audio files or click to browse — add more to append"
      onFiles={onFiles}
      onClear={clear}
      source={
        files.length > 0
          ? {
              url: '',
              name: `${files.length} file${files.length === 1 ? '' : 's'} queued`,
              meta: formatDuration(files.reduce((sum, f) => sum + f.buffer.duration, 0)) + ' total',
            }
          : undefined
      }
      result={result}
      error={error}
      extraElements={
        files.length > 0 ? (
          <ol className="flex flex-col gap-1">
            {files.map((file, index) => (
              <li key={index} className="flex justify-between gap-4 font-mono text-sm text-gray-700">
                <span className="truncate">{index + 1}. {file.name}</span>
                <span className="text-gray-400 flex-shrink-0">{formatDuration(file.buffer.duration)}</span>
              </li>
            ))}
          </ol>
        ) : undefined
      }
    />
  );
}

// ─── 9. Audio Info ────────────────────────────────────────────────────────────

const Stat = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="flex flex-col gap-1 p-3 bg-white border border-gray-300">
    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>
    <span className="font-mono text-lg leading-none text-gray-900 break-all">{value}</span>
    {sub && <span className="text-xs text-gray-400">{sub}</span>}
  </div>
);

/** dBFS on a -60…0 scale, as a 0..1 bar fraction. */
const meterFraction = (gain: number) => {
  const db = gainToDb(gain);
  return Number.isFinite(db) ? clamp((db + 60) / 60, 0, 1) : 0;
};

/** Peak as a marker, RMS as the filled bar — the usual level-meter reading. */
const LevelMeter = ({ label, peak, rms }: { label: string; peak: number; rms: number }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-baseline gap-3">
      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
      <span className="font-mono text-xs text-gray-500">
        peak {formatDb(peak, 1)} · RMS {formatDb(rms, 1)}
      </span>
    </div>
    <div className="relative h-2.5 w-full bg-gray-200">
      <span
        className="absolute inset-y-0 left-0 bg-violet-400"
        style={{ width: `${meterFraction(rms) * 100}%` }}
      />
      <span
        className="absolute inset-y-0 w-0.5 bg-gray-900"
        style={{ left: `calc(${meterFraction(peak) * 100}% - 1px)` }}
      />
    </div>
  </div>
);

const AudioReport = ({ stats, samples }: { stats: AudioStats; samples: Float32Array }) => (
  <div className="flex flex-col gap-5">
    <Graph label="Waveform — dashed lines mark the peak and RMS levels">
      <Waveform
        samples={samples}
        duration={stats.duration}
        height={140}
        guides={[
          { level: stats.peak, label: `peak ${formatDb(stats.peak, 1)}` },
          { level: stats.rms, label: `RMS ${formatDb(stats.rms, 1)}` },
        ]}
      />
    </Graph>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Stat label="Duration" value={formatDuration(stats.duration)} sub={`${stats.duration.toFixed(3)} s`} />
      <Stat label="Sample rate" value={`${(stats.sampleRate / 1000).toFixed(1)} kHz`} sub={`${stats.sampleRate} Hz`} />
      <Stat label="Channels" value={String(stats.channelCount)} sub={describeChannels(stats.channelCount)} />
      <Stat label="Avg. bitrate" value={`${stats.bitrateKbps.toFixed(0)} kbps`} sub={stats.mimeType} />
      <Stat label="File size" value={formatFileSize(stats.fileSize)} sub={stats.fileName} />
      <Stat label="Frames" value={stats.frames.toLocaleString()} sub="samples per channel" />
      <Stat label="Peak level" value={formatDb(stats.peak, 1)} sub={stats.peak >= 0.999 ? 'at or over full scale' : 'below full scale'} />
      <Stat label="As 16-bit WAV" value={formatFileSize(stats.wavBytes)} sub="uncompressed size" />
    </div>

    <div className="flex flex-col gap-3">
      <span className={labelClass}>Levels</span>
      <LevelMeter label="All channels" peak={stats.peak} rms={stats.rms} />
      {stats.channels.length > 1 &&
        stats.channels.map((channel, index) => (
          <LevelMeter key={index} label={`Channel ${index + 1}`} peak={channel.peak} rms={channel.rms} />
        ))}
      <p className="text-xs text-gray-400">Meters run from -60 dBFS to 0 dBFS.</p>
    </div>
  </div>
);

export function AudioInfo() {
  const { loaded, source, error, onFiles, clear } = useAudioSource();
  const samples = useMonoSamples(loaded?.buffer);

  const stats = useMemo(
    () =>
      loaded
        ? buildAudioStats(channelsOf(loaded.buffer), loaded.buffer.sampleRate, loaded.file)
        : null,
    [loaded],
  );

  return (
    <MediaConverter
      title="Audio File Info"
      description="Read the technical details out of an audio file — duration, sample rate, channel count, average bitrate, and measured peak and RMS levels per channel."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="text"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      outputVisual={stats ? <AudioReport stats={stats} samples={samples} /> : undefined}
      textResult={stats ? formatAudioInfo(stats) : ''}
      textResultTitle="Raw report"
      error={error}
    />
  );
}

// ─── 10. Waveform Viewer ──────────────────────────────────────────────────────

export function WaveformViewer() {
  const { loaded, source, error, onFiles, clear } = useAudioSource();
  const [result, setResult] = useState<MediaResult | undefined>(undefined);
  const [width, setWidth] = useState(1200);
  const [height, setHeight] = useState(240);

  useEffect(() => {
    if (!loaded) { setResult(undefined); return; }

    const peaks = buildWaveformPeaks(mixToMono(channelsOf(loaded.buffer)), width);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const middle = height / 2;
    ctx.strokeStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.moveTo(0, middle);
    ctx.lineTo(width, middle);
    ctx.stroke();

    ctx.fillStyle = '#8b5cf6';
    peaks.forEach((peak, x) => {
      const top = middle - peak.max * middle;
      const bottom = middle - peak.min * middle;
      ctx.fillRect(x, top, 1, Math.max(1, bottom - top));
    });

    setResult({
      url: canvas.toDataURL('image/png'),
      fileName: outputFileName(loaded.file.name, 'waveform', 'png'),
      meta: `${width} × ${height} px`,
    });
  }, [loaded, width, height]);

  return (
    <MediaConverter
      title="Audio Waveform Viewer"
      description="Render an audio file's waveform as a PNG you can drop into docs, slides, or a README. Channels are summed to mono and bucketed into one min/max column per pixel."
      backColor="violet"
      accept={ACCEPT}
      inputMedium="audio"
      outputMedium="image"
      onFiles={onFiles}
      onClear={clear}
      source={source}
      result={result}
      error={error}
      extraElements={
        <div className="flex flex-wrap gap-6 items-end">
          <Field label={`Width: ${width} px`}>
            <input
              type="range" min={400} max={2400} step={50} value={width}
              onChange={e => setWidth(Number(e.target.value))} className="accent-gray-900"
            />
          </Field>
          <Field label={`Height: ${height} px`}>
            <input
              type="range" min={80} max={600} step={20} value={height}
              onChange={e => setHeight(Number(e.target.value))} className="accent-gray-900"
            />
          </Field>
        </div>
      }
    />
  );
}
