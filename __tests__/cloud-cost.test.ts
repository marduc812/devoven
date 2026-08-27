import {
  parseWorkload,
  estimateCloudCost,
  formatCostEstimate,
} from '../Components/Functions/CloudCostTools/logic';

describe('parseWorkload', () => {
  test('parses vCPU', () => {
    const spec = parseWorkload('2 vCPU 4GB RAM');
    expect(spec.vcpu).toBe(2);
  });

  test('parses RAM in GB', () => {
    const spec = parseWorkload('4 vCPU 16GB RAM');
    expect(spec.ramGib).toBe(16);
  });

  test('parses storage in GB', () => {
    const spec = parseWorkload('2 vCPU 4GB RAM, 100GB SSD');
    expect(spec.storageSsdGb).toBe(100);
  });

  test('parses transfer in TB', () => {
    const spec = parseWorkload('2 vCPU 4GB RAM, 1TB transfer/month');
    expect(spec.transferGb).toBe(1000);
  });

  test('parses instance count', () => {
    const spec = parseWorkload('2 vCPU 4GB RAM, 3 instances');
    expect(spec.instances).toBe(3);
  });

  test('defaults when no match', () => {
    const spec = parseWorkload('a simple server');
    expect(spec.vcpu).toBeGreaterThan(0);
    expect(spec.ramGib).toBeGreaterThan(0);
  });
});

describe('estimateCloudCost', () => {
  test('returns 3 providers', () => {
    const estimate = estimateCloudCost('2 vCPU 4GB RAM');
    expect(estimate.providers).toHaveLength(3);
    const names = estimate.providers.map(function(p) { return p.provider; });
    expect(names).toContain('AWS');
    expect(names).toContain('GCP');
    expect(names).toContain('Azure');
  });

  test('compute cost is positive', () => {
    const estimate = estimateCloudCost('2 vCPU 4GB RAM');
    for (const p of estimate.providers) {
      expect(p.compute).toBeGreaterThan(0);
    }
  });

  test('storage cost is positive when storage specified', () => {
    const estimate = estimateCloudCost('2 vCPU 4GB RAM 100GB SSD');
    for (const p of estimate.providers) {
      expect(p.storage).toBeGreaterThan(0);
    }
  });

  test('storage cost is 0 when no storage', () => {
    const estimate = estimateCloudCost('2 vCPU 4GB RAM');
    for (const p of estimate.providers) {
      expect(p.storage).toBe(0);
    }
  });

  test('transfer within free tier has 0 transfer cost', () => {
    // All providers have >= 100 GB free transfer
    const estimate = estimateCloudCost('2 vCPU 4GB RAM, 50GB transfer/month');
    for (const p of estimate.providers) {
      expect(p.transfer).toBe(0);
    }
  });

  test('total equals sum of parts', () => {
    const estimate = estimateCloudCost('2 vCPU 4GB RAM 100GB SSD 500GB transfer');
    for (const p of estimate.providers) {
      expect(p.total).toBeCloseTo(p.compute + p.storage + p.transfer, 5);
    }
  });

  test('multiple instances multiply compute', () => {
    const estimate1 = estimateCloudCost('2 vCPU 4GB RAM, 1 instance');
    const estimate2 = estimateCloudCost('2 vCPU 4GB RAM, 2 instances');
    const aws1 = estimate1.providers.find(function(p) { return p.provider === 'AWS'; })!;
    const aws2 = estimate2.providers.find(function(p) { return p.provider === 'AWS'; })!;
    expect(aws2.compute).toBeCloseTo(aws1.compute * 2, 2);
  });
});

describe('formatCostEstimate', () => {
  test('output contains all provider names', () => {
    const estimate = estimateCloudCost('2 vCPU 4GB RAM');
    const output = formatCostEstimate(estimate);
    expect(output).toContain('AWS');
    expect(output).toContain('GCP');
    expect(output).toContain('Azure');
  });

  test('output contains workload section', () => {
    const estimate = estimateCloudCost('2 vCPU 4GB RAM');
    const output = formatCostEstimate(estimate);
    expect(output).toContain('Workload Parsed');
  });

  test('output contains summary', () => {
    const estimate = estimateCloudCost('2 vCPU 4GB RAM');
    const output = formatCostEstimate(estimate);
    expect(output).toContain('Summary');
    expect(output).toContain('cheapest');
  });
});
