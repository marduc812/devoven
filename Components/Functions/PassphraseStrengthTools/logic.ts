export type PolicyCompliance = {
  name: string;
  description: string;
  met: boolean;
  requirements: string[];
  failedRequirements: string[];
};

export type CrackEstimate = {
  attackSpeed: string;
  guessesPerSec: number;
  timeToCrack: string;
};

export type PassphraseResult = {
  password: string;
  length: number;
  charsetSize: number;
  entropy: number;
  strength: string;
  strengthScore: number; // 0-100
  policies: PolicyCompliance[];
  crackTimes: CrackEstimate[];
  suggestions: string[];
};

function calcCharsetSize(pwd: string): number {
  let size = 0;
  if (/[a-z]/.test(pwd)) size += 26;
  if (/[A-Z]/.test(pwd)) size += 26;
  if (/[0-9]/.test(pwd)) size += 10;
  if (/[ !\"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]/.test(pwd)) size += 32;
  // Extended ASCII / Unicode
  if (/[^\x00-\x7F]/.test(pwd)) size += 64;
  return size || 1;
}

function calcEntropy(length: number, charsetSize: number): number {
  return length * Math.log2(charsetSize);
}

function formatDuration(seconds: number): string {
  if (seconds < 1) return 'Instantly';
  if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.ceil(minutes)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.ceil(hours)} hours`;
  const days = hours / 24;
  if (days < 365) return `${Math.ceil(days)} days`;
  const years = days / 365;
  if (years < 1000) return `${Math.ceil(years)} years`;
  if (years < 1e6) return `${(years / 1000).toFixed(1)}K years`;
  if (years < 1e9) return `${(years / 1e6).toFixed(1)}M years`;
  if (years < 1e12) return `${(years / 1e9).toFixed(1)}B years`;
  if (years < 1e15) return `${(years / 1e12).toFixed(1)}T years`;
  return '> quadrillion years';
}

function estimateCrackTime(entropy: number, guessesPerSec: number): string {
  // Average case: need to search half of keyspace
  const keyspace = Math.pow(2, entropy);
  const seconds = keyspace / 2 / guessesPerSec;
  return formatDuration(seconds);
}

export function evaluatePassphrase(password: string): PassphraseResult {
  const length = password.length;
  const charsetSize = calcCharsetSize(password);
  const entropy = calcEntropy(length, charsetSize);

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};:'",.<>?\/\\|`~]/.test(password);
  const hasSpace = /\s/.test(password);
  const hasNonAscii = /[^\x00-\x7F]/.test(password);

  const noRepeated = !/(.)(\1){2,}/.test(password);
  const noSequential = !/012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210/.test(password);
  const noCommon = !['password', 'qwerty', '123456', 'letmein', 'abc123', 'iloveyou', 'admin', 'welcome'].some(
    w => password.toLowerCase().includes(w)
  );

  // NIST SP 800-63B: length >= 8, no complexity requirements, check against common
  const nistPassed: string[] = [];
  const nistFailed: string[] = [];
  if (length >= 8) nistPassed.push('Minimum 8 characters'); else nistFailed.push('Minimum 8 characters');
  if (noCommon) nistPassed.push('Not a common/compromised password'); else nistFailed.push('Not a common/compromised password');
  if (length >= 15) nistPassed.push('Recommended 15+ characters for memorized secrets'); else nistFailed.push('Recommended 15+ characters');

  // PCI DSS 4.0: >= 12 chars, upper, lower, digit, special
  const pciPassed: string[] = [];
  const pciFailed: string[] = [];
  if (length >= 12) pciPassed.push('Minimum 12 characters'); else pciFailed.push('Minimum 12 characters');
  if (hasUpper) pciPassed.push('Uppercase letter'); else pciFailed.push('Uppercase letter');
  if (hasLower) pciPassed.push('Lowercase letter'); else pciFailed.push('Lowercase letter');
  if (hasDigit) pciPassed.push('Digit (0-9)'); else pciFailed.push('Digit (0-9)');
  if (hasSpecial) pciPassed.push('Special character'); else pciFailed.push('Special character');
  if (noRepeated) pciPassed.push('No 3+ repeated characters'); else pciFailed.push('No 3+ repeated characters');

  // HIPAA: >= 8 chars, upper, lower, digit or special
  const hipaaPassed: string[] = [];
  const hipaaFailed: string[] = [];
  if (length >= 8) hipaaPassed.push('Minimum 8 characters'); else hipaaFailed.push('Minimum 8 characters');
  if (hasUpper) hipaaPassed.push('Uppercase letter'); else hipaaFailed.push('Uppercase letter');
  if (hasLower) hipaaPassed.push('Lowercase letter'); else hipaaFailed.push('Lowercase letter');
  if (hasDigit || hasSpecial) hipaaPassed.push('Digit or special character'); else hipaaFailed.push('Digit or special character');
  if (noCommon) hipaaPassed.push('Not a dictionary/common word'); else hipaaFailed.push('Not a dictionary/common word');

  // OWASP ASVS L2: >= 12 chars, upper, lower, digit, special, no repeated
  const owaspPassed: string[] = [];
  const owaspFailed: string[] = [];
  if (length >= 12) owaspPassed.push('Minimum 12 characters'); else owaspFailed.push('Minimum 12 characters');
  if (hasUpper) owaspPassed.push('Uppercase letter'); else owaspFailed.push('Uppercase letter');
  if (hasLower) owaspPassed.push('Lowercase letter'); else owaspFailed.push('Lowercase letter');
  if (hasDigit) owaspPassed.push('Digit'); else owaspFailed.push('Digit');
  if (hasSpecial) owaspPassed.push('Special character'); else owaspFailed.push('Special character');
  if (noRepeated) owaspPassed.push('No 3+ consecutive repeats'); else owaspFailed.push('No 3+ consecutive repeats');
  if (noSequential) owaspPassed.push('No sequential numbers'); else owaspFailed.push('No sequential numbers');
  if (noCommon) owaspPassed.push('Not a common password'); else owaspFailed.push('Not a common password');

  const policies: PolicyCompliance[] = [
    {
      name: 'NIST SP 800-63B',
      description: 'Focuses on length over complexity. Checks for compromised passwords.',
      met: nistFailed.length === 0,
      requirements: nistPassed,
      failedRequirements: nistFailed,
    },
    {
      name: 'PCI DSS 4.0',
      description: 'Payment Card Industry: 12 chars, mixed case, digits, special chars.',
      met: pciFailed.length === 0,
      requirements: pciPassed,
      failedRequirements: pciFailed,
    },
    {
      name: 'HIPAA',
      description: 'Healthcare: 8+ chars, mixed case, digit or special character.',
      met: hipaaFailed.length === 0,
      requirements: hipaaPassed,
      failedRequirements: hipaaFailed,
    },
    {
      name: 'OWASP ASVS L2',
      description: 'Application Security: 12+ chars, full complexity, no common patterns.',
      met: owaspFailed.length === 0,
      requirements: owaspPassed,
      failedRequirements: owaspFailed,
    },
  ];

  const crackTimes: CrackEstimate[] = [
    { attackSpeed: 'Online (100/s)', guessesPerSec: 100, timeToCrack: estimateCrackTime(entropy, 100) },
    { attackSpeed: 'Online throttled (10K/s)', guessesPerSec: 10000, timeToCrack: estimateCrackTime(entropy, 10000) },
    { attackSpeed: 'Offline MD5 (10B/s)', guessesPerSec: 1e10, timeToCrack: estimateCrackTime(entropy, 1e10) },
    { attackSpeed: 'Offline bcrypt (100K/s)', guessesPerSec: 100000, timeToCrack: estimateCrackTime(entropy, 100000) },
    { attackSpeed: 'GPU cluster MD5 (100T/s)', guessesPerSec: 1e14, timeToCrack: estimateCrackTime(entropy, 1e14) },
  ];

  // Strength score based on entropy
  let strengthScore = Math.min(100, Math.round(entropy / 128 * 100));
  let strength: string;
  if (entropy < 28) strength = 'Very Weak';
  else if (entropy < 36) strength = 'Weak';
  else if (entropy < 60) strength = 'Moderate';
  else if (entropy < 80) strength = 'Strong';
  else if (entropy < 100) strength = 'Very Strong';
  else strength = 'Exceptional';

  const suggestions: string[] = [];
  if (length < 16) suggestions.push('Increase length to at least 16 characters for better security');
  if (!hasUpper) suggestions.push('Add uppercase letters (A-Z)');
  if (!hasLower) suggestions.push('Add lowercase letters (a-z)');
  if (!hasDigit) suggestions.push('Add digits (0-9)');
  if (!hasSpecial) suggestions.push('Add special characters (!@#$%...)');
  if (!noRepeated) suggestions.push('Avoid 3+ repeated characters (e.g. "aaa")');
  if (!noSequential) suggestions.push('Avoid sequential digit patterns (e.g. "123")');
  if (!noCommon) suggestions.push('Avoid common words like "password" or "admin"');
  if (entropy < 60) suggestions.push('Consider using a longer passphrase with multiple unrelated words');
  if (length >= 20 && entropy >= 80 && suggestions.length === 0) {
    suggestions.push('Excellent passphrase! Consider storing it in a password manager.');
  }

  return {
    password,
    length,
    charsetSize,
    entropy: Math.round(entropy * 10) / 10,
    strength,
    strengthScore,
    policies,
    crackTimes,
    suggestions,
  };
}

export function formatPassphraseResult(result: PassphraseResult): string {
  const lines = [
    `Strength: ${result.strength} (score: ${result.strengthScore}/100)`,
    `Entropy:  ${result.entropy} bits`,
    `Length:   ${result.length} characters`,
    `Charset:  ~${result.charsetSize} symbols`,
    '',
    'Crack time estimates:',
    ...result.crackTimes.map(ct => `  ${ct.attackSpeed.padEnd(30)} → ${ct.timeToCrack}`),
    '',
    'Policy compliance:',
    ...result.policies.map(p => `  ${p.met ? '✓' : '✗'} ${p.name}`),
  ];
  if (result.suggestions.length > 0) {
    lines.push('', 'Suggestions:');
    result.suggestions.forEach(s => lines.push(`  • ${s}`));
  }
  return lines.join('\n');
}
