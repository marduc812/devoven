import { generateLorem } from '@/Components/Functions/LoremTools/logic';

describe('generateLorem', () => {
  it('generates words', () => {
    const result = generateLorem({ style: 'lorem', unit: 'words', count: 10 });
    const words = result.split(/\s+/).filter(w => w.length > 0);
    expect(words.length).toBeGreaterThanOrEqual(5);
  });

  it('generates sentences', () => {
    const result = generateLorem({ style: 'lorem', unit: 'sentences', count: 3 });
    const sentences = result.split('. ');
    expect(sentences.length).toBeGreaterThanOrEqual(2);
  });

  it('generates paragraphs separated by double newline', () => {
    const result = generateLorem({ style: 'lorem', unit: 'paragraphs', count: 2 });
    expect(result).toContain('\n\n');
  });

  it('works with hipster style', () => {
    const result = generateLorem({ style: 'hipster', unit: 'words', count: 5 });
    expect(result.length).toBeGreaterThan(0);
  });

  it('works with corporate style', () => {
    const result = generateLorem({ style: 'corporate', unit: 'sentences', count: 2 });
    expect(result.length).toBeGreaterThan(0);
  });

  it('works with english style', () => {
    const result = generateLorem({ style: 'english', unit: 'paragraphs', count: 1 });
    expect(result.length).toBeGreaterThan(0);
  });

  it('capitalizes first word', () => {
    const result = generateLorem({ style: 'lorem', unit: 'words', count: 5 });
    expect(result[0]).toBe(result[0].toUpperCase());
  });
});
