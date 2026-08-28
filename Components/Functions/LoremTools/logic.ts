export type LoremStyle = 'lorem' | 'cicero' | 'english' | 'hipster' | 'corporate';
export type LoremUnit = 'words' | 'sentences' | 'paragraphs';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
  'mollit', 'anim', 'id', 'est', 'laborum', 'perspiciatis', 'unde', 'omnis', 'iste', 'natus',
  'error', 'voluptatem', 'accusantium', 'doloremque', 'laudantium', 'totam', 'rem', 'aperiam',
  'eaque', 'ipsa', 'quae', 'ab', 'illo', 'inventore', 'veritatis', 'quasi', 'architecto',
  'beatae', 'vitae', 'dicta', 'explicabo', 'nemo', 'ipsam', 'quia', 'voluptas', 'aspernatur',
  'odit', 'fugit', 'consequuntur', 'magni', 'dolores', 'eos', 'ratione', 'sequi', 'nesciunt',
  'neque', 'porro', 'quisquam', 'dolorem', 'adipisci', 'numquam', 'eius', 'modi', 'tempora',
  'incidunt', 'magnam', 'quaerat', 'soluta', 'nobis', 'eligendi', 'optio', 'cumque', 'nihil',
  'impedit', 'quo', 'minus', 'maxime', 'placeat', 'facere', 'possimus', 'omnis', 'assumenda',
  'repellendus', 'temporibus', 'autem', 'quibusdam', 'officiis', 'debitis', 'rerum', 'necessitatibus',
  'saepe', 'eveniet', 'voluptates', 'repudiandae', 'recusandae', 'itaque', 'earum', 'hic', 'tenetur',
  'sapiente', 'delectus', 'reiciendis', 'maiores', 'alias', 'perferendis', 'doloribus', 'asperiores',
  'repellat', 'exercitationem', 'suscipit', 'laboriosam', 'aliquid', 'commodi', 'vel', 'illum',
  'aut', 'officiis', 'odio', 'dignissimos', 'ducimus', 'blanditiis', 'praesentium', 'voluptatum',
  'deleniti', 'atque', 'corrupti', 'quos', 'quas', 'molestias', 'excepturi', 'similique',
];

const CICERO_WORDS = [
  'at', 'vero', 'eos', 'accusamus', 'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis',
  'praesentium', 'voluptatum', 'deleniti', 'atque', 'corrupti', 'quos', 'dolores', 'quas',
  'molestias', 'excepturi', 'similique', 'non', 'provident', 'similique', 'illum', 'animi',
  'possimus', 'nam', 'libero', 'tempore', 'cum', 'soluta', 'nobis', 'eligendi', 'optio',
  'cumque', 'nihil', 'impedit', 'quo', 'minus', 'placeat', 'facere', 'repellendus',
  'temporibus', 'autem', 'quibusdam', 'officiis', 'debitis', 'rerum', 'necessitatibus',
  'saepe', 'eveniet', 'voluptates', 'repudiandae', 'recusandae', 'itaque', 'earum', 'tenetur',
  'sapiente', 'delectus', 'reiciendis', 'maiores', 'alias', 'perferendis', 'doloribus',
];

const ENGLISH_WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'ran', 'away',
  'time', 'place', 'things', 'words', 'make', 'take', 'come', 'know', 'seen', 'look',
  'first', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'than',
  'then', 'those', 'very', 'just', 'most', 'even', 'back', 'after', 'only', 'also',
  'around', 'because', 'would', 'should', 'could', 'there', 'where', 'which', 'while',
  'about', 'between', 'through', 'during', 'against', 'before', 'after', 'above', 'below',
  'simple', 'complex', 'various', 'several', 'certain', 'another', 'different', 'following',
  'important', 'however', 'therefore', 'although', 'provide', 'continue', 'increase', 'large',
  'without', 'already', 'example', 'together', 'possible', 'perhaps', 'always', 'something',
  'nothing', 'everything', 'everyone', 'anyone', 'someone', 'anywhere', 'everywhere', 'nowhere',
];

