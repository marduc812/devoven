import {
  nodeFits,
  resourcesYaml,
  QOS_EXPLANATIONS,
  NODE_SIZES,
} from '../Components/Functions/K8sResourceCalcTools/logic';

describe('nodeFits', () => {
  it('covers every node size', () => {
    expect(nodeFits(1000, 1024)).toHaveLength(NODE_SIZES.length);
  });

  it('divides capacity by the limit', () => {
    // t3.medium is 2000m / 4096 MiB; 500m and 512Mi means CPU allows 4, memory 8.
    const fit = nodeFits(500, 512).find(f => f.name === 't3.medium');
    expect(fit?.replicas).toBe(4);
    expect(fit?.boundBy).toBe('cpu');
  });

  it('reports memory as the bound when it runs out first', () => {
    // t3.micro is 2000m / 1024 MiB; 100m allows 20 by CPU but only 2 by memory.
    const fit = nodeFits(100, 512).find(f => f.name === 't3.micro');
    expect(fit?.replicas).toBe(2);
    expect(fit?.boundBy).toBe('memory');
  });

  it('returns zero replicas when nothing fits', () => {
    const fits = nodeFits(64000, 262144);
    expect(fits.every(f => f.replicas === 0)).toBe(true);
  });

  it('falls back to a nominal 100m / 128Mi when limits are unset', () => {
    const withZero = nodeFits(0, 0).find(f => f.name === 't3.micro');
    const withNominal = nodeFits(100, 128).find(f => f.name === 't3.micro');
    expect(withZero?.replicas).toBe(withNominal?.replicas);
  });
});

describe('resourcesYaml', () => {
  it('emits both blocks when everything is set', () => {
    const yaml = resourcesYaml({
      cpuRequest: '250m', cpuLimit: '1', memRequest: '512Mi', memLimit: '1Gi',
    });
    expect(yaml).toContain('resources:');
    expect(yaml).toContain('  requests:');
    expect(yaml).toContain('    cpu: "250m"');
    expect(yaml).toContain('    memory: "512Mi"');
    expect(yaml).toContain('  limits:');
    expect(yaml).toContain('    cpu: "1"');
    expect(yaml).toContain('    memory: "1Gi"');
  });

  it('omits the limits block when no limit is set', () => {
    const yaml = resourcesYaml({ cpuRequest: '250m', cpuLimit: '', memRequest: '', memLimit: '' });
    expect(yaml).toContain('  requests:');
    expect(yaml).not.toContain('  limits:');
  });

  it('omits the requests block when no request is set', () => {
    const yaml = resourcesYaml({ cpuRequest: '', cpuLimit: '1', memRequest: '', memLimit: '1Gi' });
    expect(yaml).toContain('  limits:');
    expect(yaml).not.toContain('  requests:');
  });

  it('explains itself when nothing is set', () => {
    const yaml = resourcesYaml({ cpuRequest: '', cpuLimit: '', memRequest: '', memLimit: '' });
    expect(yaml).toContain('BestEffort');
    expect(yaml).not.toContain('resources:');
  });

  it('trims whitespace out of the values', () => {
    expect(resourcesYaml({ cpuRequest: '  250m  ', cpuLimit: '', memRequest: '', memLimit: '' }))
      .toContain('    cpu: "250m"');
  });
});

describe('QOS_EXPLANATIONS', () => {
  it('has an entry per class', () => {
    expect(Object.keys(QOS_EXPLANATIONS).sort()).toEqual(['BestEffort', 'Burstable', 'Guaranteed']);
    for (const text of Object.values(QOS_EXPLANATIONS)) {
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
