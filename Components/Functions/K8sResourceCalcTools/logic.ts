// ── Kubernetes Resource Calculator ─────────────────────────────────────────────

export interface K8sResourceInput {
  cpuRequest: string;
  cpuLimit: string;
  memRequest: string;
  memLimit: string;
}

export interface K8sResourceResult {
  cpuRequestMillicores: number;
  cpuRequestCores: number;
  cpuLimitMillicores: number;
  cpuLimitCores: number;
  memRequestMiB: number;
  memRequestGiB: number;
  memLimitMiB: number;
  memLimitGiB: number;
  qosClass: 'Guaranteed' | 'Burstable' | 'BestEffort';
  valid: boolean;
  errors: string[];
  nodeEstimate: string;
}

/**
 * Parse CPU value to millicores.
 * Accepts: "100m", "0.5", "1", "2.5"
 */
export function parseCpu(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  if (trimmed.endsWith('m')) {
    const n = parseFloat(trimmed.slice(0, -1));
    if (isNaN(n)) throw new Error('Invalid CPU value: ' + value);
    return Math.round(n);
  }
  const n = parseFloat(trimmed);
  if (isNaN(n)) throw new Error('Invalid CPU value: ' + value);
  return Math.round(n * 1000);
}

/**
 * Parse memory value to MiB.
 * Accepts: "512Mi", "1Gi", "500M", "1G", "1024Ki", "128"
 */
export function parseMemory(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;

  const units: Array<[string, number]> = [
    ['Ki', 1000 / 1024 / 1024],      // 1 KiB = 1024 bytes → in MiB: 1/1024
    ['Mi', 1],                         // 1 MiB = 1 MiB
    ['Gi', 1024],                      // 1 GiB = 1024 MiB
    ['Ti', 1024 * 1024],               // 1 TiB
    ['K', 1000 / 1024 / 1024],        // 1 K = 1000 bytes (decimal)
    ['M', 1000 * 1000 / 1024 / 1024], // 1 M = 1e6 bytes ≈ 0.953674 MiB
    ['G', 1000 * 1000 * 1000 / 1024 / 1024], // 1 G = 1e9 bytes ≈ 953.674 MiB
    ['T', 1000 * 1000 * 1000 * 1000 / 1024 / 1024], // 1 T = 1e12 bytes
  ];

  for (const pair of units) {
    const suffix = pair[0];
    const factor = pair[1];
    if (trimmed.endsWith(suffix)) {
      const n = parseFloat(trimmed.slice(0, -suffix.length));
      if (isNaN(n)) throw new Error('Invalid memory value: ' + value);
      return n * factor;
    }
  }

  // Plain bytes
  const n = parseFloat(trimmed);
  if (isNaN(n)) throw new Error('Invalid memory value: ' + value);
  return n / (1024 * 1024);
}

export function determineQosClass(input: K8sResourceInput): 'Guaranteed' | 'Burstable' | 'BestEffort' {
  const hasCpuReq = input.cpuRequest.trim() !== '';
  const hasCpuLim = input.cpuLimit.trim() !== '';
  const hasMemReq = input.memRequest.trim() !== '';
  const hasMemLim = input.memLimit.trim() !== '';

  // BestEffort: no requests or limits at all
  if (!hasCpuReq && !hasCpuLim && !hasMemReq && !hasMemLim) {
    return 'BestEffort';
  }

  // Guaranteed: requests == limits for all resources (and all are set)
  if (hasCpuReq && hasCpuLim && hasMemReq && hasMemLim) {
    try {
      const cpuReqM = parseCpu(input.cpuRequest);
      const cpuLimM = parseCpu(input.cpuLimit);
      const memReqM = parseMemory(input.memRequest);
      const memLimM = parseMemory(input.memLimit);
      if (cpuReqM === cpuLimM && Math.abs(memReqM - memLimM) < 0.001) {
        return 'Guaranteed';
      }
    } catch (_) {
      // fall through to Burstable
    }
  }

  return 'Burstable';
}

export function estimateNodeFit(cpuLimM: number, memLimMiB: number): string {
  // Common node sizes
  const nodes = [
    { name: 't3.micro (2 vCPU / 1 GiB)', cpu: 2000, mem: 1024 },
    { name: 't3.small (2 vCPU / 2 GiB)', cpu: 2000, mem: 2048 },
    { name: 't3.medium (2 vCPU / 4 GiB)', cpu: 2000, mem: 4096 },
    { name: 't3.large (2 vCPU / 8 GiB)', cpu: 2000, mem: 8192 },
    { name: 'm5.large (2 vCPU / 8 GiB)', cpu: 2000, mem: 8192 },
    { name: 'm5.xlarge (4 vCPU / 16 GiB)', cpu: 4000, mem: 16384 },
    { name: 'm5.2xlarge (8 vCPU / 32 GiB)', cpu: 8000, mem: 32768 },
    { name: 'm5.4xlarge (16 vCPU / 64 GiB)', cpu: 16000, mem: 65536 },
  ];

  const useCpu = cpuLimM > 0 ? cpuLimM : 100;
  const useMem = memLimMiB > 0 ? memLimMiB : 128;

  const results: string[] = [];
  for (const node of nodes) {
    const byCpu = Math.floor(node.cpu / useCpu);
    const byMem = Math.floor(node.mem / useMem);
    const fit = Math.min(byCpu, byMem);
    if (fit > 0) {
      results.push(node.name + ' → fits ' + fit + ' replica(s)');
    }
  }

  return results.length > 0 ? results.join('\n') : 'No standard node fits these resource limits';
}

