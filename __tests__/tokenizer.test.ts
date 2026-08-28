import {
  tokenize,
  tokenizeResult,
  TOKEN_MODES,
  tokenizeWords,
  tokenizeSentences,
  tokenizeParagraphs,
  tokenizeLines,
} from '@/Components/Functions/TokenizerTools/logic';

const sampleText = 'Hello world. This is a test. How are you?';
const multiParagraph = 'First paragraph here.\n\nSecond paragraph here.\n\nThird one.';

// ─── tokenizeWords ────────────────────────────────────────────────────────────

describe('tokenizeWords', () => {
  it('tokenizes simple sentence into words', () => {
    const words = tokenizeWords('Hello world');
    expect(words).toEqual(['Hello', 'world']);
  });

  it('extracts words from punctuated text', () => {
    const words = tokenizeWords(sampleText);
    expect(words).toContain('Hello');
    expect(words).toContain('test');
  });

  it('returns empty array for empty string', () => {
    expect(tokenizeWords('')).toEqual([]);
  });

  it('handles numbers as word tokens', () => {
    const words = tokenizeWords('version 2 is ready');
    expect(words).toContain('2');
  });

  it('ignores punctuation only', () => {
    const words = tokenizeWords('!!! ???');
    expect(words).toHaveLength(0);
  });
});

// ─── tokenizeSentences ────────────────────────────────────────────────────────

describe('tokenizeSentences', () => {
  it('splits text into sentences', () => {
    const sentences = tokenizeSentences(sampleText);
    expect(sentences.length).toBeGreaterThanOrEqual(2);
  });

  it('each sentence is non-empty', () => {
    const sentences = tokenizeSentences(sampleText);
    for (const s of sentences) {
      expect(s.trim().length).toBeGreaterThan(0);
    }
  });

  it('returns empty array for empty string', () => {
    const sentences = tokenizeSentences('');
    expect(sentences).toHaveLength(0);
  });

  it('handles single sentence', () => {
    const sentences = tokenizeSentences('Just one sentence.');
    expect(sentences).toHaveLength(1);
  });
});

// ─── tokenizeParagraphs ───────────────────────────────────────────────────────

describe('tokenizeParagraphs', () => {
  it('splits on double newlines', () => {
    const paragraphs = tokenizeParagraphs(multiParagraph);
    expect(paragraphs).toHaveLength(3);
  });

  it('returns single paragraph for no double newlines', () => {
    const paragraphs = tokenizeParagraphs('Just one paragraph.');
    expect(paragraphs).toHaveLength(1);
  });

  it('returns empty array for empty string', () => {
    expect(tokenizeParagraphs('')).toHaveLength(0);
  });

  it('trims whitespace paragraphs', () => {
    const paragraphs = tokenizeParagraphs('Hello.\n\n   \n\nWorld.');
    const noEmpty = paragraphs.filter(p => p.trim().length > 0);
    expect(noEmpty.length).toBe(paragraphs.length);
  });
});

// ─── tokenizeLines ────────────────────────────────────────────────────────────

describe('tokenizeLines', () => {
  it('splits on single newlines', () => {
    const lines = tokenizeLines('line1\nline2\nline3');
    expect(lines).toHaveLength(3);
  });

  it('includes empty lines', () => {
    const lines = tokenizeLines('a\n\nb');
    expect(lines).toHaveLength(3);
  });

  it('returns single line for no newlines', () => {
    const lines = tokenizeLines('no newlines');
    expect(lines).toHaveLength(1);
  });
});

// ─── tokenize / tokenizeResult (structured) ───────────────────────────────────

describe('tokenize', () => {
  it('dispatches to the same tokenizer as the named helpers', () => {
    const text = 'One two. Three four?\n\nFive';
    expect(tokenize(text, 'words')).toEqual(tokenizeWords(text));
    expect(tokenize(text, 'sentences')).toEqual(tokenizeSentences(text));
    expect(tokenize(text, 'paragraphs')).toEqual(tokenizeParagraphs(text));
    expect(tokenize(text, 'lines')).toEqual(tokenizeLines(text));
  });
});

describe('tokenizeResult', () => {
  it('counts tokens and distinct tokens case-insensitively', () => {
    const r = tokenizeResult('The the THE cat', 'words');
    expect(r.count).toBe(4);
    expect(r.uniqueCount).toBe(2);
    expect(r.frequency[0]).toEqual({ token: 'the', count: 3 });
  });

  it('orders frequency by count then alphabetically', () => {
    const r = tokenizeResult('b b a a c', 'words');
    expect(r.frequency).toEqual([
      { token: 'a', count: 2 },
      { token: 'b', count: 2 },
      { token: 'c', count: 1 },
    ]);
  });

  it('reports shortest and longest, resolving ties to the first occurrence', () => {
    const r = tokenizeResult('aa b cc d eeee', 'words');
    expect(r.shortest).toBe('b');
    expect(r.longest).toBe('eeee');
  });

  it('averages token length over characters, not separators', () => {
    const r = tokenizeResult('ab cd ef', 'words');
    expect(r.totalChars).toBe(6);
    expect(r.averageLength).toBe(2);
  });

  it('returns zeroed stats for empty input rather than NaN', () => {
    const r = tokenizeResult('', 'words');
    expect(r.count).toBe(0);
    expect(r.uniqueCount).toBe(0);
    expect(r.averageLength).toBe(0);
    expect(r.shortest).toBeNull();
    expect(r.longest).toBeNull();
    expect(r.frequency).toEqual([]);
  });

  it('carries the mode through to the result', () => {
    expect(tokenizeResult('a. b.', 'sentences').mode).toBe('sentences');
  });

  it('counts paragraphs and lines differently for the same text', () => {
    const text = 'one\ntwo\n\nthree';
    expect(tokenizeResult(text, 'lines').count).toBe(4);
    expect(tokenizeResult(text, 'paragraphs').count).toBe(2);
  });

  it('covers every mode listed in TOKEN_MODES', () => {
    expect(TOKEN_MODES).toEqual(['words', 'sentences', 'paragraphs', 'lines']);
    for (const mode of TOKEN_MODES) {
      expect(() => tokenizeResult('Some text. More text.', mode)).not.toThrow();
    }
  });
});
