import {
  addLineNumbers, removeLineNumbers,
  indentText, dedentText,
  extractColumns,
  truncateByChars, truncateByWords, truncateByLines,
  removeEmojis, extractEmojis,
  wrapText, unwrapText,
} from '@/Components/Functions/TextTools2/logic';
import { repeatText } from '@/Components/Functions/TextUtilities/logic';
import { alignLines, columnAlign } from '@/Components/Functions/TextAlignTools/logic';
import { tokenize, TokenMode } from '@/Components/Functions/TokenizerTools/logic';
import { findDuplicateLines, findDuplicateWords } from '@/Components/Functions/DuplicateFinderTools/logic';
import { soundexBatch } from '@/Components/Functions/SoundexTools/logic';
import { Operation } from '../types';

const widthOptions = [40, 60, 72, 80, 100, 120].map((n) => ({ value: String(n), label: String(n) }));

export const textExtraOperations: Operation[] = [
  {
    id: 'line-numbers-add',
    name: 'Add Line Numbers',
    category: 'text',
    params: [
      { id: 'start', label: 'Start at', kind: 'text', default: '1' },
      { id: 'separator', label: 'Separator', kind: 'text', default: '. ' },
    ],
    chainable: true,
    fn: (input, p) => addLineNumbers(input, parseInt(p.start ?? '1') || 1, p.separator ?? '. '),
  },
  {
    id: 'line-numbers-remove',
    name: 'Remove Line Numbers',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => removeLineNumbers(input),
  },
  {
    id: 'indent',
    name: 'Indent',
    category: 'text',
    params: [
      {
        id: 'spaces',
        label: 'Spaces',
        kind: 'select',
        options: [1, 2, 4, 8].map((n) => ({ value: String(n), label: String(n) })),
        default: '2',
      },
    ],
    chainable: true,
    fn: (input, p) => indentText(input, parseInt(p.spaces ?? '2')),
  },
  {
    id: 'dedent',
    name: 'Dedent',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => dedentText(input),
  },
  {
    id: 'word-wrap',
    name: 'Word Wrap',
    category: 'text',
    params: [{ id: 'width', label: 'Width', kind: 'select', options: widthOptions, default: '80' }],
    chainable: true,
    fn: (input, p) => wrapText(input, parseInt(p.width ?? '80')),
  },
  {
    id: 'word-unwrap',
    name: 'Unwrap Paragraphs',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => unwrapText(input),
  },
  {
    id: 'align-lines',
    name: 'Align Lines',
    category: 'text',
    params: [
      {
        id: 'alignment',
        label: 'Alignment',
        kind: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
          { value: 'center', label: 'Center' },
        ],
        default: 'left',
      },
      { id: 'width', label: 'Width', kind: 'select', options: widthOptions, default: '80' },
    ],
    chainable: true,
    fn: (input, p) =>
      alignLines(input, (p.alignment ?? 'left') as 'left' | 'right' | 'center', parseInt(p.width ?? '80')),
  },
  {
    id: 'column-align',
    name: 'Align Columns',
    category: 'text',
    params: [{ id: 'delimiter', label: 'Delimiter', kind: 'text', default: '\t' }],
    chainable: true,
    fn: (input, p) => columnAlign(input, p.delimiter || '\t'),
  },
  {
    id: 'extract-columns',
    name: 'Extract Columns',
    category: 'text',
    params: [
      { id: 'delimiter', label: 'Delimiter', kind: 'text', default: ',' },
      { id: 'columns', label: 'Columns (1-based, comma-separated)', kind: 'text', default: '1' },
    ],
    chainable: true,
    fn: (input, p) => {
      const columns = (p.columns ?? '1')
        .split(',')
        .map((c) => parseInt(c.trim(), 10) - 1)
        .filter((n) => !isNaN(n) && n >= 0);
      if (columns.length === 0) throw new Error('Specify at least one column number');
      return extractColumns(input, p.delimiter || ',', columns);
    },
  },
  {
    id: 'truncate',
    name: 'Truncate',
    category: 'text',
    params: [
      {
        id: 'mode',
        label: 'By',
        kind: 'select',
        options: [
          { value: 'chars', label: 'Characters' },
          { value: 'words', label: 'Words' },
          { value: 'lines', label: 'Lines' },
        ],
        default: 'chars',
      },
      { id: 'limit', label: 'Limit', kind: 'text', default: '100' },
      { id: 'ellipsis', label: 'Ellipsis', kind: 'text', default: '...' },
    ],
    chainable: true,
    fn: (input, p) => {
      const limit = parseInt(p.limit ?? '100');
      if (isNaN(limit) || limit < 0) throw new Error('Limit must be a non-negative number');
      const ellipsis = p.ellipsis ?? '...';
      if (p.mode === 'words') return truncateByWords(input, limit, ellipsis);
      if (p.mode === 'lines') return truncateByLines(input, limit, ellipsis);
      return truncateByChars(input, limit, ellipsis);
    },
  },
  {
    id: 'repeat-text',
    name: 'Repeat Text',
    category: 'text',
    params: [
      { id: 'times', label: 'Times', kind: 'text', default: '2' },
      { id: 'separator', label: 'Separator', kind: 'text', default: '\n' },
    ],
    chainable: true,
    fn: (input, p) => {
      const times = parseInt(p.times ?? '2');
      if (isNaN(times) || times < 1) throw new Error('Times must be at least 1');
      return repeatText(input, times, p.separator ?? '\n');
    },
  },
  {
    id: 'remove-emojis',
    name: 'Remove Emojis',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => removeEmojis(input),
  },
  {
    id: 'extract-emojis',
    name: 'Extract Emojis',
    category: 'text',
    params: [],
    chainable: true,
    fn: (input) => extractEmojis(input),
  },
  {
    id: 'tokenize',
    name: 'Tokenize',
    category: 'text',
    params: [
      {
        id: 'mode',
        label: 'Split by',
        kind: 'select',
        options: [
          { value: 'words', label: 'Words' },
          { value: 'sentences', label: 'Sentences' },
          { value: 'paragraphs', label: 'Paragraphs' },
          { value: 'lines', label: 'Lines' },
        ],
        default: 'words',
      },
    ],
    chainable: true,
    fn: (input, p) => tokenize(input, (p.mode ?? 'words') as TokenMode).join('\n'),
  },
  {
    id: 'soundex',
    name: 'Soundex Codes',
    category: 'text',
    params: [],
    chainable: false,
    terminal: true,
    fn: (input) => soundexBatch(input),
  },
  {
    id: 'find-duplicates',
    name: 'Find Duplicates',
    category: 'analysis',
    params: [
      {
        id: 'mode',
        label: 'Scope',
        kind: 'select',
        options: [
          { value: 'lines', label: 'Lines' },
          { value: 'words', label: 'Words' },
        ],
        default: 'lines',
      },
    ],
    chainable: false,
    terminal: true,
    fn: (input, p) => (p.mode === 'words' ? findDuplicateWords(input) : findDuplicateLines(input)),
  },
];
