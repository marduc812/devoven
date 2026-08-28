export type PolicyRule = {
  id: string;
  label: string;
  check: (pwd: string) => boolean;
};

export const DEFAULT_RULES: PolicyRule[] = [
  { id: 'length8', label: 'At least 8 characters', check: p => p.length >= 8 },
  { id: 'length12', label: 'At least 12 characters', check: p => p.length >= 12 },
  { id: 'upper', label: 'Contains uppercase (A-Z)', check: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Contains lowercase (a-z)', check: p => /[a-z]/.test(p) },
  { id: 'digit', label: 'Contains digit (0-9)', check: p => /[0-9]/.test(p) },
  { id: 'special', label: 'Contains special character (!@#$%...)', check: p => /[^a-zA-Z0-9]/.test(p) },
  { id: 'no_space', label: 'No spaces', check: p => !/\s/.test(p) },
  { id: 'no_repeat', label: 'No repeated characters (3+ in a row)', check: p => !/(.)(\1){2}/.test(p) },
  { id: 'no_sequential', label: 'No sequential digits (123, 987)', check: p => !/012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210/.test(p) },
];

export type PolicyResult = {
  password: string;
  passed: string[];
  failed: string[];
  score: number;
  strength: string;
};

export function checkPolicy(password: string): PolicyResult {
  const passed: string[] = [];
  const failed: string[] = [];

  for (const rule of DEFAULT_RULES) {
    if (rule.check(password)) passed.push(rule.label);
    else failed.push(rule.label);
  }

  const score = Math.round((passed.length / DEFAULT_RULES.length) * 100);
  const strength = score >= 90 ? 'Very Strong' : score >= 70 ? 'Strong' : score >= 50 ? 'Moderate' : score >= 30 ? 'Weak' : 'Very Weak';

  return { password, passed, failed, score, strength };
}
