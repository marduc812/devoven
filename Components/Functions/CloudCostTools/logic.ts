// ── Cloud Cost Estimator ────────────────────────────────────────────────────────
// Pricing approximations based on public list prices (~2024).
// All prices in USD per month unless noted.

export interface WorkloadSpec {
  vcpu: number;
  ramGib: number;
  storageSsdGb: number;
  transferGb: number;
  instances: number;
}

export interface ProviderCost {
  provider: string;
  compute: number;
  storage: number;
  transfer: number;
  total: number;
  instanceType: string;
  notes: string[];
}

export interface CostEstimate {
  providers: ProviderCost[];
  spec: WorkloadSpec;
  warnings: string[];
}

// ── Pricing Tables (monthly, USD) ──────────────────────────────────────────────

// Approximate on-demand prices for common instance types
interface InstanceOption {
  name: string;
  vcpu: number;
  ramGib: number;
  pricePerHour: number;
}

const AWS_INSTANCES: InstanceOption[] = [
  { name: 't3.micro',    vcpu: 2,  ramGib: 1,   pricePerHour: 0.0104 },
  { name: 't3.small',    vcpu: 2,  ramGib: 2,   pricePerHour: 0.0208 },
  { name: 't3.medium',   vcpu: 2,  ramGib: 4,   pricePerHour: 0.0416 },
  { name: 't3.large',    vcpu: 2,  ramGib: 8,   pricePerHour: 0.0832 },
  { name: 'm5.large',    vcpu: 2,  ramGib: 8,   pricePerHour: 0.096  },
  { name: 'm5.xlarge',   vcpu: 4,  ramGib: 16,  pricePerHour: 0.192  },
  { name: 'm5.2xlarge',  vcpu: 8,  ramGib: 32,  pricePerHour: 0.384  },
  { name: 'm5.4xlarge',  vcpu: 16, ramGib: 64,  pricePerHour: 0.768  },
  { name: 'c5.large',    vcpu: 2,  ramGib: 4,   pricePerHour: 0.085  },
  { name: 'c5.xlarge',   vcpu: 4,  ramGib: 8,   pricePerHour: 0.17   },
  { name: 'c5.2xlarge',  vcpu: 8,  ramGib: 16,  pricePerHour: 0.34   },
  { name: 'r5.large',    vcpu: 2,  ramGib: 16,  pricePerHour: 0.126  },
  { name: 'r5.xlarge',   vcpu: 4,  ramGib: 32,  pricePerHour: 0.252  },
  { name: 'r5.2xlarge',  vcpu: 8,  ramGib: 64,  pricePerHour: 0.504  },
];

const GCP_INSTANCES: InstanceOption[] = [
  { name: 'e2-micro',      vcpu: 2,  ramGib: 1,   pricePerHour: 0.00838 },
  { name: 'e2-small',      vcpu: 2,  ramGib: 2,   pricePerHour: 0.01675 },
  { name: 'e2-medium',     vcpu: 2,  ramGib: 4,   pricePerHour: 0.03350 },
  { name: 'e2-standard-2', vcpu: 2,  ramGib: 8,   pricePerHour: 0.06700 },
  { name: 'e2-standard-4', vcpu: 4,  ramGib: 16,  pricePerHour: 0.13400 },
  { name: 'e2-standard-8', vcpu: 8,  ramGib: 32,  pricePerHour: 0.26800 },
  { name: 'n2-standard-2', vcpu: 2,  ramGib: 8,   pricePerHour: 0.09780 },
  { name: 'n2-standard-4', vcpu: 4,  ramGib: 16,  pricePerHour: 0.19560 },
  { name: 'n2-standard-8', vcpu: 8,  ramGib: 32,  pricePerHour: 0.39120 },
  { name: 'c2-standard-4', vcpu: 4,  ramGib: 16,  pricePerHour: 0.20880 },
  { name: 'c2-standard-8', vcpu: 8,  ramGib: 32,  pricePerHour: 0.41760 },
];