const HIPSTER_WORDS = [
  'artisan', 'craft', 'bespoke', 'sustainable', 'organic', 'farm-to-table', 'small-batch',
  'heirloom', 'authentic', 'handcrafted', 'curated', 'vintage', 'retro', 'analog', 'vinyl',
  'pour-over', 'cold-brew', 'single-origin', 'kombucha', 'kale', 'quinoa', 'avocado', 'sourdough',
  'fixie', 'mason', 'jar', 'flannel', 'beard', 'mustache', 'ironic', 'literally', 'scenester',
  'aesthetic', 'vibe', 'cred', 'normcore', 'twee', 'chipotle', 'sriracha', 'poutine', 'umami',
  'gastropub', 'locavore', 'gluten-free', 'vegan', 'forage', 'foraged', 'bushcraft', 'terroir',
  'whiskey', 'bourbon', 'mezcal', 'craft-beer', 'ipa', 'sour', 'tasting-notes', 'micro-roast',
  'lived-in', 'effortless', 'humble', 'sincere', 'niche', 'underground', 'undiscovered', 'obscure',
];

const CORPORATE_WORDS = [
  'synergy', 'leverage', 'paradigm', 'disruptive', 'innovative', 'scalable', 'agile', 'bandwidth',
  'deliverable', 'stakeholder', 'circle-back', 'deep-dive', 'low-hanging-fruit', 'move-the-needle',
  'pivot', 'ideate', 'ideation', 'boil-the-ocean', 'granular', 'actionable', 'holistic', 'robust',
  'ecosystem', 'streamline', 'optimize', 'core-competency', 'value-add', 'best-of-breed', 'turnkey',
  'bleeding-edge', 'cutting-edge', 'mission-critical', 'game-changer', 'thought-leader', 'guru',
  'brand-evangelist', 'customer-centric', 'data-driven', 'proactive', 'end-to-end', 'seamless',
  'frictionless', 'touch-base', 'ping', 'bandwidth', 'pipeline', 'optics', 'dialogue', 'empower',
  'alignment', 'buy-in', 'pushback', 'takeaway', 'parking-lot', 'offline', 'bandwidth', 'mindshare',
];

const WORD_BANKS: Record<LoremStyle, string[]> = {
  lorem: LOREM_WORDS,
  cicero: CICERO_WORDS,
  english: ENGLISH_WORDS,
  hipster: HIPSTER_WORDS,
  corporate: CORPORATE_WORDS,
};

// Simple deterministic pseudo-random using a seed
function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pickWord(words: string[], rng: () => number): string {
  return words[Math.floor(rng() * words.length)];
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateSentence(words: string[], minWords: number, maxWords: number, rng: () => number): string {
  const count = minWords + Math.floor(rng() * (maxWords - minWords + 1));
  const ws: string[] = [];
  for (let i = 0; i < count; i++) ws.push(pickWord(words, rng));
  ws[0] = capitalize(ws[0]);
  // add comma occasionally
  if (count > 8 && rng() > 0.6) {
    const pos = 3 + Math.floor(rng() * (count - 6));
    ws[pos] = ws[pos] + ',';
  }
  return ws.join(' ') + '.';
}

function generateParagraph(words: string[], minSentences: number, maxSentences: number, rng: () => number): string {
  const count = minSentences + Math.floor(rng() * (maxSentences - minSentences + 1));
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence(words, 8, 18, rng));
  }
  return sentences.join(' ');
}

export interface LoremOptions {
  style: LoremStyle;
  unit: LoremUnit;
  count: number;
}

export function generateLorem(options: LoremOptions): string {
  const { style, unit, count } = options;
  const words = WORD_BANKS[style];
  const rng = seededRandom(42 + count);

  if (unit === 'words') {
    const ws: string[] = [];
    for (let i = 0; i < count; i++) ws.push(pickWord(words, rng));
    ws[0] = capitalize(ws[0]);
    return ws.join(' ') + '.';
  }

  if (unit === 'sentences') {
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) {
      sentences.push(generateSentence(words, 8, 18, rng));
    }
    return sentences.join(' ');
  }

  // paragraphs
  const paragraphs: string[] = [];
  for (let i = 0; i < count; i++) {
    paragraphs.push(generateParagraph(words, 4, 7, rng));
  }
  return paragraphs.join('\n\n');
}

export const STYLE_LABELS: Record<LoremStyle, string> = {
  lorem: 'Lorem Ipsum',
  cicero: 'Cicero Latin',
  english: 'Random English',
  hipster: 'Hipster',
  corporate: 'Corporate Buzzwords',
};
