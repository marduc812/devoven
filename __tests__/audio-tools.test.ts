import {
  dbToGain,
  gainToDb,
  peakAmplitude,
  rmsAmplitude,
  normalizationGain,
  formatDuration,
  parseDuration,
  formatFileSize,
  resolveTrimRange,
  mixToMono,
  applyGain,
  applyFade,
  findSilenceRanges,
  invertRanges,
  edgeSilenceOnly,
  buildWaveformPeaks,
  encodeWav,
  wavByteLength,
  outputFileName,
  fadeEnvelope,
  buildAudioStats,
  formatAudioInfo,
  formatDb,
  describeChannels,
} from '@/Components/Functions/AudioTools/logic';

// ─── Levels ───────────────────────────────────────────────────────────────────

describe('dbToGain / gainToDb', () => {
  it('0 dB is unity gain', () => {
    expect(dbToGain(0)).toBeCloseTo(1);
    expect(gainToDb(1)).toBeCloseTo(0);
  });
  it('-6 dB is roughly half amplitude', () => {
    expect(dbToGain(-6)).toBeCloseTo(0.501, 3);
  });
  it('+6 dB is roughly double amplitude', () => {
    expect(dbToGain(6)).toBeCloseTo(1.995, 3);
  });
  it('round-trips', () => {
    expect(gainToDb(dbToGain(-14))).toBeCloseTo(-14);
  });
  it('reports silence as -Infinity', () => {
    expect(gainToDb(0)).toBe(-Infinity);
  });
});

describe('peakAmplitude', () => {
  it('finds the largest absolute sample across channels', () => {
    const left = new Float32Array([0.1, -0.3, 0.2]);
    const right = new Float32Array([0.05, 0.7, -0.9]);
    expect(peakAmplitude([left, right])).toBeCloseTo(0.9);
  });
  it('is 0 for silence', () => {
    expect(peakAmplitude([new Float32Array(64)])).toBe(0);
  });
  it('is 0 for no channels', () => {
    expect(peakAmplitude([])).toBe(0);
  });
});

describe('rmsAmplitude', () => {
  it('computes RMS of a constant signal', () => {
    expect(rmsAmplitude([new Float32Array([0.5, 0.5, 0.5, 0.5])])).toBeCloseTo(0.5);
  });
  it('is 0 for empty input', () => {
    expect(rmsAmplitude([])).toBe(0);
  });
});

describe('normalizationGain', () => {
  it('lifts a quiet peak to the target', () => {
    const gain = normalizationGain(0.25, -6);
    expect(0.25 * gain).toBeCloseTo(dbToGain(-6));
  });
  it('pulls a hot peak down to the target', () => {
    const gain = normalizationGain(1.0, -3);
    expect(gain).toBeLessThan(1);
  });
  it('leaves silence alone rather than dividing by zero', () => {
    expect(normalizationGain(0, -6)).toBe(1);
  });
});

// ─── Time ─────────────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats minutes and seconds', () => {
    expect(formatDuration(83.456)).toBe('1:23.46');
  });
  it('pads sub-ten seconds', () => {
    expect(formatDuration(5.1)).toBe('0:05.10');
  });
  it('handles zero and rejects nonsense', () => {
    expect(formatDuration(0)).toBe('0:00.00');
    expect(formatDuration(-4)).toBe('0:00.00');
    expect(formatDuration(NaN)).toBe('0:00.00');
  });
});

describe('parseDuration', () => {
  it('parses plain seconds', () => {
    expect(parseDuration('12.5')).toBeCloseTo(12.5);
  });
  it('parses m:ss', () => {
    expect(parseDuration('1:23.46')).toBeCloseTo(83.46);
  });
  it('parses h:mm:ss', () => {
    expect(parseDuration('1:00:30')).toBeCloseTo(3630);
  });
  it('rejects junk', () => {
    expect(parseDuration('abc')).toBeNull();
    expect(parseDuration('')).toBeNull();
    expect(parseDuration('1:2:3:4')).toBeNull();
    expect(parseDuration('1::2')).toBeNull();
  });
});

describe('formatFileSize', () => {
  it('scales through the units', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.00 MB');
  });
});

// ─── Trimming ─────────────────────────────────────────────────────────────────

describe('resolveTrimRange', () => {
  it('accepts a valid range', () => {
    expect(resolveTrimRange(60, '10', '20')).toEqual({ ok: true, start: 10, end: 20 });
  });
  it('defaults empty fields to the full clip', () => {
    expect(resolveTrimRange(60, '', '')).toEqual({ ok: true, start: 0, end: 60 });
  });
  it('rejects an end before the start', () => {
    const result = resolveTrimRange(60, '30', '10');
    expect(result.ok).toBe(false);
  });
  it('rejects a start past the clip', () => {
    const result = resolveTrimRange(60, '90', '');
    expect(result.ok).toBe(false);
  });
  it('rejects an end past the clip', () => {
    const result = resolveTrimRange(60, '0', '90');
    expect(result.ok).toBe(false);
  });
  it('rejects unparseable input', () => {
    const result = resolveTrimRange(60, 'nope', '10');
    expect(result).toEqual({ ok: false, error: 'Start time is not a valid time.' });
  });
});