const AZURE_INSTANCES: InstanceOption[] = [
  { name: 'B1s',           vcpu: 1,  ramGib: 1,   pricePerHour: 0.0104 },
  { name: 'B2s',           vcpu: 2,  ramGib: 4,   pricePerHour: 0.0416 },
  { name: 'D2s_v3',        vcpu: 2,  ramGib: 8,   pricePerHour: 0.096  },
  { name: 'D4s_v3',        vcpu: 4,  ramGib: 16,  pricePerHour: 0.192  },
  { name: 'D8s_v3',        vcpu: 8,  ramGib: 32,  pricePerHour: 0.384  },
  { name: 'D16s_v3',       vcpu: 16, ramGib: 64,  pricePerHour: 0.768  },
  { name: 'F2s_v2',        vcpu: 2,  ramGib: 4,   pricePerHour: 0.085  },
  { name: 'F4s_v2',        vcpu: 4,  ramGib: 8,   pricePerHour: 0.17   },
  { name: 'E2s_v3',        vcpu: 2,  ramGib: 16,  pricePerHour: 0.126  },
  { name: 'E4s_v3',        vcpu: 4,  ramGib: 32,  pricePerHour: 0.252  },
];

function pickBestInstance(instances: InstanceOption[], vcpu: number, ramGib: number): InstanceOption {
  // Find smallest instance that fits the requirements
  const fitting = instances.filter(function(i) {
    return i.vcpu >= vcpu && i.ramGib >= ramGib;
  });
  if (fitting.length === 0) {
    // Return largest available
    return instances[instances.length - 1];
  }
  // Sort by price and return cheapest that fits
  fitting.sort(function(a, b) { return a.pricePerHour - b.pricePerHour; });
  return fitting[0];
}

// Storage pricing per GB/month
const STORAGE_PRICE: Record<string, number> = {
  aws: 0.10,   // EBS gp3
  gcp: 0.10,   // Persistent SSD
  azure: 0.10, // Premium SSD
};

// Transfer pricing per GB (first 1 TB tier, outbound)
const TRANSFER_PRICE: Record<string, number> = {
  aws: 0.09,
  gcp: 0.08,
  azure: 0.0875,
};

// Free tier outbound transfer GB per month
const FREE_TRANSFER_GB: Record<string, number> = {
  aws: 100,
  gcp: 200,
  azure: 100,
};

export function parseWorkload(input: string): WorkloadSpec {
  const spec: WorkloadSpec = {
    vcpu: 2,
    ramGib: 4,
    storageSsdGb: 0,
    transferGb: 0,
    instances: 1,
  };

  const lower = input.toLowerCase();

  // Parse vCPU / CPU
  const cpuMatch = lower.match(/(\d+(?:\.\d+)?)\s*v?cpu/);
  if (cpuMatch) spec.vcpu = Math.max(1, Math.ceil(parseFloat(cpuMatch[1])));

  // Parse RAM
  const ramGibMatch = lower.match(/(\d+(?:\.\d+)?)\s*gb?\s*ram/);
  const ramMibMatch = lower.match(/(\d+(?:\.\d+)?)\s*mb?\s*ram/);
  if (ramGibMatch) spec.ramGib = parseFloat(ramGibMatch[1]);
  else if (ramMibMatch) spec.ramGib = parseFloat(ramMibMatch[1]) / 1024;

  // Parse storage
  const storageTbMatch = lower.match(/(\d+(?:\.\d+)?)\s*tb\s*(?:ssd|storage|disk|nvme)?/);
  const storageGbMatch = lower.match(/(\d+(?:\.\d+)?)\s*gb\s*(?:ssd|storage|disk|nvme)/);
  if (storageTbMatch) spec.storageSsdGb = parseFloat(storageTbMatch[1]) * 1000;
  else if (storageGbMatch) spec.storageSsdGb = parseFloat(storageGbMatch[1]);

  // Parse transfer
  const transferTbMatch = lower.match(/(\d+(?:\.\d+)?)\s*tb\s*(?:transfer|bandwidth|egress|outbound)/);
  const transferGbMatch = lower.match(/(\d+(?:\.\d+)?)\s*gb\s*(?:transfer|bandwidth|egress|outbound)/);
  if (transferTbMatch) spec.transferGb = parseFloat(transferTbMatch[1]) * 1000;
  else if (transferGbMatch) spec.transferGb = parseFloat(transferGbMatch[1]);

  // Parse instance count
  const instanceMatch = lower.match(/(\d+)\s*(?:instance|server|node|vm)/);
  if (instanceMatch) spec.instances = Math.max(1, parseInt(instanceMatch[1], 10));

  return spec;
}

