export type EmailInfo = {
  valid: boolean;
  email?: string;
  local?: string;
  domain?: string;
  tld?: string;
  isDisposable?: boolean;
  issues?: string[];
};

// Common disposable email domains
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  '10minutemail.com', 'yopmail.com', 'trashmail.com', 'maildrop.cc',
  'dispostable.com', 'fakeinbox.com', 'spam4.me', 'grr.la',
]);

export function validateEmail(input: string): EmailInfo {
  const email = input.trim().toLowerCase();
  const issues: string[] = [];

  if (!email) return { valid: false, issues: ['Email is empty'] };
  if (email.length > 254) issues.push('Email too long (max 254 chars)');

  const atIdx = email.lastIndexOf('@');
  if (atIdx < 0) return { valid: false, issues: ['Missing @ symbol'] };
  if (atIdx === 0) return { valid: false, issues: ['Missing local part before @'] };

  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);

  if (!domain) return { valid: false, issues: ['Missing domain after @'] };
  if (local.length > 64) issues.push('Local part too long (max 64 chars)');

  // Validate local part
  if (!/^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/i.test(local)) {
    issues.push('Local part contains invalid characters');
  }
  if (local.startsWith('.') || local.endsWith('.')) {
    issues.push('Local part cannot start or end with a dot');
  }
  if (/\.\./.test(local)) {
    issues.push('Local part cannot have consecutive dots');
  }

  // Validate domain
  const domainParts = domain.split('.');
  if (domainParts.length < 2) issues.push('Domain must have at least one dot');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) issues.push('TLD too short');
  if (!/^[a-z0-9-.]+$/i.test(domain)) issues.push('Domain contains invalid characters');
  if (/^-|-$/.test(domain)) issues.push('Domain cannot start or end with a hyphen');

  const isDisposable = DISPOSABLE_DOMAINS.has(domain);

  return {
    valid: issues.length === 0,
    email,
    local,
    domain,
    tld,
    isDisposable,
    issues: issues.length > 0 ? issues : undefined,
  };
}

export function formatEmailInfo(info: EmailInfo): string {
  if (!info.valid) {
    return `✗ Invalid\n\nIssues:\n${info.issues?.map(i => `  • ${i}`).join('\n') ?? 'Unknown error'}`;
  }
  return [
    `✓ Valid`,
    ``,
    `Full:       ${info.email}`,
    `Local:      ${info.local}`,
    `Domain:     ${info.domain}`,
    `TLD:        .${info.tld}`,
    `Disposable: ${info.isDisposable ? 'Yes (throwaway email)' : 'No'}`,
  ].join('\n');
}
