// CVSS v3.1 Base Score Calculator
// Based on FIRST specification: https://www.first.org/cvss/specification-document

export type AttackVector = 'N' | 'A' | 'L' | 'P';
export type AttackComplexity = 'L' | 'H';
export type PrivilegesRequired = 'N' | 'L' | 'H';
export type UserInteraction = 'N' | 'R';
export type Scope = 'U' | 'C';
export type CIAImpact = 'N' | 'L' | 'H';

export interface CvssMetrics {
  attackVector: AttackVector;
  attackComplexity: AttackComplexity;
  privilegesRequired: PrivilegesRequired;
  userInteraction: UserInteraction;
  scope: Scope;
  confidentiality: CIAImpact;
  integrity: CIAImpact;
  availability: CIAImpact;
}

export interface CvssResult {
  score: number;
  severity: string;
  vectorString: string;
  iss: number;
  impact: number;
  exploitability: number;
}

// CVSS v3.1 metric weights
const AV: Record<AttackVector, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC: Record<AttackComplexity, number> = { L: 0.77, H: 0.44 };
const PR_U: Record<PrivilegesRequired, number> = { N: 0.85, L: 0.62, H: 0.27 };
const PR_C: Record<PrivilegesRequired, number> = { N: 0.85, L: 0.68, H: 0.5 };
const UI: Record<UserInteraction, number> = { N: 0.85, R: 0.62 };
const CIA: Record<CIAImpact, number> = { N: 0, L: 0.22, H: 0.56 };

export function calculateCvss(m: CvssMetrics): CvssResult {
  const avScore = AV[m.attackVector];
  const acScore = AC[m.attackComplexity];
  const prScore = m.scope === 'C' ? PR_C[m.privilegesRequired] : PR_U[m.privilegesRequired];
  const uiScore = UI[m.userInteraction];
  const cScore = CIA[m.confidentiality];
  const iScore = CIA[m.integrity];
  const aScore = CIA[m.availability];

  // ISS (Impact Sub Score)
  const iss = 1 - (1 - cScore) * (1 - iScore) * (1 - aScore);

  let impact: number;
  if (m.scope === 'U') {
    impact = 6.42 * iss;
  } else {
    impact = 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15);
  }

  const exploitability = 8.22 * avScore * acScore * prScore * uiScore;

  let score: number;
  if (impact <= 0) {
    score = 0;
  } else if (m.scope === 'U') {
    score = roundup(Math.min(impact + exploitability, 10));
  } else {
    score = roundup(Math.min(1.08 * (impact + exploitability), 10));
  }

  const vectorString = buildVectorString(m);
  const severity = getSeverity(score);

  return {
    score,
    severity,
    vectorString,
    iss,
    impact,
    exploitability,
  };
}

function roundup(val: number): number {
  const rounded = Math.ceil(val * 10) / 10;
  return Math.round(rounded * 10) / 10;
}

function getSeverity(score: number): string {
  if (score === 0) return 'None';
  if (score < 4.0) return 'Low';
  if (score < 7.0) return 'Medium';
  if (score < 9.0) return 'High';
  return 'Critical';
}

function buildVectorString(m: CvssMetrics): string {
  return [
    'CVSS:3.1',
    `AV:${m.attackVector}`,
    `AC:${m.attackComplexity}`,
    `PR:${m.privilegesRequired}`,
    `UI:${m.userInteraction}`,
    `S:${m.scope}`,
    `C:${m.confidentiality}`,
    `I:${m.integrity}`,
    `A:${m.availability}`,
  ].join('/');
}

export const DEFAULT_METRICS: CvssMetrics = {
  attackVector: 'N',
  attackComplexity: 'L',
  privilegesRequired: 'N',
  userInteraction: 'N',
  scope: 'U',
  confidentiality: 'N',
  integrity: 'N',
  availability: 'N',
};

export const METRIC_LABELS = {
  attackVector: {
    label: 'Attack Vector (AV)',
    options: [
      { value: 'N', label: 'Network', abbr: 'N', description: 'Exploitable remotely over the network' },
      { value: 'A', label: 'Adjacent', abbr: 'A', description: 'Requires access to the local network or Bluetooth' },
      { value: 'L', label: 'Local', abbr: 'L', description: 'Requires local access to the target' },
      { value: 'P', label: 'Physical', abbr: 'P', description: 'Requires physical access to the target' },
    ],
  },
  attackComplexity: {
    label: 'Attack Complexity (AC)',
    options: [
      { value: 'L', label: 'Low', abbr: 'L', description: 'No special conditions required' },
      { value: 'H', label: 'High', abbr: 'H', description: 'Requires specific conditions to exploit' },
    ],
  },
  privilegesRequired: {
    label: 'Privileges Required (PR)',
    options: [
      { value: 'N', label: 'None', abbr: 'N', description: 'No prior authentication needed' },
      { value: 'L', label: 'Low', abbr: 'L', description: 'Basic user privileges needed' },
      { value: 'H', label: 'High', abbr: 'H', description: 'Admin-level privileges needed' },
    ],
  },
  userInteraction: {
    label: 'User Interaction (UI)',
    options: [
      { value: 'N', label: 'None', abbr: 'N', description: 'No user action required' },
      { value: 'R', label: 'Required', abbr: 'R', description: 'A user must take an action' },
    ],
  },
  scope: {
    label: 'Scope (S)',
    options: [
      { value: 'U', label: 'Unchanged', abbr: 'U', description: 'Exploit only impacts the vulnerable component' },
      { value: 'C', label: 'Changed', abbr: 'C', description: 'Exploit can affect other components' },
    ],
  },
  confidentiality: {
    label: 'Confidentiality (C)',
    options: [
      { value: 'N', label: 'None', abbr: 'N', description: 'No confidentiality impact' },
      { value: 'L', label: 'Low', abbr: 'L', description: 'Some information exposure' },
      { value: 'H', label: 'High', abbr: 'H', description: 'All information is disclosed' },
    ],
  },
  integrity: {
    label: 'Integrity (I)',
    options: [
      { value: 'N', label: 'None', abbr: 'N', description: 'No integrity impact' },
      { value: 'L', label: 'Low', abbr: 'L', description: 'Some data can be modified' },
      { value: 'H', label: 'High', abbr: 'H', description: 'Complete data modification possible' },
    ],
  },
  availability: {
    label: 'Availability (A)',
    options: [
      { value: 'N', label: 'None', abbr: 'N', description: 'No availability impact' },
      { value: 'L', label: 'Low', abbr: 'L', description: 'Reduced performance or availability' },
      { value: 'H', label: 'High', abbr: 'H', description: 'Complete loss of availability' },
    ],
  },
};
