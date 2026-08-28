// Pure logic — no browser APIs.

import { FilterNode, serialize } from './ast';
import { parseQuery } from './parse';

export type { FilterNode } from './ast';

export type LdapOperator = {
  symbol: string;
  name: string;
  description: string;
  example: string;
};

export const LDAP_OPERATORS: LdapOperator[] = [
  { symbol: '&', name: 'AND', description: 'All conditions must be true', example: '(&(objectClass=user)(department=IT))' },
  { symbol: '|', name: 'OR', description: 'At least one condition must be true', example: '(|(cn=John)(cn=Jane))' },
  { symbol: '!', name: 'NOT', description: 'Condition must be false', example: '(!(userAccountControl=514))' },
  { symbol: '=', name: 'Equality', description: 'Attribute equals value', example: '(cn=John Smith)' },
  { symbol: '~=', name: 'Approx', description: 'Approximate match (soundex)', example: '(cn~=Jon)' },
  { symbol: '<=', name: 'Less or equal', description: 'Attribute is less than or equal to value', example: '(uidNumber<=1000)' },
  { symbol: '>=', name: 'Greater or equal', description: 'Attribute is greater than or equal to value', example: '(uidNumber>=500)' },
  { symbol: '*', name: 'Wildcard', description: 'Any value (presence or substring)', example: '(mail=*@example.com)' },
];

export type LdapExample = {
  label: string;
  description: string;
  filter: string;
};

export const LDAP_EXAMPLES: LdapExample[] = [
  { label: 'All users', description: 'Find all user objects', filter: '(objectClass=user)' },
  { label: 'User by name', description: 'Find user with exact common name', filter: '(&(objectClass=user)(cn=John Smith))' },
  { label: 'Users in department', description: 'Find all users in IT department', filter: '(&(objectClass=user)(department=IT))' },
  { label: 'Users by email domain', description: 'Find users with a specific email domain', filter: '(&(objectClass=user)(mail=*@example.com))' },
  { label: 'Active users', description: 'Find enabled (active) Active Directory users', filter: '(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))' },
  { label: 'Group members', description: 'Find members of a specific group', filter: '(&(objectClass=user)(memberOf=CN=Admins,OU=Groups,DC=example,DC=com))' },
  { label: 'All groups', description: 'Find all group objects', filter: '(objectClass=group)' },
  { label: 'Groups by name prefix', description: 'Find groups starting with "Dev"', filter: '(&(objectClass=group)(cn=Dev*))' },
  { label: 'User by SID', description: 'Find user by security identifier', filter: '(&(objectClass=user)(objectSid=S-1-5-21-*))' },
  { label: 'Users with phone', description: 'Find users that have a phone number set', filter: '(&(objectClass=user)(telephoneNumber=*))' },
  { label: 'Computers in OU', description: 'Find all computer objects in an OU', filter: '(&(objectClass=computer)(ou=Workstations))' },
  { label: 'Recently modified', description: 'Find objects modified after a date (YYYYMMDDHHMMSSZ)', filter: '(&(objectClass=user)(whenChanged>=20240101000000Z))' },
];

export type LdapQueryResult = {
  filter: string;
  explanation: string[];
  warnings: string[];
  tree: FilterNode | null;
  unparsed: string[];
};

// Natural language to LDAP filter. The clock is injectable so that
// age-based filters are testable without depending on the current date.
export function buildLdapQuery(input: string, now: Date = new Date()): LdapQueryResult {
  const parsed = parseQuery(input, now);
  return {
    filter: parsed.tree ? serialize(parsed.tree) : '',
    explanation: parsed.explanation,
    warnings: parsed.warnings,
    tree: parsed.tree,
    unparsed: parsed.unparsed,
  };
}

export function validateLdapFilter(filter: string): string | null {
  if (!filter.trim()) return null;
  let depth = 0;
  for (const ch of filter) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth < 0) return 'Unmatched closing parenthesis';
  }
  if (depth !== 0) return 'Unmatched opening parenthesis';
  return null;
}
