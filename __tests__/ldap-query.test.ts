import { buildLdapQuery, validateLdapFilter, LDAP_OPERATORS, LDAP_EXAMPLES } from '../Components/Functions/LdapQueryTools/logic';

describe('buildLdapQuery', () => {
  it('returns empty result for empty input', () => {
    const r = buildLdapQuery('');
    expect(r.filter).toBe('');
    expect(r.explanation).toHaveLength(0);
  });

  it('defaults to objectClass=user for generic input', () => {
    const r = buildLdapQuery('find all users');
    expect(r.filter).toContain('objectClass=user');
  });

  it('sets objectClass=group for group queries', () => {
    const r = buildLdapQuery('find groups');
    expect(r.filter).toContain('objectClass=group');
  });

  it('sets objectClass=computer for computer queries', () => {
    const r = buildLdapQuery('find computers');
    expect(r.filter).toContain('objectClass=computer');
  });

  it('extracts department filter', () => {
    const r = buildLdapQuery('find users in the IT department');
    expect(r.filter).toContain('department=IT');
    expect(r.explanation.some(e => e.includes('IT'))).toBe(true);
  });

  it('extracts email domain filter', () => {
    const r = buildLdapQuery('users with @example.com');
    expect(r.filter).toContain('mail=*@example.com');
  });

  it('wraps multiple conditions in &()', () => {
    const r = buildLdapQuery('users in IT department named John');
    expect(r.filter.startsWith('(&')).toBe(true);
    expect(r.filter).toContain('department=IT');
    expect(r.filter).toContain('cn=John');
  });

  it('includes active filter when "active" keyword present', () => {
    const r = buildLdapQuery('active users');
    expect(r.filter).toContain('userAccountControl');
  });

  it('single condition returns filter without &()', () => {
    const r = buildLdapQuery('find groups');
    // Only one condition: objectClass=group
    expect(r.filter).toBe('(objectClass=group)');
  });
});

describe('validateLdapFilter', () => {
  it('returns null for empty input', () => {
    expect(validateLdapFilter('')).toBeNull();
  });

  it('returns null for valid filter', () => {
    expect(validateLdapFilter('(&(objectClass=user)(cn=John))')).toBeNull();
  });

  it('detects unmatched opening parenthesis', () => {
    expect(validateLdapFilter('(cn=John')).not.toBeNull();
  });

  it('detects unmatched closing parenthesis', () => {
    expect(validateLdapFilter('cn=John)')).not.toBeNull();
  });
});

describe('LDAP_OPERATORS', () => {
  it('includes all 8 operators', () => {
    expect(LDAP_OPERATORS.length).toBe(8);
  });

  it('each operator has symbol, name, description, example', () => {
    for (const op of LDAP_OPERATORS) {
      expect(op.symbol).toBeTruthy();
      expect(op.name).toBeTruthy();
      expect(op.description).toBeTruthy();
      expect(op.example).toBeTruthy();
    }
  });
});

describe('LDAP_EXAMPLES', () => {
  it('has at least 10 examples', () => {
    expect(LDAP_EXAMPLES.length).toBeGreaterThanOrEqual(10);
  });

  it('each example has label, description, filter', () => {
    for (const ex of LDAP_EXAMPLES) {
      expect(ex.label).toBeTruthy();
      expect(ex.description).toBeTruthy();
      expect(ex.filter).toBeTruthy();
    }
  });
});
