import { escapeValue, serialize, FilterNode } from '@/Components/Functions/LdapQueryTools/ast';

describe('escapeValue', () => {
  it('leaves ordinary values untouched', () => {
    expect(escapeValue('John Smith')).toBe('John Smith');
  });

  it('escapes an asterisk', () => {
    expect(escapeValue('a*b')).toBe('a\\2ab');
  });

  it('escapes parentheses', () => {
    expect(escapeValue('Sales (EMEA)')).toBe('Sales \\28EMEA\\29');
  });

  it('escapes a backslash without double-escaping the escapes it introduces', () => {
    expect(escapeValue('a\\b')).toBe('a\\5cb');
  });

  it('escapes a backslash before an asterisk correctly', () => {
    expect(escapeValue('\\*')).toBe('\\5c\\2a');
  });

  it('escapes NUL', () => {
    expect(escapeValue('a\0b')).toBe('a\\00b');
  });

  it('leaves ampersand alone', () => {
    expect(escapeValue('R&D')).toBe('R&D');
  });
});

describe('serialize', () => {
  it('renders a simple condition', () => {
    expect(serialize({ type: 'cond', attr: 'cn', op: '=', value: 'John' })).toBe('(cn=John)');
  });

  it('escapes condition values', () => {
    expect(serialize({ type: 'cond', attr: 'department', op: '=', value: 'Sales (EMEA)' }))
      .toBe('(department=Sales \\28EMEA\\29)');
  });

  it('bypasses escaping when raw is set', () => {
    const node: FilterNode = {
      type: 'cond',
      attr: 'userAccountControl:1.2.840.113556.1.4.803',
      op: '=',
      value: '2',
      raw: true,
    };
    expect(serialize(node)).toBe('(userAccountControl:1.2.840.113556.1.4.803=2)');
  });

  it('renders >= and <=', () => {
    expect(serialize({ type: 'cond', attr: 'whenCreated', op: '<=', value: '20230804000000Z' }))
      .toBe('(whenCreated<=20230804000000Z)');
  });

  it('renders an and node', () => {
    expect(serialize({
      type: 'and',
      children: [
        { type: 'cond', attr: 'objectClass', op: '=', value: 'user' },
        { type: 'cond', attr: 'cn', op: '=', value: 'John' },
      ],
    })).toBe('(&(objectClass=user)(cn=John))');
  });

  it('renders an or node', () => {
    expect(serialize({
      type: 'or',
      children: [
        { type: 'cond', attr: 'department', op: '=', value: 'IT' },
        { type: 'cond', attr: 'department', op: '=', value: 'HR' },
      ],
    })).toBe('(|(department=IT)(department=HR))');
  });

  it('renders a not node', () => {
    expect(serialize({
      type: 'not',
      child: { type: 'cond', attr: 'telephoneNumber', op: '=', value: '*', raw: true },
    })).toBe('(!(telephoneNumber=*))');
  });

  it('collapses a single-child and to its child', () => {
    expect(serialize({
      type: 'and',
      children: [{ type: 'cond', attr: 'objectClass', op: '=', value: 'group' }],
    })).toBe('(objectClass=group)');
  });

  it('collapses a single-child or to its child', () => {
    expect(serialize({
      type: 'or',
      children: [{ type: 'cond', attr: 'department', op: '=', value: 'IT' }],
    })).toBe('(department=IT)');
  });

  it('nests and inside or', () => {
    expect(serialize({
      type: 'and',
      children: [
        { type: 'cond', attr: 'objectClass', op: '=', value: 'user' },
        {
          type: 'or',
          children: [
            { type: 'cond', attr: 'department', op: '=', value: 'IT' },
            { type: 'cond', attr: 'department', op: '=', value: 'HR' },
          ],
        },
      ],
    })).toBe('(&(objectClass=user)(|(department=IT)(department=HR)))');
  });

  it('preserves an intentional trailing wildcard built from escaped segments', () => {
    expect(serialize({ type: 'cond', attr: 'cn', op: '=', value: escapeValue('Sales (EMEA)') + '*', raw: true }))
      .toBe('(cn=Sales \\28EMEA\\29*)');
  });
});
