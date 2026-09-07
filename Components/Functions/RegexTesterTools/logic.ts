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
  /** True when the text held more matches than MAX_MATCHES and the rest were dropped. */
  truncated: boolean;
};

/**
 * A global pattern over a large text can match hundreds of thousands of times,
 * and every match becomes a highlight and a details card. Collecting them all
 * costs more than anyone can read, so the scan stops here and says so rather
 * than reporting a match count that is quietly wrong.
 */
export const MAX_MATCHES = 10000;

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
    return { matches: [], matchCount: 0, isValid: true, error: null, flags: buildFlags(flags), truncated: false };
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
      truncated: false,
    };
  }

  if (!testString) {
    return { matches: [], matchCount: 0, isValid: true, error: null, flags: flagStr, truncated: false };
  }

  const matches: RegexMatch[] = [];
  let truncated = false;

  if (flags.global) {
    let m: RegExpExecArray | null;
    // Reset lastIndex just in case
    regex.lastIndex = 0;
    while ((m = regex.exec(testString)) !== null) {
      // The cap is tested after a successful exec, so it only ever trips once a
      // match beyond it has actually been found: a text with exactly MAX_MATCHES
      // matches is reported in full, not as truncated.
      if (matches.length === MAX_MATCHES) {
        truncated = true;
        break;
      }
      matches.push({
        match: m[0],
        index: m.index,
        endIndex: m.index + m[0].length,
        groups: m.groups ? Object.assign({}, m.groups) : null,
        captureGroups: m.slice(1),
      });
      // Prevent infinite loop on zero-length matches. The step is the whole
      // character: nudging by one code unit lands inside a surrogate pair and
      // reports a third, meaningless match in the middle of an emoji.
      if (m[0].length === 0) {
        const high = testString.charCodeAt(regex.lastIndex);
        const low = testString.charCodeAt(regex.lastIndex + 1);
        const pair = high >= 0xd800 && high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff;
        regex.lastIndex += pair ? 2 : 1;
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
    truncated,
  };
}
