import {
  analyzeColumns,
} from '../Components/Functions/DataTypeAnalyzerTools/logic';

const SAMPLE_CSV = `name,age,score,active,email,created_at,website,category
Alice,30,9.5,true,alice@example.com,2024-01-15,https://alice.dev,A
Bob,25,8.0,false,bob@example.com,2024-02-20,https://bob.io,B
Carol,35,7.5,yes,carol@example.com,2024-03-10,https://carol.com,A
Dave,28,,no,dave@example.com,2024-04-05,,B
`;

describe('analyzeColumns', () => {
  it('detects integer column', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const age = cols.find(function(c) { return c.name === 'age'; });
    expect(age).toBeDefined();
    expect(age!.inferredType).toBe('integer');
  });

  it('detects float column', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const score = cols.find(function(c) { return c.name === 'score'; });
    expect(score).toBeDefined();
    expect(score!.inferredType).toBe('float');
  });

  it('detects boolean column', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const active = cols.find(function(c) { return c.name === 'active'; });
    expect(active).toBeDefined();
    expect(active!.inferredType).toBe('boolean');
  });

  it('detects email column', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const email = cols.find(function(c) { return c.name === 'email'; });
    expect(email).toBeDefined();
    expect(email!.inferredType).toBe('email');
  });

  it('detects date column', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const created = cols.find(function(c) { return c.name === 'created_at'; });
    expect(created).toBeDefined();
    expect(created!.inferredType).toBe('date');
  });

  it('detects URL column', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const website = cols.find(function(c) { return c.name === 'website'; });
    expect(website).toBeDefined();
    expect(website!.inferredType).toBe('url');
  });

  it('detects categorical column', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const cat = cols.find(function(c) { return c.name === 'category'; });
    expect(cat).toBeDefined();
    expect(cat!.inferredType).toBe('categorical');
  });

  it('counts nulls correctly', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const score = cols.find(function(c) { return c.name === 'score'; });
    expect(score!.nullCount).toBe(1);
  });

  it('provides min/max for numeric columns', () => {
    const cols = analyzeColumns(SAMPLE_CSV);
    const age = cols.find(function(c) { return c.name === 'age'; });
    expect(age!.minValue).toBe(25);
    expect(age!.maxValue).toBe(35);
  });

  it('throws on CSV with only one line', () => {
    expect(() => analyzeColumns('header only')).toThrow();
  });
});
