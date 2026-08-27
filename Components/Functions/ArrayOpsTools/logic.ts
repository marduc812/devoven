// Array / List Operations

export type SortMode = 'alpha-asc' | 'alpha-desc' | 'numeric-asc' | 'numeric-desc' | 'length-asc' | 'length-desc';
export type MapOp = 'none' | 'uppercase' | 'lowercase' | 'trim' | 'quote-single' | 'quote-double' | 'prefix' | 'suffix';
export type JoinMode = 'comma' | 'newline' | 'pipe' | 'space' | 'tab' | 'none';
export type ArrayOperation = 'sort' | 'reverse' | 'deduplicate' | 'shuffle' | 'filter' | 'map' | 'slice-first' | 'slice-last';

export interface ArrayOpsOptions {
  operation: ArrayOperation;
  sortMode?: SortMode;
  mapOp?: MapOp;
  mapArg?: string;       // prefix/suffix text
  filterRegex?: string;  // regex string for filter
  sliceN?: number;       // N for slice-first / slice-last
  joinMode?: JoinMode;
}

export interface ArrayOpsResult {
  items: string[];
  joined: string;
  count: number;
  error: string | null;
}

function parseItems(input: string): string[] {
  return input.split('\n').map(function(s) { return s.trimEnd(); }).filter(function(s) { return s !== ''; });
}

function joinItems(items: string[], mode: JoinMode): string {
  switch (mode) {
    case 'comma': return items.join(', ');
    case 'newline': return items.join('\n');
    case 'pipe': return items.join(' | ');
    case 'space': return items.join(' ');
    case 'tab': return items.join('\t');
    case 'none': return items.join('\n');
    default: return items.join('\n');
  }
}

function sortItems(items: string[], mode: SortMode): string[] {
  const copy = items.slice();
  switch (mode) {
    case 'alpha-asc':
      copy.sort(function(a, b) { return a.localeCompare(b); });
      break;
    case 'alpha-desc':
      copy.sort(function(a, b) { return b.localeCompare(a); });
      break;
    case 'numeric-asc':
      copy.sort(function(a, b) { return parseFloat(a) - parseFloat(b); });
      break;
    case 'numeric-desc':
      copy.sort(function(a, b) { return parseFloat(b) - parseFloat(a); });
      break;
    case 'length-asc':
      copy.sort(function(a, b) { return a.length - b.length; });
      break;
    case 'length-desc':
      copy.sort(function(a, b) { return b.length - a.length; });
      break;
  }
  return copy;
}

function shuffleItems(items: string[]): string[] {
  const copy = items.slice();
  // Fisher-Yates with Math.random()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
  }
  return copy;
}

function applyMap(items: string[], mapOp: MapOp, mapArg: string): string[] {
  return items.map(function(item) {
    switch (mapOp) {
      case 'uppercase': return item.toUpperCase();
      case 'lowercase': return item.toLowerCase();
      case 'trim': return item.trim();
      case 'quote-single': return "'" + item + "'";
      case 'quote-double': return '"' + item + '"';
      case 'prefix': return mapArg + item;
      case 'suffix': return item + mapArg;
      default: return item;
    }
  });
}

export function applyOperation(input: string, opts: ArrayOpsOptions): ArrayOpsResult {
  if (!input.trim()) return { items: [], joined: '', count: 0, error: null };

  let items = parseItems(input);
  let error: string | null = null;

  switch (opts.operation) {
    case 'sort':
      items = sortItems(items, opts.sortMode || 'alpha-asc');
      break;
    case 'reverse':
      items = items.slice().reverse();
      break;
    case 'deduplicate': {
      const seen = new Set<string>();
      items = items.filter(function(item) {
        if (seen.has(item)) return false;
        seen.add(item); return true;
      });
      break;
    }
    case 'shuffle':
      items = shuffleItems(items);
      break;
    case 'filter': {
      const pattern = opts.filterRegex || '';
      if (!pattern) { error = 'No filter regex provided.'; break; }
      let rx: RegExp;
      try {
        rx = new RegExp(pattern);
      } catch (e) {
        error = 'Invalid regex: ' + String(e);
        break;
      }
      items = items.filter(function(item) { return rx.test(item); });
      break;
    }
    case 'map':
      items = applyMap(items, opts.mapOp || 'none', opts.mapArg || '');
      break;
    case 'slice-first': {
      const n = opts.sliceN !== undefined ? opts.sliceN : 10;
      items = items.slice(0, n);
      break;
    }
    case 'slice-last': {
      const n = opts.sliceN !== undefined ? opts.sliceN : 10;
      items = items.slice(Math.max(0, items.length - n));
      break;
    }
  }

  const joinMode = opts.joinMode || 'newline';
  const joined = joinItems(items, joinMode);

  return { items, joined, count: items.length, error };
}