// ─── Channels ─────────────────────────────────────────────────────────────────

describe('mixToMono', () => {
  it('averages two channels', () => {
    const mono = mixToMono([new Float32Array([1, 0]), new Float32Array([0, 1])]);
    expect(Array.from(mono)).toEqual([0.5, 0.5]);
  });
  it('passes mono through untouched', () => {
    const input = new Float32Array([0.2, 0.4]);
    expect(mixToMono([input])).toBe(input);
  });
  it('handles no channels', () => {
    expect(mixToMono([]).length).toBe(0);
  });
});

describe('applyGain', () => {
  it('scales samples', () => {
    expect(Array.from(applyGain(new Float32Array([0.1, -0.2]), 2))).toEqual([
      expect.closeTo(0.2, 5),
      expect.closeTo(-0.4, 5),
    ]);
  });
  it('clips rather than wrapping past full scale', () => {
    const out = applyGain(new Float32Array([0.9, -0.9]), 4);
    expect(out[0]).toBe(1);
    expect(out[1]).toBe(-1);
  });
  it('does not mutate the input', () => {
    const input = new Float32Array([0.5]);
    applyGain(input, 2);
    expect(input[0]).toBe(0.5);
  });
});

describe('applyFade', () => {
  it('starts a fade-in at silence and reaches full scale', () => {
    const samples = new Float32Array(100).fill(1);
    const out = applyFade(samples, 100, 0.5, 0);
    expect(out[0]).toBe(0);
    expect(out[99]).toBe(1);
  });
  it('ends a fade-out at silence', () => {
    const samples = new Float32Array(100).fill(1);
    const out = applyFade(samples, 100, 0, 0.5);
    expect(out[99]).toBe(0);
    expect(out[0]).toBe(1);
  });
  it('shortens overlapping fades instead of zeroing the clip', () => {
    const samples = new Float32Array(100).fill(1);
    const out = applyFade(samples, 100, 1, 1);
    expect(Math.max(...Array.from(out))).toBeGreaterThan(0);
  });
  it('does not mutate the input', () => {
    const samples = new Float32Array(10).fill(1);
    applyFade(samples, 10, 1, 0);
    expect(samples[0]).toBe(1);
  });
});

// ─── Silence ──────────────────────────────────────────────────────────────────

describe('findSilenceRanges', () => {
  const sampleRate = 1000;

  it('finds a silent stretch between two loud ones', () => {
    // 0.5 s loud, 0.5 s silent, 0.5 s loud
    const samples = new Float32Array(1500);
    for (let i = 0; i < 500; i++) samples[i] = 0.8;
    for (let i = 1000; i < 1500; i++) samples[i] = 0.8;

    const ranges = findSilenceRanges(samples, sampleRate, -40, 0.1);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start).toBeCloseTo(0.5, 1);
    expect(ranges[0].end).toBeCloseTo(1.0, 1);
  });

  it('ignores stretches shorter than the minimum', () => {
    const samples = new Float32Array(1000).fill(0.8);
    for (let i = 500; i < 520; i++) samples[i] = 0; // 20 ms
    expect(findSilenceRanges(samples, sampleRate, -40, 0.5)).toHaveLength(0);
  });

  it('reports fully silent audio as one range', () => {
    const ranges = findSilenceRanges(new Float32Array(1000), sampleRate, -40, 0.1);
    expect(ranges).toHaveLength(1);
    expect(ranges[0].start).toBeCloseTo(0);
    expect(ranges[0].end).toBeCloseTo(1);
  });

  it('returns nothing for empty input', () => {
    expect(findSilenceRanges(new Float32Array(0), sampleRate, -40, 0.1)).toEqual([]);
  });
});

describe('invertRanges', () => {
  it('returns the gaps between silences', () => {
    expect(invertRanges([{ start: 1, end: 2 }], 3)).toEqual([
      { start: 0, end: 1 },
      { start: 2, end: 3 },
    ]);
  });
  it('drops leading silence', () => {
    expect(invertRanges([{ start: 0, end: 1 }], 3)).toEqual([{ start: 1, end: 3 }]);
  });
  it('returns nothing when the whole clip is silent', () => {
    expect(invertRanges([{ start: 0, end: 3 }], 3)).toEqual([]);
  });
  it('returns the whole clip when there is no silence', () => {
    expect(invertRanges([], 3)).toEqual([{ start: 0, end: 3 }]);
  });
});

