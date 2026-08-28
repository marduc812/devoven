import { bpmToMs, msToBpm, noteDurations, convertBpm, NOTE_DURATIONS } from '@/Components/Functions/BpmTools/logic';

describe('bpmToMs', () => {
  it('converts 60 BPM to 1000ms', () => {
    expect(bpmToMs(60)).toBe(1000);
  });

  it('converts 120 BPM to 500ms', () => {
    expect(bpmToMs(120)).toBe(500);
  });

  it('converts 240 BPM to 250ms', () => {
    expect(bpmToMs(240)).toBe(250);
  });
});

describe('msToBpm', () => {
  it('converts 1000ms to 60 BPM', () => {
    expect(msToBpm(1000)).toBe(60);
  });

  it('converts 500ms to 120 BPM', () => {
    expect(msToBpm(500)).toBe(120);
  });

  it('is inverse of bpmToMs', () => {
    expect(Math.round(msToBpm(bpmToMs(90)))).toBe(90);
  });
});

describe('noteDurations', () => {
  it('returns all note durations', () => {
    const durations = noteDurations(120);
    expect(durations.length).toBe(NOTE_DURATIONS.length);
  });

  it('quarter note at 120 BPM is 500ms', () => {
    const durations = noteDurations(120);
    const quarter = durations.find(d => d.name === 'Quarter note (1 beat)');
    expect(quarter).toBeDefined();
    expect(quarter!.ms).toBe(500);
  });

  it('whole note is 4x quarter note', () => {
    const durations = noteDurations(120);
    const whole = durations.find(d => d.name === 'Whole note');
    const quarter = durations.find(d => d.name === 'Quarter note (1 beat)');
    expect(whole!.ms).toBe(quarter!.ms * 4);
  });

  it('eighth note is half quarter note', () => {
    const durations = noteDurations(120);
    const eighth = durations.find(d => d.name === 'Eighth note');
    const quarter = durations.find(d => d.name === 'Quarter note (1 beat)');
    expect(eighth!.ms).toBe(quarter!.ms * 0.5);
  });
});

describe('convertBpm', () => {
  it('returns empty for empty input', () => {
    expect(convertBpm('')).toBe('');
  });

  it('handles numeric BPM input', () => {
    const result = convertBpm('120');
    expect(result).toContain('120');
    expect(result).toContain('500');
  });

  it('handles BPM with unit suffix', () => {
    const result = convertBpm('120bpm');
    expect(result).toContain('120');
  });

  it('handles ms input', () => {
    const result = convertBpm('500ms');
    expect(result).toContain('120');
  });

  it('shows note durations', () => {
    const result = convertBpm('120');
    expect(result).toContain('Whole note');
    expect(result).toContain('Quarter note');
    expect(result).toContain('Eighth note');
  });

  it('shows tempo range', () => {
    const result = convertBpm('120');
    expect(result).toContain('Allegro');
  });

  it('returns error for invalid input', () => {
    const result = convertBpm('abc');
    expect(result.toLowerCase()).toContain('enter');
  });
});
