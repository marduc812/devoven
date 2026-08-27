import {
  parseCpu,
  parseMemory,
  calcK8sResources,
  determineQosClass,
  formatK8sResult,
  parseK8sResourceInput,
} from '../Components/Functions/K8sResourceCalcTools/logic';

describe('parseCpu', () => {
  test('parses millicores', () => {
    expect(parseCpu('100m')).toBe(100);
    expect(parseCpu('250m')).toBe(250);
    expect(parseCpu('500m')).toBe(500);
  });

  test('parses whole cores', () => {
    expect(parseCpu('1')).toBe(1000);
    expect(parseCpu('2')).toBe(2000);
  });

  test('parses fractional cores', () => {
    expect(parseCpu('0.5')).toBe(500);
    expect(parseCpu('1.5')).toBe(1500);
  });

  test('returns 0 for empty string', () => {
    expect(parseCpu('')).toBe(0);
  });

  test('throws for invalid value', () => {
    expect(() => parseCpu('abc')).toThrow();
  });
});

describe('parseMemory', () => {
  test('parses MiB', () => {
    expect(parseMemory('512Mi')).toBeCloseTo(512, 1);
    expect(parseMemory('128Mi')).toBeCloseTo(128, 1);
  });

  test('parses GiB', () => {
    expect(parseMemory('1Gi')).toBeCloseTo(1024, 1);
    expect(parseMemory('2Gi')).toBeCloseTo(2048, 1);
  });

  test('parses M (decimal megabyte = ~476.84 MiB)', () => {
    // 500M = 500,000,000 bytes (decimal) ≈ 476.84 MiB
    expect(parseMemory('500M')).toBeCloseTo(476.84, 0);
  });

  test('parses G (decimal gigabyte = ~953.67 MiB)', () => {
    // 1G = 1,000,000,000 bytes (decimal) ≈ 953.67 MiB
    expect(parseMemory('1G')).toBeCloseTo(953.67, 0);
  });

  test('returns 0 for empty string', () => {
    expect(parseMemory('')).toBe(0);
  });

  test('throws for invalid value', () => {
    expect(() => parseMemory('abc')).toThrow();
  });
});

describe('determineQosClass', () => {
  test('returns BestEffort when nothing set', () => {
    const cls = determineQosClass({ cpuRequest: '', cpuLimit: '', memRequest: '', memLimit: '' });
    expect(cls).toBe('BestEffort');
  });

  test('returns Guaranteed when req == limit', () => {
    const cls = determineQosClass({
      cpuRequest: '500m', cpuLimit: '500m',
      memRequest: '512Mi', memLimit: '512Mi',
    });
    expect(cls).toBe('Guaranteed');
  });

  test('returns Burstable when req < limit', () => {
    const cls = determineQosClass({
      cpuRequest: '250m', cpuLimit: '1',
      memRequest: '256Mi', memLimit: '512Mi',
    });
    expect(cls).toBe('Burstable');
  });
});

describe('calcK8sResources', () => {
  test('returns correct millicores and MiB', () => {
    const result = calcK8sResources({
      cpuRequest: '250m', cpuLimit: '1',
      memRequest: '512Mi', memLimit: '1Gi',
    });
    expect(result.cpuRequestMillicores).toBe(250);
    expect(result.cpuLimitMillicores).toBe(1000);
    expect(result.memRequestMiB).toBeCloseTo(512, 1);
    expect(result.memLimitMiB).toBeCloseTo(1024, 1);
  });

  test('detects CPU request > limit error', () => {
    const result = calcK8sResources({
      cpuRequest: '2', cpuLimit: '500m',
      memRequest: '256Mi', memLimit: '512Mi',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(function(e) { return e.includes('CPU request'); })).toBe(true);
  });

  test('detects memory request > limit error', () => {
    const result = calcK8sResources({
      cpuRequest: '100m', cpuLimit: '500m',
      memRequest: '1Gi', memLimit: '512Mi',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(function(e) { return e.includes('Memory request'); })).toBe(true);
  });

  test('valid spec produces no errors', () => {
    const result = calcK8sResources({
      cpuRequest: '250m', cpuLimit: '1',
      memRequest: '512Mi', memLimit: '1Gi',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('parseK8sResourceInput', () => {
  test('parses key=value format', () => {
    const input = 'cpu_request=250m\ncpu_limit=1\nmem_request=512Mi\nmem_limit=1Gi';
    const result = parseK8sResourceInput(input);
    expect(result.cpuRequest).toBe('250m');
    expect(result.cpuLimit).toBe('1');
    expect(result.memRequest).toBe('512Mi');
    expect(result.memLimit).toBe('1Gi');
  });

  test('ignores blank lines and comments', () => {
    const input = '# comment\n\ncpu_request=100m\n';
    const result = parseK8sResourceInput(input);
    expect(result.cpuRequest).toBe('100m');
  });
});

describe('formatK8sResult', () => {
  test('output contains QoS class', () => {
    const result = calcK8sResources({
      cpuRequest: '250m', cpuLimit: '1',
      memRequest: '512Mi', memLimit: '1Gi',
    });
    const output = formatK8sResult(result);
    expect(output).toContain('Burstable');
  });

  test('output contains node estimate', () => {
    const result = calcK8sResources({
      cpuRequest: '250m', cpuLimit: '500m',
      memRequest: '256Mi', memLimit: '512Mi',
    });
    const output = formatK8sResult(result);
    expect(output).toContain('Node Fit');
  });
});
