import { generateCompose } from '@/Components/Functions/DockerComposeGenTools/logic';

describe('generateCompose - postgres', () => {
  it('generates postgres service', () => {
    const result = generateCompose('postgres');
    expect(result.yaml).toContain('postgres:');
    expect(result.yaml).toContain('image: postgres');
    expect(result.services).toContain('postgres');
  });

  it('respects version override', () => {
    const result = generateCompose('postgres 14');
    expect(result.yaml).toContain('postgres:14');
  });

  it('includes persistent volume', () => {
    const result = generateCompose('postgres with persistent volume');
    expect(result.yaml).toContain('volumes:');
    expect(result.yaml).toContain('postgres_data');
  });

  it('includes named volumes section', () => {
    const result = generateCompose('postgres');
    // Named volumes section at top-level
    const volumesIdx = result.yaml.lastIndexOf('volumes:');
    expect(volumesIdx).toBeGreaterThan(-1);
  });

  it('overrides password', () => {
    const result = generateCompose('postgres password mysupersecret');
    expect(result.yaml).toContain('mysupersecret');
  });
});

describe('generateCompose - multiple services', () => {
  it('generates multiple services separated by comma', () => {
    const result = generateCompose('postgres, redis');
    expect(result.services).toContain('postgres');
    expect(result.services).toContain('redis');
    expect(result.yaml).toContain('postgres:');
    expect(result.yaml).toContain('redis:');
  });

  it('handles "and" separator', () => {
    const result = generateCompose('postgres and redis');
    expect(result.services.length).toBe(2);
  });
});

describe('generateCompose - known services', () => {
  const services = ['mysql', 'redis', 'nginx', 'mongodb', 'rabbitmq', 'elasticsearch'];
  services.forEach(svc => {
    it(`generates ${svc} service`, () => {
      const result = generateCompose(svc);
      expect(result.services.length).toBeGreaterThan(0);
      expect(result.yaml.length).toBeGreaterThan(0);
    });
  });
});

describe('generateCompose - warnings', () => {
  it('returns warning for unrecognized service', () => {
    const result = generateCompose('unknowndb123');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('returns empty yaml for empty input', () => {
    const result = generateCompose('');
    expect(result.yaml).toBe('');
  });
});

describe('generateCompose - structure', () => {
  it('includes version field', () => {
    const result = generateCompose('redis');
    expect(result.yaml).toContain('version:');
  });

  it('includes services section', () => {
    const result = generateCompose('redis');
    expect(result.yaml).toContain('services:');
  });

  it('includes restart policy', () => {
    const result = generateCompose('redis');
    expect(result.yaml).toContain('restart:');
  });
});