describe('edgeSilenceOnly', () => {
  it('keeps leading and trailing silence but drops the middle', () => {
    const silences = [
      { start: 0, end: 1 },
      { start: 4, end: 5 },
      { start: 9, end: 10 },
    ];
    expect(edgeSilenceOnly(silences, 10)).toEqual([
      { start: 0, end: 1 },
      { start: 9, end: 10 },
    ]);
  });
});

// ─── Waveform ─────────────────────────────────────────────────────────────────

describe('buildWaveformPeaks', () => {
  it('returns one min/max pair per bucket', () => {
    const samples = new Float32Array([1, -1, 0.5, -0.5]);
    const peaks = buildWaveformPeaks(samples, 2);
    expect(peaks).toEqual([
      { min: -1, max: 1 },
      { min: -0.5, max: 0.5 },
    ]);
  });
  it('handles more buckets than samples without producing NaN', () => {
    const peaks = buildWaveformPeaks(new Float32Array([0.5, -0.5]), 8);
    expect(peaks).toHaveLength(8);
    for (const peak of peaks) {
      expect(Number.isFinite(peak.min)).toBe(true);
      expect(Number.isFinite(peak.max)).toBe(true);
    }
  });
  it('returns nothing for empty input', () => {
    expect(buildWaveformPeaks(new Float32Array(0), 10)).toEqual([]);
    expect(buildWaveformPeaks(new Float32Array([1]), 0)).toEqual([]);
  });
});

// ─── WAV ──────────────────────────────────────────────────────────────────────

describe('encodeWav', () => {
  const readAscii = (view: DataView, offset: number, length: number) =>
    Array.from({ length }, (_, i) => String.fromCharCode(view.getUint8(offset + i))).join('');

  it('writes a valid RIFF/WAVE header', () => {
    const buffer = encodeWav([new Float32Array([0, 0.5, -0.5])], 44100);
    const view = new DataView(buffer);

    expect(readAscii(view, 0, 4)).toBe('RIFF');
    expect(readAscii(view, 8, 4)).toBe('WAVE');
    expect(readAscii(view, 12, 4)).toBe('fmt ');
    expect(readAscii(view, 36, 4)).toBe('data');
    expect(view.getUint16(20, true)).toBe(1);      // PCM
    expect(view.getUint16(22, true)).toBe(1);      // mono
    expect(view.getUint32(24, true)).toBe(44100);  // sample rate
    expect(view.getUint16(34, true)).toBe(16);     // bit depth
  });

  it('sizes the buffer and chunk fields consistently', () => {
    const buffer = encodeWav([new Float32Array(100), new Float32Array(100)], 48000);
    const view = new DataView(buffer);

    expect(buffer.byteLength).toBe(wavByteLength(100, 2));
    expect(view.getUint32(40, true)).toBe(100 * 2 * 2);          // data size
    expect(view.getUint32(4, true)).toBe(buffer.byteLength - 8); // RIFF size
    expect(view.getUint32(28, true)).toBe(48000 * 2 * 2);        // byte rate
    expect(view.getUint16(32, true)).toBe(4);                    // block align
  });

  it('interleaves stereo frames left-then-right', () => {
    const left = new Float32Array([1, 0]);
    const right = new Float32Array([0, -1]);
    const view = new DataView(encodeWav([left, right], 8000));

    expect(view.getInt16(44, true)).toBe(32767);  // L[0]
    expect(view.getInt16(46, true)).toBe(0);      // R[0]
    expect(view.getInt16(48, true)).toBe(0);      // L[1]
    expect(view.getInt16(50, true)).toBe(-32768); // R[1]
  });

  it('clips out-of-range samples instead of wrapping', () => {
    const view = new DataView(encodeWav([new Float32Array([4, -4])], 8000));
    expect(view.getInt16(44, true)).toBe(32767);
    expect(view.getInt16(46, true)).toBe(-32768);
  });

  it('zero-pads channels of unequal length', () => {
    const buffer = encodeWav([new Float32Array([1, 1]), new Float32Array([1])], 8000);
    const view = new DataView(buffer);
    expect(buffer.byteLength).toBe(wavByteLength(2, 2));
    expect(view.getInt16(50, true)).toBe(0); // R[1], padded
  });

  it('produces a header-only file for empty input', () => {
    expect(encodeWav([], 44100).byteLength).toBe(44);
  });
});

// ─── Naming ───────────────────────────────────────────────────────────────────

describe('outputFileName', () => {
  it('swaps the extension and adds a suffix', () => {
    expect(outputFileName('song.mp3', 'trimmed', 'wav')).toBe('song-trimmed.wav');
  });
  it('handles names with dots', () => {
    expect(outputFileName('my.track.v2.flac', 'mono', 'wav')).toBe('my.track.v2-mono.wav');
  });
  it('handles an extensionless name', () => {
    expect(outputFileName('recording', 'faded', 'wav')).toBe('recording-faded.wav');
  });
});

