import { segment, parseQuery } from '@/Components/Functions/LdapQueryTools/parse';
import { serialize } from '@/Components/Functions/LdapQueryTools/ast';

const NOW = new Date('2026-08-04T00:00:00Z');
const filterOf = (input: string) => {
  const r = parseQuery(input, NOW);
  return r.tree ? serialize(r.tree) : '';
};

describe('segment', () => {
  it('splits on "and"', () => {
    expect(segment('users and groups').map(s => s.text.trim())).toEqual(['users', 'groups']);
  });

  it('marks a segment introduced by a NOT connector', () => {
    const parts = segment('users but not disabled');
    expect(parts[1].negated).toBe(true);
    expect(parts[1].text.trim()).toBe('disabled');
  });

  it('prefers the longer connector so "without" is not read as "with"', () => {
    const parts = segment('users without email');
    expect(parts[1].negated).toBe(true);
    expect(parts[1].text.trim()).toBe('email');
  });

  it('prefers "but not" over "not"', () => {
    const parts = segment('users but not active');
    expect(parts).toHaveLength(2);
    expect(parts[1].negated).toBe(true);
  });

  it('does not split inside a double-quoted span', () => {
    const parts = segment('named "John and Jane"');
    expect(parts).toHaveLength(1);
  });

  it('does not split inside a single-quoted span', () => {
    const parts = segment("named 'John and Jane'");
    expect(parts).toHaveLength(1);
  });

  it('does not split on "or"', () => {
    expect(segment('IT or HR department')).toHaveLength(1);
  });

  it('strips the connector token from the segment text', () => {
    const parts = segment('users with phone');
    expect(parts[1].text.trim()).toBe('phone');
  });
});

describe('parseQuery — candidate selection', () => {
  it('treats "IT or HR department" as a value list, not a clause-level or', () => {
    expect(filterOf('users in IT or HR department'))
      .toBe('(&(objectClass=user)(|(department=IT)(department=HR)))');
  });

  it('falls back to a clause-level or when the whole segment cannot be consumed', () => {
    const filter = filterOf('users in IT department or disabled computers');
    expect(filter).toContain('(|');
    expect(filter).toContain('(department=IT)');
    expect(filter).toContain('(objectClass=computer)');
  });
});

describe('parseQuery — negation', () => {
  it('wraps a negated segment in a not node', () => {
    expect(filterOf('users but not disabled'))
      .toBe('(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))');
  });

  it('reads "without email" as an absent mail attribute', () => {
    expect(filterOf('users without email'))
      .toBe('(&(objectClass=user)(!(mail=*)))');
  });
});

describe('parseQuery — objectClass default', () => {
  it('adds the user default when no class is named', () => {
    expect(filterOf('named John')).toBe('(&(objectClass=user)(cn=John*))');
  });

  it('does not add a default when a class is named', () => {
    expect(filterOf('groups named Dev')).toBe('(&(objectClass=group)(cn=Dev*))');
  });

  it('wraps a top-level or in the default class', () => {
    const filter = filterOf('in IT department or in HR department');
    expect(filter.startsWith('(&(objectClass=user)')).toBe(true);
  });
});

describe('parseQuery — coverage', () => {
  it('reports text no matcher understood', () => {
    const r = parseQuery('users flibbertigibbet', NOW);
    expect(r.unparsed).toEqual(['flibbertigibbet']);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('ignores stopwords when measuring leftover', () => {
    const r = parseQuery('find all the users', NOW);
    expect(r.unparsed).toEqual([]);
  });

  it('reports nothing unparsed for a fully understood query', () => {
    const r = parseQuery('find users in IT or HR department that have accounts older than 3 years', NOW);
    expect(r.unparsed).toEqual([]);
  });
});

describe('parseQuery — regressions from the old regex builder', () => {
  it('handles an explicit wildcard in a name', () => {
    expect(filterOf('users named John*')).toBe('(&(objectClass=user)(cn=John*))');
  });

  it('handles an ampersand in a department', () => {
    expect(filterOf('users in the R&D department')).toBe('(&(objectClass=user)(department=R&D))');
  });

  it('handles parentheses in a department', () => {
    expect(filterOf('users in the Sales (EMEA) department'))
      .toBe('(&(objectClass=user)(department=Sales \\28EMEA\\29))');
  });

  it('does not swallow "and" into a name value', () => {
    expect(filterOf('users named John and named Jane'))
      .toBe('(&(objectClass=user)(cn=John*)(cn=Jane*))');
  });

  it('produces the full worked example', () => {
    expect(filterOf('find users in IT or HR department that have accounts older than 3 years'))
      .toBe('(&(objectClass=user)(|(department=IT)(department=HR))(whenCreated<=20230804000000Z))');
  });
});

describe('parseQuery — objectClass hoisting', () => {
  it('lifts a shared objectClass out of an or so it constrains every branch', () => {
    expect(filterOf('find users in it department or hr department that have accounts older than 3 years'))
      .toBe('(&(objectClass=user)(|(department=it)(department=hr))(whenCreated<=20230804000000Z))');
  });

  it('leaves differing objectClasses inside their own branches', () => {
    const filter = filterOf('users in IT department or disabled computers');
    expect(filter).toContain('(objectClass=user)');
    expect(filter).toContain('(objectClass=computer)');
    expect(filter.startsWith('(&(objectClass=')).toBe(false);
  });
});

describe('parseQuery — deduplication', () => {
  it('does not repeat an identical objectClass conjunct', () => {
    expect(filterOf('users named John and users named Jane'))
      .toBe('(&(objectClass=user)(cn=John*)(cn=Jane*))');
  });

  it('does not repeat an identical account-status conjunct', () => {
    expect(filterOf('active users but not disabled'))
      .toBe('(&(objectClass=user)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))');
  });
});

describe('parseQuery — leftover hygiene', () => {
  it('ignores a trailing full stop', () => {
    expect(parseQuery('users in the IT department.', NOW).unparsed).toEqual([]);
  });

  it('ignores punctuation-only tokens', () => {
    expect(parseQuery('users in the IT department - .', NOW).unparsed).toEqual([]);
  });
});

describe('parseQuery — empty input', () => {
  it('returns an empty result', () => {
    const r = parseQuery('', NOW);
    expect(r.tree).toBeNull();
    expect(r.explanation).toEqual([]);
    expect(r.unparsed).toEqual([]);
  });
});
