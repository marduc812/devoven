// Regex Flavor Converter

export type RegexFlavor = 'javascript' | 'python' | 'pcre' | 'posix_ere';

export interface RegexConvertResult {
  converted: string;
  notes: string[];
}

const FLAVOR_LABELS: Record<RegexFlavor, string> = {
  javascript: 'JavaScript',
  python: 'Python (re)',
  pcre: 'PCRE',
  posix_ere: 'POSIX ERE',
};

export function getFlavorLabel(flavor: RegexFlavor): string {
  return FLAVOR_LABELS[flavor];
}

export function allFlavors(): RegexFlavor[] {
  return ['javascript', 'python', 'pcre', 'posix_ere'];
}

/**
 * Convert a regex pattern from one flavor to another.
 * Returns the converted pattern and notes about incompatibilities.
 */
export function convertRegex(
  pattern: string,
  from: RegexFlavor,
  to: RegexFlavor,
): RegexConvertResult {
  if (!pattern.trim()) return { converted: '', notes: [] };
  if (from === to) return { converted: pattern, notes: ['Source and target flavors are the same.'] };

  let result = pattern;
  const notes: string[] = [];

  // Step 1: Normalize named groups to a common form (JS/PCRE style: (?<name>))
  // Python uses (?P<name>...) for named groups
  if (from === 'python') {
    result = result.replace(/\(\?P<(\w+)>/g, '(?<$1>');
    result = result.replace(/\(\?P=(\w+)\)/g, '\\k<$1>');
  }

  // POSIX ERE has no named groups
  if (from === 'posix_ere') {
    if (/\(\?[<P]/.test(result)) {
      notes.push('POSIX ERE does not support named groups.');
    }
  }

  // Step 2: Convert to target flavor

  // Named groups
  if (to === 'python') {
    result = result.replace(/\(\?<(\w+)>/g, '(?P<$1>');
    result = result.replace(/\\k<(\w+)>/g, '(?P=$1)');
  } else if (to === 'posix_ere') {
    // Remove named group syntax — POSIX ERE doesn't support it
    if (/\(\?<\w+>/.test(result)) {
      result = result.replace(/\(\?<\w+>/g, '(');
      notes.push('Named groups converted to plain capture groups (POSIX ERE has no named groups).');
    }
    if (/\\k<\w+>/.test(result)) {
      notes.push('Named backreferences (\\k<name>) are not supported in POSIX ERE — converted to \\1 (may be incorrect).');
      result = result.replace(/\\k<(\w+)>/g, '\\1');
    }
  }
  // For JS and PCRE named groups are (?<name>) — already normalized

  // Lookahead/lookbehind
  if (to === 'posix_ere') {
    if (/\(\?[=!]/.test(result)) {
      notes.push('Lookahead (?=...) / (?!...) is not supported in POSIX ERE.');
    }
    if (/\(\?<[=!]/.test(result)) {
      notes.push('Lookbehind (?<=...) / (?<!...) is not supported in POSIX ERE.');
    }
  }

  // Possessive quantifiers (PCRE only: *+, ++, ?+)
  if (from === 'pcre') {
    if (/[*+?]\+/.test(result) && to !== 'pcre') {
      notes.push('Possessive quantifiers (*+, ++, ?+) are PCRE-only and not supported in the target flavor.');
    }
  }
  if (to !== 'pcre' && from !== 'pcre') {
    // nothing to do
  }

  // Atomic groups (PCRE: (?>...))
  if (/\(\?>/.test(result)) {
    if (to !== 'pcre') {
      notes.push('Atomic groups (?>) are PCRE-only and not supported in the target flavor.');
      if (to === 'javascript') {
        notes.push('JavaScript supports atomic groups via (?>...) in newer engines (v8 >= v12), but not universally.');
      }
    }
  }

  // Unicode property escapes
  if (/\\[pP]\{/.test(result)) {
    if (to === 'posix_ere') {
      notes.push('Unicode property escapes (\\p{...}) are not supported in POSIX ERE.');
    } else if (to === 'javascript') {
      notes.push('Unicode property escapes (\\p{...}) require the /u or /v flag in JavaScript.');
    }
  }

  // Verbose/comment mode (?x) — Python/PCRE only
  if (/\(\?x\)/.test(result) || /\(\?[imsx]*x[imsx]*\)/.test(result)) {
    if (to === 'javascript' || to === 'posix_ere') {
      notes.push('Verbose mode (?x) is not supported in ' + getFlavorLabel(to) + '.');
    }
  }

  // Inline flags
  // Python/PCRE: (?i), (?m), (?s), (?x)
  // JS: flags on regex literal, not inline
  if (/\(\?[imsux]+\)/.test(result) && to === 'javascript') {
    notes.push('Inline flags (e.g. (?i)) are not supported in JavaScript — use regex flags instead (e.g. /pattern/i).');
  }
  if (/\(\?[imsux]+\)/.test(result) && to === 'posix_ere') {
    notes.push('Inline flags (e.g. (?i)) are not supported in POSIX ERE.');
  }

  // Non-capturing groups (?:...)
  if (to === 'posix_ere') {
    if (/\(\?:/.test(result)) {
      notes.push('Non-capturing groups (?:...) are not standard in POSIX ERE. Some tools support them as an extension.');
    }
  }

  // Python re-specific: (?P#comment) — rare, skip

  // \A and \Z anchors (Python/PCRE) vs ^ and $ (JS/POSIX with multiline)
  if (from === 'python' || from === 'pcre') {
    if (/\\A/.test(result) && (to === 'javascript' || to === 'posix_ere')) {
      notes.push('\\A (start of string) converted to ^ (use without multiline flag for equivalent behavior).');
      result = result.replace(/\\A/g, '^');
    }
    if (/\\Z/.test(result) && (to === 'javascript' || to === 'posix_ere')) {
      notes.push('\\Z (end of string) converted to $ (use without multiline flag for equivalent behavior).');
      result = result.replace(/\\Z/g, '$');
    }
    if (/\\z/.test(result) && to === 'javascript') {
      notes.push('\\z (absolute end of string) converted to $.');
      result = result.replace(/\\z/g, '$');
    }
  }
  if ((to === 'python' || to === 'pcre') && (from === 'javascript' || from === 'posix_ere')) {
    // Can't reliably convert ^ to \A without knowing multiline intent
  }

  // \b word boundary — universal, no conversion needed

  if (notes.length === 0) {
    notes.push('Pattern converted successfully. Review for edge cases.');
  }

  return { converted: result, notes };
}
