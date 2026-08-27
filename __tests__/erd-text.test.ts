import {
  parseErdInput,
  generateAsciiErd,
  generateMermaidErd,
  generateErdOutput,
} from '../Components/Functions/ErdTextTools/logic';

describe('parseErdInput', () => {
  it('parses a single table', () => {
    const model = parseErdInput('users(id, name, email)');
    expect(model.tables).toHaveLength(1);
    expect(model.tables[0].name).toBe('users');
    expect(model.tables[0].columns).toHaveLength(3);
  });

  it('parses multiple tables', () => {
    const model = parseErdInput('users(id, name) orders(id, user_id, total)');
    expect(model.tables).toHaveLength(2);
  });

  it('marks id column as primary key', () => {
    const model = parseErdInput('users(id, name)');
    const idCol = model.tables[0].columns.find(c => c.name === 'id');
    expect(idCol?.isPrimaryKey).toBe(true);
  });

  it('marks _id suffix columns as foreign keys', () => {
    const model = parseErdInput('orders(id, user_id, total)');
    const fkCol = model.tables[0].columns.find(c => c.name === 'user_id');
    expect(fkCol?.isForeignKey).toBe(true);
  });

  it('detects relationships from FK columns', () => {
    const model = parseErdInput('users(id, name) orders(id, user_id, total)');
    expect(model.relationships.length).toBeGreaterThan(0);
    const rel = model.relationships[0];
    expect(rel.fromTable).toBe('orders');
    expect(rel.toTable).toBe('users');
  });

  it('returns empty model for empty input', () => {
    const model = parseErdInput('');
    expect(model.tables).toHaveLength(0);
  });
});

describe('generateAsciiErd', () => {
  it('generates ASCII boxes for tables', () => {
    const model = parseErdInput('users(id, name)');
    const ascii = generateAsciiErd(model);
    expect(ascii).toContain('USERS');
    expect(ascii).toContain('+');
    expect(ascii).toContain('|');
    expect(ascii).toContain('[PK]');
  });

  it('shows FK annotation', () => {
    const model = parseErdInput('orders(id, user_id)');
    const ascii = generateAsciiErd(model);
    expect(ascii).toContain('[FK]');
  });

  it('shows relationships', () => {
    const model = parseErdInput('users(id) orders(id, user_id)');
    const ascii = generateAsciiErd(model);
    expect(ascii).toContain('--->');
  });

  it('returns placeholder for empty model', () => {
    const model = parseErdInput('');
    expect(generateAsciiErd(model)).toContain('no tables');
  });
});

describe('generateMermaidErd', () => {
  it('generates erDiagram header', () => {
    const model = parseErdInput('users(id, name)');
    const mermaid = generateMermaidErd(model);
    expect(mermaid).toContain('erDiagram');
    expect(mermaid).toContain('USERS');
  });

  it('generates relationship lines', () => {
    const model = parseErdInput('users(id) orders(id, user_id)');
    const mermaid = generateMermaidErd(model);
    expect(mermaid).toContain('||--o{');
  });

  it('returns placeholder for empty model', () => {
    const model = parseErdInput('');
    expect(generateMermaidErd(model)).toContain('erDiagram');
  });
});

describe('generateErdOutput', () => {
  it('returns empty string for empty input', () => {
    expect(generateErdOutput('')).toBe('');
  });

  it('includes both ASCII and Mermaid sections', () => {
    const out = generateErdOutput('users(id, name) orders(id, user_id)');
    expect(out).toContain('ASCII ER DIAGRAM');
    expect(out).toContain('MERMAID erDiagram');
  });
});
