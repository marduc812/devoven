import { OPERATION_MAP } from '@/lib/blocks/registry';
import { getFinalOutput } from '@/lib/blocks/pipeline';
import { BlockState } from '@/lib/blocks/types';
import { formatSimilarityOutput, formatSimilarityPair } from '@/Components/Functions/TextSimilarityTools/logic';

/** A block with every field typed in and nothing fed from upstream. */
function typed(operationId: string, params: Record<string, string>): BlockState {
  return { id: `b-${operationId}`, operationId, params, enabled: true, linked: null };
}

function run(operationId: string, params: Record<string, string>, linked: string | null = null, input = ''): string {
  return getFinalOutput({ input, blocks: [{ ...typed(operationId, params), linked }] });
}

describe('comparison blocks', () => {
  it('registers each one with two or more named fields', () => {
    for (const id of ['levenshtein', 'edit-distance-report', 'hamming-distance', 'text-similarity', 'haversine', 'date-diff']) {
      expect(OPERATION_MAP[id].inputs?.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('counts edits between two strings', () => {
    expect(run('levenshtein', { a: 'kitten', b: 'sitting' })).toBe('3');
    expect(run('levenshtein', { a: '', b: 'abc' })).toBe('3');
  });

  it('takes one side from upstream', () => {
    expect(run('levenshtein', { b: 'sitting' }, 'a', 'kitten')).toBe('3');
    expect(run('levenshtein', { a: 'kitten' }, 'b', 'sitting')).toBe('3');
  });

  it('counts differing positions and refuses unequal lengths', () => {
    expect(run('hamming-distance', { a: 'karolin', b: 'kathrin' })).toBe('3');
    expect(run('hamming-distance', { a: 'abc', b: 'abcd' })).toBe('');
    expect(() => OPERATION_MAP['hamming-distance'].fn('', { a: 'abc', b: 'abcd' })).toThrow(/same length/);
  });

  it('writes the edit distance report as a terminal block', () => {
    expect(OPERATION_MAP['edit-distance-report'].terminal).toBe(true);
    const report = run('edit-distance-report', { a: 'kitten', b: 'sitting' });
    expect(report).toContain('Edit distance:  3');
  });

  it('reports similarity from two fields, matching the tool page', () => {
    expect(OPERATION_MAP['text-similarity'].terminal).toBe(true);
    const a = 'The quick brown fox';
    const b = 'The fast brown dog';
    expect(run('text-similarity', { a, b })).toBe(formatSimilarityOutput(`${a}\n---\n${b}`));
    expect(formatSimilarityPair(a, b)).toContain('Jaccard Similarity');
  });

  it('names the empty text in the similarity block', () => {
    expect(() => OPERATION_MAP['text-similarity'].fn('', { a: 'x', b: '' })).toThrow('Text B is empty');
  });

  it('measures London to Paris', () => {
    const report = run('haversine', { lat1: '51.5074', lon1: '-0.1278', lat2: '48.8566', lon2: '2.3522' });
    expect(report).toMatch(/Distance:\s+343\.\d+ km/);
    expect(report).toMatch(/Initial bearing:\s+\d+\.\d° \(S/);
  });

  it('names the coordinate that is out of range', () => {
    expect(() => OPERATION_MAP.haversine.fn('', { lat1: '91', lon1: '0', lat2: '0', lon2: '0' })).toThrow(/Lat 1: Latitude runs/);
    expect(() => OPERATION_MAP.haversine.fn('', { lat1: '0', lon1: '', lat2: '0', lon2: '0' })).toThrow('Lon 1 is empty');
  });

  it('reports the difference between two dates', () => {
    const report = run('date-diff', { from: '2024-01-01', to: '2024-03-01' });
    expect(report).toContain('Total days:   60');
    expect(() => OPERATION_MAP['date-diff'].fn('', { from: 'yesterday', to: '2024-03-01' })).toThrow(/Invalid date/);
  });
});
