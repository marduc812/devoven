import { parseSvgPath, formatPathOutput } from '../Components/Functions/SvgPathTools/logic';

describe('parseSvgPath', () => {
  it('returns empty result for empty input', () => {
    const result = parseSvgPath('');
    expect(result.totalSegments).toBe(0);
    expect(result.commands).toHaveLength(0);
    expect(result.summary).toBe('');
  });

  it('parses a simple move command', () => {
    const result = parseSvgPath('M 10 20');
    expect(result.totalSegments).toBe(1);
    expect(result.commands[0].command).toBe('M');
    expect(result.commands[0].params).toEqual([10, 20]);
    expect(result.commands[0].absolute).toBe(true);
    expect(result.commands[0].description).toContain('Move to (10, 20)');
  });

  it('parses a line command', () => {
    const result = parseSvgPath('M 0 0 L 50 30');
    expect(result.totalSegments).toBe(2);
    expect(result.commands[1].command).toBe('L');
    expect(result.commands[1].description).toContain('Line to (50, 30)');
  });

  it('parses horizontal and vertical lines', () => {
    const result = parseSvgPath('M 10 10 H 90 V 90');
    expect(result.totalSegments).toBe(3);
    expect(result.commands[1].description).toContain('Horizontal');
    expect(result.commands[2].description).toContain('Vertical');
  });

  it('parses close path command Z', () => {
    const result = parseSvgPath('M 10 10 H 90 V 90 H 10 Z');
    const zCmd = result.commands.find(c => c.command === 'Z');
    expect(zCmd).toBeDefined();
    expect(zCmd!.description).toContain('Close path');
  });

  it('parses relative commands (lowercase)', () => {
    const result = parseSvgPath('m 10 20 l 30 40');
    expect(result.commands[0].absolute).toBe(false);
    expect(result.commands[1].absolute).toBe(false);
    expect(result.commands[1].description).toContain('relative');
  });

  it('parses cubic bezier curve', () => {
    const result = parseSvgPath('M 10 80 C 40 10 65 10 95 80');
    const cCmd = result.commands.find(c => c.command === 'C');
    expect(cCmd).toBeDefined();
    expect(cCmd!.description).toContain('Cubic Bezier');
  });

  it('parses arc command', () => {
    const result = parseSvgPath('M 10 80 A 25 25 0 0 1 50 10');
    const aCmd = result.commands.find(c => c.command === 'A');
    expect(aCmd).toBeDefined();
    expect(aCmd!.description).toContain('Arc');
  });

  it('parses quadratic bezier', () => {
    const result = parseSvgPath('M 10 80 Q 52.5 10 95 80');
    const qCmd = result.commands.find(c => c.command === 'Q');
    expect(qCmd).toBeDefined();
    expect(qCmd!.description).toContain('Quadratic Bezier');
  });

  it('returns bounding box', () => {
    const result = parseSvgPath('M 10 10 H 90 V 90 H 10 Z');
    expect(result.boundingBox.maxX).toBeGreaterThanOrEqual(result.boundingBox.minX);
    expect(result.boundingBox.maxY).toBeGreaterThanOrEqual(result.boundingBox.minY);
  });

  it('provides path length estimate > 0 for non-trivial path', () => {
    const result = parseSvgPath('M 0 0 L 100 0 L 100 100 Z');
    expect(result.pathLengthEstimate).toBeGreaterThan(0);
  });

  it('summary includes segment count', () => {
    const result = parseSvgPath('M 10 10 L 50 50 Z');
    expect(result.summary).toContain('Total segments');
    expect(result.summary).toContain('3');
  });

  it('summary includes bounding box', () => {
    const result = parseSvgPath('M 10 10 L 50 50 Z');
    expect(result.summary).toContain('Bounding box');
  });

  it('handles multiple commands in a row', () => {
    const result = parseSvgPath('M 10 10 H 90 V 90 H 10 V 10 Z');
    expect(result.totalSegments).toBe(6);
  });
});

describe('formatPathOutput', () => {
  it('returns empty string for empty result', () => {
    const result = parseSvgPath('');
    expect(formatPathOutput(result)).toBe('');
  });

  it('includes segment breakdown header', () => {
    const result = parseSvgPath('M 10 20 L 50 60');
    const output = formatPathOutput(result);
    expect(output).toContain('Segment Breakdown');
  });

  it('numbers each segment', () => {
    const result = parseSvgPath('M 10 20 L 50 60');
    const output = formatPathOutput(result);
    expect(output).toContain('1.');
    expect(output).toContain('2.');
  });

  it('shows command letter in output', () => {
    const result = parseSvgPath('M 10 20 L 50 60 Z');
    const output = formatPathOutput(result);
    expect(output).toContain('M');
    expect(output).toContain('L');
    expect(output).toContain('Z');
  });

  it('includes summary at top', () => {
    const result = parseSvgPath('M 10 10 H 90 V 90 Z');
    const output = formatPathOutput(result);
    expect(output).toContain('Total segments');
  });
});
