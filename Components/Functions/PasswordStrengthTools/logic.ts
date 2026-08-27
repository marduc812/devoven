// Pure TypeScript — no browser APIs, no React.
// Password strength analysis: entropy, crack time, score, dictionary & pattern checks.

export type PasswordAnalysis = {
  length: number;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSymbol: boolean;
  charsetSize: number;
  entropy: number;
  score: 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  crackTimes: CrackTime[];
  warnings: string[];
};

export type CrackTime = {
  label: string;
  guessesPerSecond: number;
  time: string;
};

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return 'never (centuries)';
  if (seconds < 1) return 'less than a second';
  if (seconds < 60) return Math.round(seconds) + ' seconds';
  if (seconds < 3600) return Math.round(seconds / 60) + ' minutes';
  if (seconds < 86400) return Math.round(seconds / 3600) + ' hours';
  if (seconds < 2592000) return Math.round(seconds / 86400) + ' days';
  if (seconds < 31536000) return Math.round(seconds / 2592000) + ' months';
  if (seconds < 31536000 * 1000) return Math.round(seconds / 31536000) + ' years';
  return 'centuries';
}

const ATTACK_SCENARIOS: Array<{ label: string; guessesPerSecond: number }> = [
  { label: 'Online attack (throttled, 100/hr)', guessesPerSecond: 100 / 3600 },
  { label: 'Online attack (unthrottled, 10/s)', guessesPerSecond: 10 },
  { label: 'Offline slow hash (bcrypt, 10k/s)', guessesPerSecond: 10000 },
  { label: 'Offline fast hash (MD5, 10B/s)', guessesPerSecond: 10000000000 },
];

// --- Common passwords & fragments ---
// Top common passwords + common base words used in password construction
const COMMON_PASSWORDS = new Set([
  'password', 'pass', 'passw0rd', 'p@ssword', 'p@ss', 'p@ssw0rd',
  '123456', '1234567', '12345678', '123456789', '1234567890', '1234', '123',
  'qwerty', 'qwertyuiop', 'qwerty123', 'qwert', 'asdf', 'asdfgh', 'zxcvbn',
  'abc123', 'abcdef', 'abcd1234',
  'letmein', 'welcome', 'monkey', 'dragon', 'master', 'login', 'admin',
  'princess', 'football', 'shadow', 'sunshine', 'trustno1', 'iloveyou',
  'batman', 'access', 'hello', 'charlie', 'donald', 'baseball', 'soccer',
  'michael', 'jordan', 'superman', 'hunter', 'ranger', 'buster', 'thomas',
  'robert', 'soccer', 'hockey', 'killer', 'george', 'andrew', 'andrea',
  'joshua', 'daniel', 'jessica', 'jennifer', 'amanda', 'ashley', 'nicole',
  'summer', 'winter', 'spring', 'autumn', 'secret', 'flower', 'computer',
  'internet', 'server', 'test', 'guest', 'user', 'root', 'toor',
  'changeme', 'default', 'temp', 'mysql', 'oracle', 'sysadmin',
  'love', 'god', 'sex', 'fuck', 'shit', 'damn',
  'irockyou', 'rockyou', 'rock',
  'starwars', 'star', 'wars',
  'whatever', 'nothing', 'freedom', 'forever', 'money', 'pepper',
  'ginger', 'cookie', 'cheese', 'butter', 'coffee', 'chocolate',
  'matrix', 'mustang', 'ferrari', 'corvette', 'mercedes',
  'yankees', 'lakers', 'eagles', 'cowboys', 'steelers', 'packers',
  'samsung', 'apple', 'google',
]);

// Common fragments that attackers combine
const COMMON_FRAGMENTS = [
  'pass', 'p@ss', 'p@$$', 'word', 'w0rd',
  '123', '1234', '12345', '123456', '1234567', '12345678',
  '000', '111', '222', '333', '444', '555', '666', '777', '888', '999',
  '0000', '1111',
  'abc', 'abcd', 'abcde', 'qwer', 'qwerty', 'asdf',
  'admin', 'root', 'user', 'test', 'guest', 'login',
  'love', 'god', 'rock', 'cool', 'super', 'star',
  'hello', 'welcome',
];

