import { levenshtein, formatLevenshtein } from '@/Components/Functions/TextLevenshteinTools/logic';
import { hammingDistance } from '@/Components/Functions/HammingTools/logic';
import { formatSimilarityPair } from '@/Components/Functions/TextSimilarityTools/logic';
import {
  haversineDistance,
  initialBearing,
  compassPoint,
  latError,
  lonError,
  KM_TO_MILES,
  KM_TO_NAUTICAL_MILES,
} from '@/Components/Functions/HaversineTools/logic';
import { dateDiff } from '@/Components/Functions/DateDiffTools/logic';
import { Operation } from '../types';

// Operations that compare two values. Each one takes its operands as named
// fields, so the block shows both boxes and the previous block can feed
// either side.

const pairFields = [
  { id: 'a', label: 'Text A' },
  { id: 'b', label: 'Text B' },
];

function required(params: Record<string, string>, id: string, label: string): string {
  const value = params[id] ?? '';
  if (value === '') throw new Error(`${label} is empty`);
  return value;
}

function coordinate(params: Record<string, string>, id: string, label: string, axis: 'lat' | 'lon'): number {
  const raw = required(params, id, label).trim();
  const value = Number(raw);
  const problem = axis === 'lat' ? latError(value) : lonError(value);
  if (problem) throw new Error(`${label}: ${problem}`);
  return value;
}

const levenshteinOp: Operation = {
  id: 'levenshtein',
  name: 'Levenshtein Distance',
  category: 'text',
  inputs: pairFields,
  params: [],
  fn: (_input, p) => String(levenshtein(p.a ?? '', p.b ?? '')),
};

const editDistanceReportOp: Operation = {
  id: 'edit-distance-report',
  name: 'Edit Distance Report',
  category: 'analysis',
  inputs: pairFields,
  params: [],
  terminal: true,
  fn: (_input, p) => formatLevenshtein(p.a ?? '', p.b ?? ''),
};

const hammingOp: Operation = {
  id: 'hamming-distance',
  name: 'Hamming Distance',
  category: 'text',
  inputs: pairFields,
  params: [],
  fn: (_input, p) => {
    const a = p.a ?? '';
    const b = p.b ?? '';
    if (a.length !== b.length) {
      throw new Error(`Text A (${a.length} chars) and Text B (${b.length} chars) must be the same length`);
    }
    return String(hammingDistance(a, b));
  },
};

const similarityOp: Operation = {
  id: 'text-similarity',
  name: 'Text Similarity',
  category: 'analysis',
  inputs: pairFields,
  params: [],
  terminal: true,
  fn: (_input, p) => formatSimilarityPair(required(p, 'a', 'Text A'), required(p, 'b', 'Text B')),
};

const haversineOp: Operation = {
  id: 'haversine',
  name: 'Haversine Distance',
  category: 'analysis',
  inputs: [
    { id: 'lat1', label: 'Lat 1', placeholder: '51.5074' },
    { id: 'lon1', label: 'Lon 1', placeholder: '-0.1278' },
    { id: 'lat2', label: 'Lat 2', placeholder: '48.8566' },
    { id: 'lon2', label: 'Lon 2', placeholder: '2.3522' },
  ],
  params: [],
  terminal: true,
  fn: (_input, p) => {
    const lat1 = coordinate(p, 'lat1', 'Lat 1', 'lat');
    const lon1 = coordinate(p, 'lon1', 'Lon 1', 'lon');
    const lat2 = coordinate(p, 'lat2', 'Lat 2', 'lat');
    const lon2 = coordinate(p, 'lon2', 'Lon 2', 'lon');
    const km = haversineDistance(lat1, lon1, lat2, lon2);
    const bearing = initialBearing(lat1, lon1, lat2, lon2);
    return [
      `From:            ${lat1}, ${lon1}`,
      `To:              ${lat2}, ${lon2}`,
      '',
      `Distance:        ${km.toFixed(3)} km`,
      `                 ${(km * KM_TO_MILES).toFixed(3)} mi`,
      `                 ${(km * KM_TO_NAUTICAL_MILES).toFixed(3)} nmi`,
      `Initial bearing: ${bearing.toFixed(1)}° (${compassPoint(bearing)})`,
    ].join('\n');
  },
};

const dateDiffOp: Operation = {
  id: 'date-diff',
  name: 'Date Difference',
  category: 'analysis',
  inputs: [
    { id: 'from', label: 'Date 1', placeholder: 'YYYY-MM-DD' },
    { id: 'to', label: 'Date 2', placeholder: 'YYYY-MM-DD' },
  ],
  params: [],
  terminal: true,
  fn: (_input, p) => dateDiff(required(p, 'from', 'Date 1'), required(p, 'to', 'Date 2')),
};

export const compareOperations: Operation[] = [
  levenshteinOp,
  editDistanceReportOp,
  hammingOp,
  similarityOp,
  haversineOp,
  dateDiffOp,
];
