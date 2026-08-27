export type RegexMatch = {
  match: string;
  index: number;
  endIndex: number;
  groups: Record<string, string | undefined> | null;
  captureGroups: (string | undefined)[];
};

export type RegexTestResult = {
  matches: RegexMatch[];
  matchCount: number;
  isValid: boolean;
  error: string | null;
  flags: string;
};

export type RegexFlags = {
  global: boolean;
  ignoreCase: boolean;
  multiline: boolean;
  dotAll: boolean;
};

export function buildFlags(flags: RegexFlags): string {
  let f = '';
  if (flags.global) f += 'g';
  if (flags.ignoreCase) f += 'i';
  if (flags.multiline) f += 'm';
  if (flags.dotAll) f += 's';
  return f;
}

export function testRegex(pattern: string, testString: string, flags: RegexFlags): RegexTestResult {
  if (!pattern) {
    return { matches: [], matchCount: 0, isValid: true, error: null, flags: buildFlags(flags) };
  }

  const flagStr = buildFlags(flags);

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flagStr);
  } catch (e) {
    return {
      matches: [],
      matchCount: 0,
      isValid: false,
      error: e instanceof Error ? e.message : 'Invalid regular expression',
      flags: flagStr,
    };
  }

  if (!testString) {
    return { matches: [], matchCount: 0, isValid: true, error: null, flags: flagStr };
  }

  const matches: RegexMatch[] = [];

  if (flags.global) {
    let m: RegExpExecArray | null;
    // Reset lastIndex just in case
    regex.lastIndex = 0;
    let iterations = 0;
    const MAX_ITERATIONS = 10000;
    while ((m = regex.exec(testString)) !== null && iterations < MAX_ITERATIONS) {
      iterations++;
      matches.push({
        match: m[0],
        index: m.index,
        endIndex: m.index + m[0].length,
        groups: m.groups ? Object.assign({}, m.groups) : null,
        captureGroups: m.slice(1),
      });
      // Prevent infinite loop on zero-length matches
      if (m[0].length === 0) {
        regex.lastIndex++;
      }
    }
  } else {
    const m = regex.exec(testString);
    if (m) {
      matches.push({
        match: m[0],
        index: m.index,
        endIndex: m.index + m[0].length,
        groups: m.groups ? Object.assign({}, m.groups) : null,
        captureGroups: m.slice(1),
      });
    }
  }

  return {
    matches,
    matchCount: matches.length,
    isValid: true,
    error: null,
    flags: flagStr,
  };
}