function calcProviderCost(
  provider: string,
  instances: InstanceOption[],
  spec: WorkloadSpec,
  storageKey: string,
  transferKey: string,
): ProviderCost {
  const instance = pickBestInstance(instances, spec.vcpu, spec.ramGib);
  const HOURS_PER_MONTH = 730;

  const computeCost = instance.pricePerHour * HOURS_PER_MONTH * spec.instances;
  const storageCost = (spec.storageSsdGb * STORAGE_PRICE[storageKey]) * spec.instances;

  const freeTransfer = FREE_TRANSFER_GB[transferKey] || 0;
  const billableTransfer = Math.max(0, spec.transferGb - freeTransfer);
  const transferCost = billableTransfer * TRANSFER_PRICE[transferKey];

  const total = computeCost + storageCost + transferCost;
  const notes: string[] = [];
  if (spec.instances > 1) {
    notes.push('Using ' + spec.instances + 'x ' + instance.name);
  }
  if (freeTransfer > 0 && spec.transferGb <= freeTransfer) {
    notes.push('Transfer within free tier (' + freeTransfer + ' GB/mo)');
  }

  return {
    provider,
    compute: computeCost,
    storage: storageCost,
    transfer: transferCost,
    total,
    instanceType: instance.name,
    notes,
  };
}

export function estimateCloudCost(input: string): CostEstimate {
  const spec = parseWorkload(input);
  const warnings: string[] = [];

  if (spec.vcpu > 16) {
    warnings.push('Very high vCPU count — consider specialized compute instances');
  }
  if (spec.ramGib > 64) {
    warnings.push('Very high RAM — consider memory-optimized instance families (r5, r6i)');
  }

  const awsCost = calcProviderCost('AWS', AWS_INSTANCES, spec, 'aws', 'aws');
  const gcpCost = calcProviderCost('GCP', GCP_INSTANCES, spec, 'gcp', 'gcp');
  const azureCost = calcProviderCost('Azure', AZURE_INSTANCES, spec, 'azure', 'azure');

  return { providers: [awsCost, gcpCost, azureCost], spec, warnings };
}

function fmt(n: number): string {
  return '$' + n.toFixed(2);
}

export function formatCostEstimate(estimate: CostEstimate): string {
  const { providers, spec, warnings } = estimate;
  const lines: string[] = [];

  lines.push('=== Workload Parsed ===');
  lines.push('  vCPU:     ' + spec.vcpu);
  lines.push('  RAM:      ' + spec.ramGib + ' GiB');
  lines.push('  Storage:  ' + spec.storageSsdGb + ' GB SSD');
  lines.push('  Transfer: ' + spec.transferGb + ' GB/month');
  lines.push('  Count:    ' + spec.instances + ' instance(s)');

  if (warnings.length > 0) {
    lines.push('');
    lines.push('=== Warnings ===');
    for (const w of warnings) {
      lines.push('  ⚠ ' + w);
    }
  }

  lines.push('');
  lines.push('=== Monthly Cost Estimates (USD) ===');
  lines.push('');

  for (const p of providers) {
    lines.push('--- ' + p.provider + ' (' + p.instanceType + ') ---');
    lines.push('  Compute:  ' + fmt(p.compute) + '/mo');
    lines.push('  Storage:  ' + fmt(p.storage) + '/mo');
    lines.push('  Transfer: ' + fmt(p.transfer) + '/mo');
    lines.push('  TOTAL:    ' + fmt(p.total) + '/mo');
    if (p.notes.length > 0) {
      for (const note of p.notes) {
        lines.push('  Note: ' + note);
      }
    }
    lines.push('');
  }

  lines.push('=== Summary ===');
  const sorted = providers.slice().sort(function(a, b) { return a.total - b.total; });
  for (let i = 0; i < sorted.length; i++) {
    const rank = i === 0 ? ' (cheapest)' : '';
    lines.push('  ' + (i + 1) + '. ' + sorted[i].provider + ': ' + fmt(sorted[i].total) + '/mo' + rank);
  }

  lines.push('');
  lines.push('* Estimates based on public list prices (~2024). Actual costs vary.');
  lines.push('* Savings plans / committed use can reduce compute by 30-60%.');

  return lines.join('\n');
}

export const CLOUD_COST_EXAMPLE = '2 vCPU 4GB RAM web server, 100GB SSD, 1TB transfer/month, 2 instances';
