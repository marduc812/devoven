import { Operation } from '../types';

// Flow blocks. The runner in ../pipeline.ts recognises them by `control` and
// never calls `fn`; the identity here only keeps the registry invariants.

export const SEPARATORS = [
  { value: 'line', label: 'Line' },
  { value: 'comma', label: 'Comma' },
  { value: 'space', label: 'Whitespace' },
  { value: 'custom', label: 'Custom' },
];

/** The separator a flow block was configured with, as a string to split or join on. */
export function separatorOf(params: Record<string, string>): string {
  switch (params.by) {
    case 'comma': return ',';
    case 'space': return ' ';
    case 'custom': return params.custom ?? '';
    default: return '\n';
  }
}

/** Splits one value into items; a Line split accepts every newline convention. */
export function splitItems(value: string, params: Record<string, string>): string[] {
  if (value === '') return [];
  switch (params.by) {
    case 'line': return value.split(/\r\n|\r|\n/);
    case 'space': return value.split(/\s+/).filter((s) => s !== '');
    case 'comma': return value.split(',');
    default: {
      const sep = params.custom ?? '';
      if (sep === '') throw new Error('Type the custom separator to split on');
      return value.split(sep);
    }
  }
}

const NAME = /^[A-Za-z0-9_-]{1,32}$/;

/** A remembered value's name, validated so `{name}` is unambiguous. */
export function memoryName(params: Record<string, string>): string {
  const name = (params.name ?? '').trim();
  if (name === '') throw new Error('Give the value a name');
  if (!NAME.test(name)) throw new Error(`"${name}" is not a valid name: letters, digits, - and _ only, up to 32 characters`);
  return name;
}

const byParam = { id: 'by', label: 'Split on', kind: 'select' as const, options: SEPARATORS, default: 'line' };
const customParam = { id: 'custom', label: 'Custom', kind: 'text' as const, default: '' };

export const flowOperations: Operation[] = [
  {
    id: 'each-line',
    name: 'Each Line',
    category: 'flow',
    control: 'each',
    params: [byParam, customParam],
    fn: (input) => input,
  },
  {
    id: 'collect',
    name: 'Collect',
    category: 'flow',
    control: 'collect',
    params: [{ ...byParam, label: 'Join with' }, customParam],
    fn: (input) => input,
  },
  {
    id: 'remember',
    name: 'Remember',
    category: 'flow',
    control: 'remember',
    params: [{ id: 'name', label: 'As', kind: 'text', default: '' }],
    fn: (input) => input,
  },
  {
    id: 'recall',
    name: 'Recall',
    category: 'flow',
    control: 'recall',
    params: [{ id: 'name', label: 'Name', kind: 'text', default: '' }],
    fn: (input) => input,
  },
];