// Leet speak mappings for normalization
const LEET_MAP: Record<string, string> = {
  '@': 'a', '4': 'a',
  '3': 'e',
  '1': 'i', '!': 'i',
  '0': 'o',
  '$': 's', '5': 's',
  '7': 't',
  '2': 'z',
};

function unleet(str: string): string {
  return str.split('').map(c => LEET_MAP[c] || c).join('');
}

// --- Pattern detection ---

function hasSequentialChars(password: string, minRun: number): boolean {
  let ascending = 1;
  let descending = 1;
  for (let i = 1; i < password.length; i++) {
    const diff = password.charCodeAt(i) - password.charCodeAt(i - 1);
    if (diff === 1) { ascending++; if (ascending >= minRun) return true; } else { ascending = 1; }
    if (diff === -1) { descending++; if (descending >= minRun) return true; } else { descending = 1; }
  }
  return false;
}

function hasRepeatedChars(password: string, minRun: number): boolean {
  let run = 1;
  for (let i = 1; i < password.length; i++) {
    if (password[i] === password[i - 1]) { run++; if (run >= minRun) return true; } else { run = 1; }
  }
  return false;
}

const KEYBOARD_ROWS = [
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1234567890',
];

function hasKeyboardWalk(password: string, minRun: number): boolean {
  const lower = password.toLowerCase();
  for (const row of KEYBOARD_ROWS) {
    for (let start = 0; start <= row.length - minRun; start++) {
      const slice = row.substring(start, start + minRun);
      if (lower.includes(slice)) return true;
      const reversed = slice.split('').reverse().join('');
      if (lower.includes(reversed)) return true;
    }
  }
  return false;
}

function isCommonDate(password: string): boolean {
  // Matches patterns like 1990, 2024, 01/01, 1234, etc.
  return /^(19|20)\d{2}$/.test(password) || /^\d{2}[\/\-]\d{2}([\/\-]\d{2,4})?$/.test(password);
}

// --- Fragment decomposition ---
/**
 * Longest password the fragment split is run on.
 *
 * The three-way split is cubic in the length: it walks every pair of split
 * points and copies three substrings at each. That is nothing at the length of
 * a password someone types, and it locks the tab up at a few thousand
 * characters - which `?from=` puts on screen with no interaction. Nothing above
 * this length decomposes into common fragments anyway.
 */
const MAX_DECOMPOSE_LENGTH = 64;

// Check if password can be split into two known weak fragments
function isComposedOfWeakParts(password: string): { found: boolean; parts: string[] } {
  const lower = password.toLowerCase();
  const normalized = unleet(lower);

  // Try both the original lowercase and the leet-decoded version
  for (const variant of [lower, normalized]) {
    for (let splitPos = 2; splitPos <= variant.length - 2; splitPos++) {
      const left = variant.substring(0, splitPos);
      const right = variant.substring(splitPos);

      const leftWeak = COMMON_FRAGMENTS.includes(left) || COMMON_PASSWORDS.has(left) ||
                       /^\d+$/.test(left) || isCommonDate(left);
      const rightWeak = COMMON_FRAGMENTS.includes(right) || COMMON_PASSWORDS.has(right) ||
                        /^\d+$/.test(right) || isCommonDate(right);

      if (leftWeak && rightWeak) {
        return { found: true, parts: [left, right] };
      }
    }

    // Also try 3-way split for things like "P@ss!123!"
    for (let i = 2; i <= variant.length - 4; i++) {
      for (let j = i + 2; j <= variant.length - 2; j++) {
        const p1 = variant.substring(0, i);
        const p2 = variant.substring(i, j);
        const p3 = variant.substring(j);
        const w1 = COMMON_FRAGMENTS.includes(p1) || COMMON_PASSWORDS.has(p1) || /^\d+$/.test(p1);
        const w2 = COMMON_FRAGMENTS.includes(p2) || COMMON_PASSWORDS.has(p2) || /^\d+$/.test(p2);
        const w3 = COMMON_FRAGMENTS.includes(p3) || COMMON_PASSWORDS.has(p3) || /^\d+$/.test(p3);
        if (w1 && w2 && w3) {
          return { found: true, parts: [p1, p2, p3] };
        }
      }
    }
  }
  return { found: false, parts: [] };
}

