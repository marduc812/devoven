import { LICENSES, suggestLicenses, formatLicenseSummary, getLicenseById } from '@/Components/Functions/LicenseChooserTools/logic';

describe('LICENSES', () => {
  it('has at least 10 licenses', () => {
    expect(LICENSES.length).toBeGreaterThanOrEqual(10);
  });

  it('each license has required fields', () => {
    for (const l of LICENSES) {
      expect(l.id).toBeTruthy();
      expect(l.name).toBeTruthy();
      expect(l.spdx).toBeTruthy();
      expect(Array.isArray(l.permissions)).toBe(true);
      expect(Array.isArray(l.conditions)).toBe(true);
      expect(Array.isArray(l.limitations)).toBe(true);
    }
  });
});

describe('getLicenseById', () => {
  it('returns MIT license', () => {
    const l = getLicenseById('mit');
    expect(l).toBeDefined();
    expect(l!.spdx).toBe('MIT');
  });

  it('returns undefined for unknown id', () => {
    expect(getLicenseById('unknown-xyz')).toBeUndefined();
  });
});

describe('suggestLicenses', () => {
  it('suggests permissive licenses when shareCode=false', () => {
    const results = suggestLicenses({
      commercial: true,
      shareCode: false,
      patent: false,
      modifications: 'allow-closed',
      network: false,
    });
    const ids = results.map(l => l.id);
    expect(ids).toContain('mit');
    expect(ids).toContain('isc');
    expect(ids).not.toContain('gpl-3.0');
  });

  it('suggests copyleft licenses when shareCode=true', () => {
    const results = suggestLicenses({
      commercial: true,
      shareCode: true,
      patent: false,
      modifications: 'keep-open',
      network: false,
    });
    const ids = results.map(l => l.id);
    expect(ids).not.toContain('mit');
  });

  it('suggests AGPL when network=true', () => {
    const results = suggestLicenses({
      commercial: true,
      shareCode: true,
      patent: true,
      modifications: 'keep-open',
      network: true,
    });
    const ids = results.map(l => l.id);
    expect(ids).toContain('agpl-3.0');
  });

  it('requires patent grant when patent=true', () => {
    const results = suggestLicenses({
      commercial: true,
      shareCode: false,
      patent: true,
      modifications: 'any',
      network: false,
    });
    for (const l of results) {
      expect(l.patent).toBe(true);
    }
  });
});

describe('formatLicenseSummary', () => {
  it('formats MIT summary', () => {
    const mit = getLicenseById('mit')!;
    const text = formatLicenseSummary(mit);
    expect(text).toContain('MIT License');
    expect(text).toContain('Permissions');
    expect(text).toContain('Conditions');
    expect(text).toContain('License Text');
  });
});
