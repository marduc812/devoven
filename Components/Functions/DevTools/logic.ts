// ── Bitwise Calculator ────────────────────────────────────────────────────────

export type BitwiseOp = 'AND' | 'OR' | 'XOR' | 'NOT' | 'NAND' | 'NOR' | 'LSHIFT' | 'RSHIFT';

export function parseAnyBase(s: string): number {
  s = s.trim();
  if (s.startsWith('0x') || s.startsWith('0X')) return parseInt(s, 16);
  if (s.startsWith('0b') || s.startsWith('0B')) return parseInt(s.slice(2), 2);
  if (/^[01]+$/.test(s) && s.length >= 4) return parseInt(s, 2); // bare binary
  const n = parseInt(s, 10);
  if (isNaN(n)) throw new Error(`Cannot parse "${s}" as a number`);
  return n;
}

export function bitwiseOp(aStr: string, bStr: string, op: BitwiseOp): {decimal: string; hex: string; binary: string} {
  const a = parseAnyBase(aStr);
  const b = bStr.trim() ? parseAnyBase(bStr) : 0;
  let result: number;
  switch (op) {
    case 'AND': result = (a & b) >>> 0; break;
    case 'OR':  result = (a | b) >>> 0; break;
    case 'XOR': result = (a ^ b) >>> 0; break;
    case 'NOT': result = (~a) >>> 0; break;
    case 'NAND': result = (~(a & b)) >>> 0; break;
    case 'NOR':  result = (~(a | b)) >>> 0; break;
    case 'LSHIFT': result = (a << b) >>> 0; break;
    case 'RSHIFT': result = (a >>> b); break;
    default: throw new Error('Unknown operation');
  }
  return {
    decimal: result.toString(10),
    hex: '0x' + result.toString(16).toUpperCase(),
    binary: result.toString(2),
  };
}

// ── chmod Calculator ──────────────────────────────────────────────────────────

export type PermSet = {read: boolean; write: boolean; execute: boolean};
export type Permissions = {owner: PermSet; group: PermSet; other: PermSet};

export function permissionsToOctal(p: Permissions): string {
  const toDigit = (s: PermSet) => ((s.read?4:0) + (s.write?2:0) + (s.execute?1:0));
  return `${toDigit(p.owner)}${toDigit(p.group)}${toDigit(p.other)}`;
}

export function permissionsToSymbolic(p: Permissions): string {
  const sym = (s: PermSet) => (s.read?'r':'-') + (s.write?'w':'-') + (s.execute?'x':'-');
  return sym(p.owner) + sym(p.group) + sym(p.other);
}

export function octalToPermissions(octal: string): Permissions {
  if (!/^[0-7]{3}$/.test(octal)) throw new Error('Must be 3 octal digits (e.g. 755)');
  const parse = (d: number): PermSet => ({read: !!(d&4), write: !!(d&2), execute: !!(d&1)});
  return {
    owner: parse(parseInt(octal[0])),
    group: parse(parseInt(octal[1])),
    other: parse(parseInt(octal[2])),
  };
}

export function chmodCommand(octal: string, path: string = 'file'): string {
  return `chmod ${octal} ${path}`;
}

// ── Statistics Calculator ─────────────────────────────────────────────────────

export function parseNumbers(input: string): number[] {
  if (!input.trim()) return [];
  return input
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => {
      const n = parseFloat(s);
      if (isNaN(n)) throw new Error(`"${s}" is not a number`);
      return n;
    });
}

