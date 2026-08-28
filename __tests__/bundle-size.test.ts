import { PACKAGE_DATABASE, lookupPackages, estimateBundle, formatBytes } from '../Components/Functions/BundleSizeTools/logic';

describe('BundleSizeTools logic', () => {
  test('PACKAGE_DATABASE has 100+ entries', () => {
    expect(PACKAGE_DATABASE.length).toBeGreaterThanOrEqual(100);
  });

  test('each package has required fields', () => {
    for (const pkg of PACKAGE_DATABASE) {
      expect(pkg.name).toBeTruthy();
      expect(typeof pkg.minGzip).toBe('number');
      expect(typeof pkg.treeShakeable).toBe('boolean');
      expect(pkg.category).toBeTruthy();
    }
  });

  test('lookupPackages - known package', () => {
    const results = lookupPackages('react\naxios');
    expect(results).toHaveLength(2);
    expect(results[0].info?.name).toBe('react');
    expect(results[1].info?.name).toBe('axios');
  });

  test('lookupPackages - unknown package', () => {
    const results = lookupPackages('totally-fake-package-xyz');
    expect(results[0].info).toBeNull();
  });

  test('estimateBundle - empty input', () => {
    const result = estimateBundle('');
    expect(result.totalBytes).toBe(0);
  });

  test('estimateBundle - react + react-dom', () => {
    const result = estimateBundle('react\nreact-dom');
    expect(result.totalBytes).toBeGreaterThan(0);
    expect(result.found).toBe(2);
    expect(result.notFound).toBe(0);
  });

  test('estimateBundle - moment warning', () => {
    const result = estimateBundle('moment');
    expect(result.warnings.some(w => w.toLowerCase().includes('moment'))).toBe(true);
  });

  test('estimateBundle - lodash warning', () => {
    const result = estimateBundle('lodash');
    expect(result.warnings.some(w => w.toLowerCase().includes('lodash'))).toBe(true);
  });

  test('estimateBundle - impact rating small', () => {
    const result = estimateBundle('nanoid');
    expect(result.impact).toBe('small');
  });

  test('estimateBundle - not found count', () => {
    const result = estimateBundle('react\nfake-pkg-123');
    expect(result.found).toBe(1);
    expect(result.notFound).toBe(1);
  });

  test('formatBytes - bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(500)).toBe('500 B');
  });

  test('formatBytes - kilobytes', () => {
    expect(formatBytes(12000)).toBe('11.7 KB');
  });

  test('formatBytes - megabytes', () => {
    expect(formatBytes(1200000)).toBe('1.14 MB');
  });
});
