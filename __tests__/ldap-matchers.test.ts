import { runMatchers, generalizedTime, shiftDate } from '@/Components/Functions/LdapQueryTools/matchers';
import { serialize } from '@/Components/Functions/LdapQueryTools/ast';

const NOW = new Date('2026-08-04T00:00:00Z');

const filterOf = (clause: string, now: Date = NOW) => {
  const r = runMatchers(clause, now);
  return r.nodes.map(serialize);
};

describe('generalizedTime', () => {
  it('formats as YYYYMMDDHHMMSSZ with the time zeroed', () => {
    expect(generalizedTime(new Date('2023-08-04T13:45:12Z'))).toBe('20230804000000Z');
  });
});

describe('shiftDate', () => {
  it('subtracts years using calendar arithmetic', () => {
    expect(generalizedTime(shiftDate(NOW, -3, 'years'))).toBe('20230804000000Z');
  });

  it('subtracts months across a year boundary', () => {
    expect(generalizedTime(shiftDate(NOW, -9, 'months'))).toBe('20251104000000Z');
  });

  it('subtracts days', () => {
    expect(generalizedTime(shiftDate(NOW, -30, 'days'))).toBe('20260705000000Z');
  });

  it('subtracts weeks', () => {
    expect(generalizedTime(shiftDate(NOW, -2, 'weeks'))).toBe('20260721000000Z');
  });
});

describe('objectClass matcher', () => {
  it('matches users', () => {
    expect(filterOf('users')).toContain('(objectClass=user)');
  });

  it('matches groups', () => {
    expect(filterOf('groups')).toContain('(objectClass=group)');
  });

  it('matches computers', () => {
    expect(filterOf('workstations')).toContain('(objectClass=computer)');
  });
});

describe('cn matcher', () => {
  it('builds a prefix filter', () => {
    expect(filterOf('named John')).toContain('(cn=John*)');
  });

  it('does not double the wildcard when the user supplies one', () => {
    expect(filterOf('named John*')).toContain('(cn=John*)');
  });

  it('preserves an internal wildcard while escaping the literal parts', () => {
    expect(filterOf('named Jo*n')).toContain('(cn=Jo*n*)');
  });

  it('escapes parentheses in a name', () => {
    expect(filterOf('named "Smith (Contractor)"')).toContain('(cn=Smith \\28Contractor\\29*)');
  });
});

describe('department matcher', () => {
  it('extracts a single department', () => {
    expect(filterOf('in the IT department')).toContain('(department=IT)');
  });

  it('works without a preposition', () => {
    expect(filterOf('IT department')).toContain('(department=IT)');
  });

  it('splits a value list on "or"', () => {
    expect(filterOf('in IT or HR department')).toContain('(|(department=IT)(department=HR))');
  });

  it('survives an ampersand in the value', () => {
    expect(filterOf('in the R&D department')).toContain('(department=R&D)');
  });

  it('escapes parentheses in the value', () => {
    expect(filterOf('in the Sales (EMEA) department')).toContain('(department=Sales \\28EMEA\\29)');
  });
});

describe('mail matcher', () => {
  it('builds a domain filter', () => {
    expect(filterOf('@example.com')).toContain('(mail=*@example.com)');
  });
});

describe('title matcher', () => {
  it('extracts a job title', () => {
    expect(filterOf('title Senior Engineer')).toContain('(title=Senior Engineer)');
  });
});

describe('memberOf matcher', () => {
  it('builds a placeholder DN and warns about it', () => {
    const r = runMatchers('member of Admins', NOW);
    expect(r.nodes.map(serialize)).toContain('(memberOf=CN=Admins,DC=example,DC=com)');
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe('account status matchers', () => {
  it('builds the enabled filter', () => {
    expect(filterOf('active')).toContain('(!(userAccountControl:1.2.840.113556.1.4.803:=2))');
  });

  it('builds the disabled filter', () => {
    expect(filterOf('disabled')).toContain('(userAccountControl:1.2.840.113556.1.4.803:=2)');
  });

  it('does not treat "inactive" as "active"', () => {
    expect(filterOf('inactive')).toContain('(userAccountControl:1.2.840.113556.1.4.803:=2)');
  });
});

describe('presence and absence matchers', () => {
  it('builds a presence filter for phone', () => {
    expect(filterOf('phone')).toContain('(telephoneNumber=*)');
  });

  it('builds an absence filter for no phone', () => {
    expect(filterOf('no phone')).toContain('(!(telephoneNumber=*))');
  });

  it('does not add a redundant presence filter when a domain was matched', () => {
    expect(filterOf('email @example.com')).toEqual(['(mail=*@example.com)']);
  });
});

describe('age matcher', () => {
  it('builds whenCreated <= for "older than"', () => {
    expect(filterOf('older than 3 years')).toContain('(whenCreated<=20230804000000Z)');
  });

  it('builds whenCreated >= for "newer than"', () => {
    expect(filterOf('newer than 6 months')).toContain('(whenCreated>=20260204000000Z)');
  });

  it('builds whenChanged >= for "modified in the last"', () => {
    expect(filterOf('modified in the last 30 days')).toContain('(whenChanged>=20260705000000Z)');
  });
});

describe('span consumption', () => {
  it('yields several conditions from one clause', () => {
    expect(filterOf('users in the IT department')).toEqual([
      '(objectClass=user)',
      '(department=IT)',
    ]);
  });

  it('reports text no matcher consumed', () => {
    const r = runMatchers('users flibbertigibbet', NOW);
    expect(r.leftover).toContain('flibbertigibbet');
  });

  it('reports empty leftover when everything is consumed', () => {
    const r = runMatchers('users in the IT department', NOW);
    expect(r.leftover.trim()).toBe('');
  });
});