export function calcMean(nums: number[]): number {
  if (nums.length === 0) throw new Error('No numbers');
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function calcMedian(nums: number[]): number {
  if (nums.length === 0) throw new Error('No numbers');
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function calcMode(nums: number[]): number[] {
  if (nums.length === 0) return [];
  const freq: Record<string, number> = {};
  for (const n of nums) freq[n] = (freq[n] || 0) + 1;
  const maxFreq = Math.max(...Object.values(freq));
  if (maxFreq === 1) return []; // no mode
  return Object.entries(freq).filter(([, f]) => f === maxFreq).map(([n]) => parseFloat(n));
}

export function calcStdDev(nums: number[], population = false): number {
  if (nums.length < 2) throw new Error('Need at least 2 numbers');
  const mean = calcMean(nums);
  const variance = nums.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / (population ? nums.length : nums.length - 1);
  return Math.sqrt(variance);
}

export function calcStats(input: string): {
  count: number; sum: number; mean: number; median: number;
  mode: number[]; stdDev: number; min: number; max: number; range: number;
} {
  const nums = parseNumbers(input);
  if (nums.length === 0) throw new Error('No numbers provided');
  return {
    count: nums.length,
    sum: nums.reduce((a, b) => a + b, 0),
    mean: calcMean(nums),
    median: calcMedian(nums),
    mode: calcMode(nums),
    stdDev: nums.length >= 2 ? calcStdDev(nums) : NaN,
    min: Math.min(...nums),
    max: Math.max(...nums),
    range: Math.max(...nums) - Math.min(...nums),
  };
}

// ── .gitignore Generator ──────────────────────────────────────────────────────

export const GITIGNORE_TEMPLATES: Record<string, string> = {
  'Node.js': `# Node.js\nnode_modules/\nnpm-debug.log*\nyarn-debug.log*\nyarn-error.log*\n.npm\n.env\n.env.local\n.env.*.local\ndist/\nbuild/`,
  'Python': `# Python\n__pycache__/\n*.py[cod]\n*$py.class\n*.egg\n*.egg-info/\ndist/\nbuild/\n.eggs/\n.env\nvenv/\nenv/\n.venv/`,
  'Java': `# Java\n*.class\n*.jar\n*.war\n*.ear\n*.nar\ntarget/\n.mvn/\n*.iml`,
  'Go': `# Go\n*.exe\n*.exe~\n*.dll\n*.so\n*.dylib\n*.test\n*.out\ngo.sum`,
  'Rust': `# Rust\ntarget/\nCargo.lock`,
  'C/C++': `# C/C++\n*.o\n*.obj\n*.exe\n*.out\n*.a\n*.lib\n*.so\n*.dll\nbuild/`,
  'React': `# React\nbuild/\n.env\n.env.local\n.env.development.local\n.env.test.local\n.env.production.local`,
  'Next.js': `# Next.js\n.next/\nout/\nbuild/\n.env*.local`,
  'Vue': `# Vue\ndist/\nnode_modules/\n.env\n.env.local`,
  'macOS': `# macOS\n.DS_Store\n.AppleDouble\n.LSOverride\n._*\n.Spotlight-V100\n.Trashes`,
  'Windows': `# Windows\nThumbs.db\nehthumbs.db\nDesktop.ini\n$RECYCLE.BIN/\n*.lnk`,
  'Linux': `# Linux\n*~\n.fuse_hidden*\n.directory\n.Trash-*`,
  'VS Code': `# VS Code\n.vscode/\n*.code-workspace\n.history/`,
  'JetBrains': `# JetBrains\n.idea/\n*.iws\n*.iml\n*.ipr\nout/`,
  'Vim': `# Vim\n*.swp\n*.swo\n*~\n.netrwhist`,
  'Docker': `# Docker\n.dockerignore\ndocker-compose.override.yml`,
  'Terraform': `# Terraform\n.terraform/\n*.tfstate\n*.tfstate.*\ncrash.log\noverride.tf\noverride.tf.json`,
  'Logs': `# Logs\nlogs/\n*.log\nnpm-debug.log*`,
  'Archives': `# Archives\n*.zip\n*.tar\n*.tar.gz\n*.tgz\n*.rar`,
};

export function generateGitignore(selected: string[]): string {
  if (selected.length === 0) return '';
  const sections = selected.map(name => GITIGNORE_TEMPLATES[name] ?? `# ${name}`);
  return sections.join('\n\n') + '\n';
}

export function listGitignoreTemplates(): string[] {
  return Object.keys(GITIGNORE_TEMPLATES);
}

// ── Password Strength Checker ─────────────────────────────────────────────────

export type PasswordAnalysis = {
  score: 0 | 1 | 2 | 3 | 4;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasDigits: boolean;
  hasSymbols: boolean;
  hasRepeats: boolean;
  hasCommonPatterns: boolean;
  entropy: number;
  suggestions: string[];
};

export function analyzePassword(password: string): PasswordAnalysis {
  if (!password) return {
    score: 0, label: 'Very Weak', length: 0,
    hasUppercase: false, hasLowercase: false, hasDigits: false, hasSymbols: false,
    hasRepeats: false, hasCommonPatterns: false, entropy: 0, suggestions: ['Enter a password'],
  };

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  const hasRepeats = /(.)\1{2,}/.test(password);
  const commonPatterns = ['password','123456','qwerty','abc','letmein','admin','login','welcome','monkey','dragon'];
  const hasCommonPatterns = commonPatterns.some(p => password.toLowerCase().includes(p));

  // Entropy calculation
  let charsetSize = 0;
  if (hasLowercase) charsetSize += 26;
  if (hasUppercase) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSymbols) charsetSize += 32;
  const entropy = charsetSize > 0 ? Math.log2(Math.pow(charsetSize, password.length)) : 0;

  // Score
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if ((hasUppercase ? 1 : 0) + (hasLowercase ? 1 : 0) + (hasDigits ? 1 : 0) + (hasSymbols ? 1 : 0) >= 3) score++;
  if (entropy >= 60) score++;
  if (hasRepeats || hasCommonPatterns) score = Math.max(0, score - 1);

  const labels: PasswordAnalysis['label'][] = ['Very Weak','Weak','Fair','Strong','Very Strong'];

  const suggestions: string[] = [];
  if (password.length < 12) suggestions.push('Use at least 12 characters');
  if (!hasUppercase) suggestions.push('Add uppercase letters');
  if (!hasLowercase) suggestions.push('Add lowercase letters');
  if (!hasDigits) suggestions.push('Add numbers');
  if (!hasSymbols) suggestions.push('Add symbols (!, @, #, ...)');
  if (hasRepeats) suggestions.push('Avoid repeated characters');
  if (hasCommonPatterns) suggestions.push('Avoid common words/patterns');

  return {
    score: Math.min(4, score) as 0|1|2|3|4,
    label: labels[Math.min(4, score)],
    length: password.length, hasUppercase, hasLowercase, hasDigits, hasSymbols,
    hasRepeats, hasCommonPatterns, entropy: Math.round(entropy),
    suggestions,
  };
}

// ── cURL to Fetch ─────────────────────────────────────────────────────────────

export function curlToFetch(curlCmd: string): string {
  if (!curlCmd.trim()) return '';

  let cmd = curlCmd.trim().replace(/\\\n/g, ' ').replace(/\s+/g, ' ');
  if (!cmd.startsWith('curl ')) throw new Error('Input must start with "curl "');

  // Extract URL
  const urlMatch = cmd.match(/curl\s+(?:[^-\s][^\s]*|'[^']*'|"[^"]*")/);
  if (!urlMatch) throw new Error('Could not find URL in curl command');
  let url = urlMatch[0].replace(/^curl\s+/, '').replace(/^['"]|['"]$/g, '');

  const method = /-X\s+(\w+)/.exec(cmd)?.[1] ?? (/-d\s/.test(cmd) ? 'POST' : 'GET');

  // Extract headers
  const headers: Record<string, string> = {};
  const headerRe = /-H\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = headerRe.exec(cmd)) !== null) {
    const [key, ...rest] = m[1].split(':');
    headers[key.trim()] = rest.join(':').trim();
  }

  // Extract body
  const bodyMatch = /-d\s+['"]([^'"]*)['"]/s.exec(cmd) ?? /--data\s+['"]([^'"]*)['"]/s.exec(cmd);
  const body = bodyMatch?.[1];

  const opts: string[] = [];
  if (method !== 'GET') opts.push(`  method: '${method}'`);
  if (Object.keys(headers).length > 0) {
    opts.push(`  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')}`);
  }
  if (body) opts.push(`  body: ${JSON.stringify(body)}`);

  const optStr = opts.length > 0 ? `, {\n${opts.join(',\n')}\n}` : '';
  return `fetch('${url}'${optStr});\n`;
}

// ── Text Statistics ───────────────────────────────────────────────────────────

export function getWordFrequency(text: string): {word: string; count: number}[] {
  if (!text.trim()) return [];
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const freq: Record<string, number> = {};
  for (const w of words) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

export function estimateReadingTime(text: string, wpm = 200): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = words / wpm;
  if (minutes < 1) return `< 1 minute (${words} words)`;
  return `~${Math.round(minutes)} minute${Math.round(minutes) === 1 ? '' : 's'} (${words} words)`;
}

export function fleschReadingEase(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (sentences === 0 || words === 0) return 0;
  // Count syllables (rough estimate)
  const syllables = text.toLowerCase().match(/[aeiouy]+/g)?.length ?? 0;
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}

export function fleschLabel(score: number): string {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Confusing';
}
