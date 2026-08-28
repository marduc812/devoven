import { OperationCategory } from '@/lib/blocks/types';

export const CATEGORY_ORDER: OperationCategory[] = [
  'encoding',
  'hashing',
  'conversion',
  'data',
  'text',
  'network',
  'analysis',
];

export const categoryLabel: Record<OperationCategory, string> = {
  encoding:   'Encoding',
  hashing:    'Hashing',
  conversion: 'Conversion',
  data:       'Data Format',
  text:       'Text',
  network:    'Network',
  analysis:   'Analysis',
};

export const categoryShortLabel: Record<OperationCategory, string> = {
  encoding:   'Encoding',
  hashing:    'Hashing',
  conversion: 'Conversion',
  data:       'Data',
  text:       'Text',
  network:    'Network',
  analysis:   'Analysis',
};

export const categoryAccent: Record<OperationCategory, string> = {
  encoding:   'bg-amber-400',
  hashing:    'bg-teal-400',
  conversion: 'bg-indigo-400',
  data:       'bg-cyan-400',
  text:       'bg-rose-400',
  network:    'bg-sky-400',
  analysis:   'bg-lime-400',
};