// --- Main analysis ---

export function analyzePassword(password: string): PasswordAnalysis | null {
  if (!password) return null;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasDigit) charsetSize += 10;
  if (hasSymbol) charsetSize += 32;
  if (charsetSize === 0) charsetSize = 1;

  const entropy = password.length * Math.log2(charsetSize);

  // Base score from entropy
  let score: PasswordAnalysis['score'];
  if (entropy < 28) score = 'Weak';
  else if (entropy < 50) score = 'Fair';
  else if (entropy < 70) score = 'Strong';
  else score = 'Very Strong';

  const warnings: string[] = [];
  const lower = password.toLowerCase();
  const normalized = unleet(lower);

  // Check exact common password match (with and without leet)
  if (COMMON_PASSWORDS.has(lower) || COMMON_PASSWORDS.has(normalized)) {
    score = 'Weak';
    warnings.push('This is a commonly used password');
  }

  // Check if it's a common password with trivial suffix/prefix (e.g. password1, 1password, password!, password123)
  if (score !== 'Weak') {
    for (const cp of COMMON_PASSWORDS) {
      if (lower.length <= cp.length + 4) {
        if (lower.startsWith(cp) || lower.endsWith(cp) || normalized.startsWith(cp) || normalized.endsWith(cp)) {
          score = 'Weak';
          warnings.push(`Based on common password "${cp}" with trivial additions`);
          break;
        }
      }
    }
  }

  // Check fragment decomposition (e.g. P@ss + 1234)
  if (score !== 'Weak' && password.length <= MAX_DECOMPOSE_LENGTH) {
    const composed = isComposedOfWeakParts(password);
    if (composed.found) {
      score = 'Weak';
      warnings.push(`Composed of common fragments: "${composed.parts.join('" + "')}"`);
    }
  }

  // Sequential characters (abc, 123, cba)
  if (hasSequentialChars(password, 4)) {
    if (score === 'Strong' || score === 'Very Strong') score = 'Fair';
    warnings.push('Contains sequential characters');
  }

  // Repeated characters (aaa, 111)
  if (hasRepeatedChars(password, 3)) {
    if (score === 'Strong' || score === 'Very Strong') score = 'Fair';
    warnings.push('Contains repeated characters');
  }

  // Keyboard walks (qwerty, asdf)
  if (hasKeyboardWalk(password, 4)) {
    if (score === 'Strong' || score === 'Very Strong') score = 'Fair';
    warnings.push('Contains a keyboard pattern');
  }

  // All same case or all digits
  if (/^\d+$/.test(password)) {
    score = 'Weak';
    warnings.push('Digits only — trivially crackable');
  }

  if (/^[a-zA-Z]+$/.test(password) && password.length < 12) {
    if (score === 'Strong' || score === 'Very Strong') score = 'Fair';
    warnings.push('Letters only — consider adding digits or symbols');
  }

  // Short passwords
  if (password.length < 8) {
    if (score !== 'Weak') score = 'Weak';
    warnings.push('Too short (minimum 8 characters recommended)');
  }

  // Combinations = charsetSize^length, half on average
  const combinations = Math.pow(charsetSize, password.length) / 2;

  const crackTimes: CrackTime[] = ATTACK_SCENARIOS.map((scenario) => ({
    label: scenario.label,
    guessesPerSecond: scenario.guessesPerSecond,
    time: formatTime(combinations / scenario.guessesPerSecond),
  }));

  return {
    length: password.length,
    hasLower,
    hasUpper,
    hasDigit,
    hasSymbol,
    charsetSize,
    entropy: Math.round(entropy * 10) / 10,
    score,
    crackTimes,
    warnings,
  };
}