// ─── Fade envelope ────────────────────────────────────────────────────────────

describe('fadeEnvelope', () => {
  it('rises from silence and falls back to it', () => {
    const curve = fadeEnvelope(10, 2, 2, 101);
    expect(curve[0]).toBeCloseTo(0);
    expect(curve[curve.length - 1]).toBeCloseTo(0);
    expect(curve[50]).toBeCloseTo(1);
  });

  it('is flat when no fade is asked for', () => {
    expect(fadeEnvelope(5, 0, 0, 10).every(value => value === 1)).toBe(true);
  });

  it('reaches unity exactly at the end of the fade in', () => {
    const curve = fadeEnvelope(4, 1, 0, 5); // samples at 0, 1, 2, 3, 4 s
    expect(curve[0]).toBeCloseTo(0);
    expect(curve[1]).toBeCloseTo(1);
  });

  it('shortens overlapping fades the way applyFade does', () => {
    // 6s of fades on a 4s clip scales both to 2s, so they meet in the middle.
    const curve = fadeEnvelope(4, 3, 3, 5);
    expect(curve[2]).toBeCloseTo(1);
    expect(curve[0]).toBeCloseTo(0);
    expect(curve[4]).toBeCloseTo(0);
  });

  it('never goes outside 0..1', () => {
    for (const value of fadeEnvelope(3, 1.5, 1.5, 64)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('survives a zero-length clip', () => {
    expect(fadeEnvelope(0, 1, 1, 4)).toEqual([1, 1, 1, 1]);
  });
});

// ─── File report ──────────────────────────────────────────────────────────────

describe('buildAudioStats', () => {
  const left = new Float32Array([1, -1, 0.5, -0.5]);
  const right = new Float32Array([0.25, -0.25, 0.25, -0.25]);
  const file = { name: 'clip.mp3', size: 8000, type: 'audio/mpeg' };

  it('derives duration and frame count from the sample rate', () => {
    const stats = buildAudioStats([left], 2, file);
    expect(stats.frames).toBe(4);
    expect(stats.duration).toBeCloseTo(2);
  });

  it('reports the container bitrate in kbps', () => {
    // 8000 bytes over 2 seconds is 32 kbps.
    expect(buildAudioStats([left], 2, file).bitrateKbps).toBeCloseTo(32);
  });

  it('measures each channel separately as well as the whole file', () => {
    const stats = buildAudioStats([left, right], 4, file);
    expect(stats.peak).toBeCloseTo(1);
    expect(stats.channels).toHaveLength(2);
    expect(stats.channels[1].peak).toBeCloseTo(0.25);
    expect(stats.channels[1].rms).toBeCloseTo(0.25);
  });

  it('sizes the equivalent 16-bit WAV', () => {
    expect(buildAudioStats([left, right], 4, file).wavBytes).toBe(wavByteLength(4, 2));
  });

  it('reports no bitrate rather than Infinity for an empty file', () => {
    const stats = buildAudioStats([new Float32Array(0)], 44100, file);
    expect(stats.duration).toBe(0);
    expect(stats.bitrateKbps).toBe(0);
  });

  it('falls back to "unknown" when the browser gave no MIME type', () => {
    expect(buildAudioStats([left], 4, { name: 'a.wav', size: 1 }).mimeType).toBe('unknown');
  });
});

describe('formatDb / describeChannels', () => {
  it('spells out silence instead of printing -Infinity', () => {
    expect(formatDb(0)).toBe('silent');
  });
  it('formats a linear gain as dBFS', () => {
    expect(formatDb(1)).toBe('0.00 dBFS');
    expect(formatDb(0.5, 1)).toBe('-6.0 dBFS');
  });
  it('names the common channel layouts', () => {
    expect(describeChannels(1)).toBe('mono');
    expect(describeChannels(2)).toBe('stereo');
    expect(describeChannels(6)).toBe('6 channels');
  });
});

describe('formatAudioInfo', () => {
  const stats = buildAudioStats(
    [new Float32Array([1, -1]), new Float32Array([0.5, -0.5])],
    2,
    { name: 'clip.wav', size: 1024, type: 'audio/wav' },
  );
  const report = formatAudioInfo(stats);

  it('leads with the file identity', () => {
    expect(report).toContain('File            clip.wav');
    expect(report).toContain('Type            audio/wav');
  });

  it('lists one line per channel', () => {
    expect(report).toContain('Channel 1');
    expect(report).toContain('Channel 2');
  });

  it('reports the measured levels', () => {
    expect(report).toContain('Peak level      0.00 dBFS');
  });
});