export function calcK8sResources(input: K8sResourceInput): K8sResourceResult {
  const errors: string[] = [];
  let cpuReqM = 0;
  let cpuLimM = 0;
  let memReqMiB = 0;
  let memLimMiB = 0;

  try {
    if (input.cpuRequest.trim()) cpuReqM = parseCpu(input.cpuRequest);
  } catch (e: any) { errors.push('CPU Request: ' + e.message); }

  try {
    if (input.cpuLimit.trim()) cpuLimM = parseCpu(input.cpuLimit);
  } catch (e: any) { errors.push('CPU Limit: ' + e.message); }

  try {
    if (input.memRequest.trim()) memReqMiB = parseMemory(input.memRequest);
  } catch (e: any) { errors.push('Memory Request: ' + e.message); }

  try {
    if (input.memLimit.trim()) memLimMiB = parseMemory(input.memLimit);
  } catch (e: any) { errors.push('Memory Limit: ' + e.message); }

  // Validate requests <= limits
  if (cpuReqM > 0 && cpuLimM > 0 && cpuReqM > cpuLimM) {
    errors.push('CPU request (' + cpuReqM + 'm) exceeds CPU limit (' + cpuLimM + 'm)');
  }
  if (memReqMiB > 0 && memLimMiB > 0 && memReqMiB > memLimMiB) {
    errors.push('Memory request (' + memReqMiB.toFixed(1) + ' MiB) exceeds memory limit (' + memLimMiB.toFixed(1) + ' MiB)');
  }

  const qosClass = determineQosClass(input);
  const nodeEstimate = estimateNodeFit(cpuLimM, memLimMiB);

  return {
    cpuRequestMillicores: cpuReqM,
    cpuRequestCores: cpuReqM / 1000,
    cpuLimitMillicores: cpuLimM,
    cpuLimitCores: cpuLimM / 1000,
    memRequestMiB: memReqMiB,
    memRequestGiB: memReqMiB / 1024,
    memLimitMiB: memLimMiB,
    memLimitGiB: memLimMiB / 1024,
    qosClass,
    valid: errors.length === 0,
    errors,
    nodeEstimate,
  };
}

export function formatK8sResult(result: K8sResourceResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push('=== VALIDATION ERRORS ===');
    for (const err of result.errors) {
      lines.push('  ERROR: ' + err);
    }
    lines.push('');
  }

  lines.push('=== CPU ===');
  lines.push('  Request: ' + result.cpuRequestMillicores + 'm  (' + result.cpuRequestCores.toFixed(3) + ' cores)');
  lines.push('  Limit:   ' + result.cpuLimitMillicores + 'm  (' + result.cpuLimitCores.toFixed(3) + ' cores)');
  lines.push('');
  lines.push('=== Memory ===');
  lines.push('  Request: ' + result.memRequestMiB.toFixed(2) + ' MiB  (' + result.memRequestGiB.toFixed(3) + ' GiB)');
  lines.push('  Limit:   ' + result.memLimitMiB.toFixed(2) + ' MiB  (' + result.memLimitGiB.toFixed(3) + ' GiB)');
  lines.push('');
  lines.push('=== QoS Class ===');
  lines.push('  ' + result.qosClass);
  const qosExplain: Record<string, string> = {
    Guaranteed: '  (requests == limits for all resources)',
    Burstable: '  (requests < limits, or partial spec)',
    BestEffort: '  (no requests or limits set)',
  };
  lines.push(qosExplain[result.qosClass] || '');
  lines.push('');
  lines.push('=== Node Fit Estimate (by limit) ===');
  lines.push(result.nodeEstimate);

  return lines.join('\n');
}

export function parseK8sResourceInput(input: string): K8sResourceInput {
  const res: K8sResourceInput = { cpuRequest: '', cpuLimit: '', memRequest: '', memLimit: '' };
  for (const line of input.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim().toLowerCase().replace(/-/g, '_');
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key === 'cpu_request' || key === 'cpu request') res.cpuRequest = val;
    else if (key === 'cpu_limit' || key === 'cpu limit') res.cpuLimit = val;
    else if (key === 'mem_request' || key === 'memory_request' || key === 'mem request') res.memRequest = val;
    else if (key === 'mem_limit' || key === 'memory_limit' || key === 'mem limit') res.memLimit = val;
  }
  return res;
}

export const K8S_RESOURCE_EXAMPLE = `cpu_request=250m
cpu_limit=1
mem_request=512Mi
mem_limit=1Gi`;
