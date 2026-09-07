import {
  SET_OPERATIONS,
  SetOperation,
  SetOptions,
  Separator,
  applySetOperation,
  isSeparator,
} from '@/Components/Functions/SetOpsTools/logic';
import { Operation, ParamDefinition } from '../types';

// Two lists in, one list out. Both operands are fields rather than one field
// and a param, so either side can be fed by the block above it: collect a list
// upstream, then subtract a known-good list from it.

const listFields = [
  { id: 'a', label: 'List A', long: true },
  { id: 'b', label: 'List B', long: true },
];

const caseParam: ParamDefinition = {
  id: 'case',
  label: 'Compare',
  kind: 'select',
  options: [
    { value: 'sensitive', label: 'Case sensitive' },
    { value: 'insensitive', label: 'Ignore case' },
  ],
  default: 'sensitive',
};

const separatorParam: ParamDefinition = {
  id: 'separator',
  label: 'Items are',
  kind: 'select',
  options: [
    { value: 'line', label: 'One per line' },
    { value: 'comma', label: 'Comma separated' },
    { value: 'space', label: 'Space separated' },
    { value: 'semicolon', label: 'Semicolon separated' },
    { value: 'tab', label: 'Tab separated' },
  ],
  default: 'line',
};

const sortParam: ParamDefinition = {
  id: 'sort',
  label: 'Order',
  kind: 'select',
  options: [
    { value: 'no', label: 'As first seen' },
    { value: 'yes', label: 'Sorted' },
  ],
  default: 'no',
};

const optionsOf = (params: Record<string, string>): SetOptions => ({
  caseSensitive: params.case !== 'insensitive',
  sort: params.sort === 'yes',
  separator: isSeparator(params.separator) ? (params.separator as Separator) : 'line',
});

// The picker shows a flat list of names, so each one has to read on its own.
const blockName: Record<SetOperation, string> = {
  union: 'Set Union',
  intersection: 'Set Intersection',
  difference: 'Set Difference (A minus B)',
  'reverse-difference': 'Set Difference (B minus A)',
  'symmetric-difference': 'Set Symmetric Difference',
};

const setOperation = (operation: SetOperation): Operation => ({
  id: `set-${operation}`,
  name: blockName[operation],
  category: 'text',
  inputs: listFields,
  params: [caseParam, separatorParam, sortParam],
  fn: (_input, params) =>
    applySetOperation(params.a ?? '', params.b ?? '', operation, optionsOf(params)).joined,
});

export const setOperations: Operation[] = SET_OPERATIONS.map(setOperation);
