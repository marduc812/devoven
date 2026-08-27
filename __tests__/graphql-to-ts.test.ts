import { graphqlToTypeScript, parseGraphQLSchema, defsToTypeScript } from '@/Components/Functions/GraphqlToTsTools/logic';

describe('parseGraphQLSchema', () => {
  it('parses a simple type', () => {
    const schema = `type User { id: ID! name: String age: Int }`;
    const defs = parseGraphQLSchema(schema);
    expect(defs).toHaveLength(1);
    expect(defs[0].kind).toBe('type');
    expect(defs[0].name).toBe('User');
    expect(defs[0].fields).toHaveLength(3);
  });

  it('parses an enum', () => {
    const schema = `enum Role { ADMIN USER GUEST }`;
    const defs = parseGraphQLSchema(schema);
    expect(defs[0].kind).toBe('enum');
    expect(defs[0].values).toContain('ADMIN');
  });

  it('parses an interface', () => {
    const schema = `interface Node { id: ID! }`;
    const defs = parseGraphQLSchema(schema);
    expect(defs[0].kind).toBe('interface');
  });

  it('parses input type', () => {
    const schema = `input CreateUser { name: String! }`;
    const defs = parseGraphQLSchema(schema);
    expect(defs[0].kind).toBe('input');
  });
});

describe('graphqlToTypeScript', () => {
  it('converts String to string', () => {
    const out = graphqlToTypeScript('type A { name: String! }');
    expect(out).toContain('name: string');
  });

  it('converts Int to number', () => {
    const out = graphqlToTypeScript('type A { age: Int }');
    expect(out).toContain('age?: number');
  });

  it('converts Boolean to boolean', () => {
    const out = graphqlToTypeScript('type A { active: Boolean! }');
    expect(out).toContain('active: boolean');
  });

  it('converts ID to string', () => {
    const out = graphqlToTypeScript('type A { id: ID! }');
    expect(out).toContain('id: string');
  });

  it('converts list type', () => {
    const out = graphqlToTypeScript('type A { tags: [String!]! }');
    expect(out).toContain('tags: string[]');
  });

  it('optional field uses ?', () => {
    const out = graphqlToTypeScript('type A { bio: String }');
    expect(out).toContain('bio?: string');
  });

  it('generates enum with values', () => {
    const out = graphqlToTypeScript('enum Status { ACTIVE INACTIVE }');
    expect(out).toContain("ACTIVE = 'ACTIVE'");
    expect(out).toContain("INACTIVE = 'INACTIVE'");
  });

  it('generates export interface', () => {
    const out = graphqlToTypeScript('type User { id: ID! }');
    expect(out).toContain('export interface User');
  });

  it('returns helpful message for empty schema', () => {
    const out = graphqlToTypeScript('# just a comment');
    expect(out).toContain('No recognized');
  });

  it('returns empty for empty input', () => {
    expect(graphqlToTypeScript('')).toBe('');
  });
});
