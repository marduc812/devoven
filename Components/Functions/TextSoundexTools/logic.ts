// Soundex algorithm
const SOUNDEX_MAP: Record<string, string> = {
  BFPV: '1', CGJKQSXYZ: '2', DT: '3', L: '4', MN: '5', R: '6'
};

function getSoundexCode(ch: string): string {
  const upper = ch.toUpperCase();
  for (const [group, code] of Object.entries(SOUNDEX_MAP)) {
    if (group.includes(upper)) return code;
  }
  return '0';
}

export function soundex(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z]/g, '');
  if (cleaned.length === 0) throw new Error('Input must contain at least one letter');
  const first = cleaned[0].toUpperCase();
  let code = first;
  let prev = getSoundexCode(first);
  for (let i = 1; i < cleaned.length && code.length < 4; i++) {
    const curr = getSoundexCode(cleaned[i]);
    if (curr !== '0' && curr !== prev) {
      code += curr;
    }
    if (!('HW'.includes(cleaned[i].toUpperCase()))) {
      prev = curr;
    }
  }
  return code.padEnd(4, '0');
}

// Metaphone algorithm (simplified)
const METAPHONE_VOWELS = 'AEIOU';
export function metaphone(word: string): string {
  let s = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (s.length === 0) return '';

  // Initial transformations
  if (s.startsWith('AE') || s.startsWith('GN') || s.startsWith('KN') || s.startsWith('PN') || s.startsWith('WR')) {
    s = s.slice(1);
  }
  if (s[0] === 'I' || s[0] === 'E') s = 'E' + s.slice(1);

  let result = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const prev = s[i - 1] ?? '';
    const next = s[i + 1] ?? '';
    const next2 = s[i + 2] ?? '';

    if (METAPHONE_VOWELS.includes(c) && i > 0) continue;

    switch (c) {
      case 'B':
        if (!(prev === 'M' && i === s.length - 1)) result += 'B';
        break;
      case 'C':
        if (next === 'I' || next === 'E' || next === 'Y') {
          result += 'S';
        } else if (next === 'H') {
          result += 'X'; i++;
        } else if (s.slice(i, i + 3) === 'CIA') {
          result += 'X'; i += 2;
        } else {
          result += 'K';
        }
        break;
      case 'D':
        if (next === 'G' && (next2 === 'E' || next2 === 'I' || next2 === 'Y')) {
          result += 'J'; i++;
        } else {
          result += 'T';
        }
        break;
      case 'F': result += 'F'; break;
      case 'G':
        if (next === 'H' && !METAPHONE_VOWELS.includes(s[i + 2] ?? '')) { i++; break; }
        if (next === 'N' && (i + 2 >= s.length)) break;
        if (next === 'I' || next === 'E' || next === 'Y') { result += 'J'; }
        else { result += 'K'; }
        break;
      case 'H':
        if (METAPHONE_VOWELS.includes(next) && !METAPHONE_VOWELS.includes(prev)) result += 'H';
        break;
      case 'J': result += 'J'; break;
      case 'K': if (prev !== 'C') result += 'K'; break;
      case 'L': result += 'L'; break;
      case 'M': result += 'M'; break;
      case 'N': result += 'N'; break;
      case 'P':
        if (next === 'H') { result += 'F'; i++; }
        else result += 'P';
        break;
      case 'Q': result += 'K'; break;
      case 'R': result += 'R'; break;
      case 'S':
        if ((next === 'I' || next === 'H') && (next2 === 'A' || next2 === 'O')) { result += 'X'; }
        else if (next === 'H') { result += 'X'; i++; }
        else if (s.slice(i, i + 3) === 'SCH') { result += 'SK'; i += 2; }
        else result += 'S';
        break;
      case 'T':
        if (next === 'H') { result += '0'; i++; }
        else if (next === 'I' && (next2 === 'A' || next2 === 'O')) { result += 'X'; }
        else result += 'T';
        break;
      case 'V': result += 'F'; break;
      case 'W': if (METAPHONE_VOWELS.includes(next)) result += 'W'; break;
      case 'X': result += 'KS'; break;
      case 'Y': if (METAPHONE_VOWELS.includes(next)) result += 'Y'; break;
      case 'Z': result += 'S'; break;
      default: if (METAPHONE_VOWELS.includes(c)) result += c; break;
    }
  }
  return result;
}

// Double Metaphone (simplified primary/secondary)
export function doubleMetaphone(word: string): { primary: string; secondary: string } {
  const primary = metaphone(word);
  // Secondary is a slight variant for alternate pronunciations
  // Simple approximation: handle some common divergences
  let secondary = primary;
  const upper = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (upper.startsWith('GN') || upper.startsWith('KN') || upper.startsWith('PN')) {
    secondary = 'N' + primary.slice(1);
  } else if (upper.includes('PH')) {
    secondary = primary.replace('F', 'PH');
  }
  return { primary, secondary };
}

export function analyzeSoundex(input: string): string {
  const words = input.split('\n').map(w => w.trim()).filter(w => w.length > 0);
  if (words.length === 0) throw new Error('Enter one or more words');

  const lines: string[] = [];

  // Show famous similar-sounding pairs if only 1 word
  const famousPairs = [
    ['Robert', 'Rupert'], ['Johnson', 'Jonson'], ['Williams', 'Willems'],
    ['Jackson', 'Jakson'], ['Anderson', 'Andersen']
  ];

  for (const word of words) {
    lines.push(`Word: ${word}`);
    lines.push(`${'─'.repeat(40)}`);
    try {
      const sdx = soundex(word);
      const meta = metaphone(word);
      const dm = doubleMetaphone(word);
      lines.push(`Soundex:           ${sdx}`);
      lines.push(`Metaphone:         ${meta}`);
      lines.push(`Double Metaphone:  ${dm.primary} / ${dm.secondary}`);
      lines.push('');
      lines.push('Soundex rules:');
      lines.push('  Letters B,F,P,V    → 1');
      lines.push('  Letters C,G,J,K,Q,S,X,Y,Z → 2');
      lines.push('  Letters D,T        → 3');
      lines.push('  Letter  L          → 4');
      lines.push('  Letters M,N        → 5');
      lines.push('  Letter  R          → 6');
      lines.push('  H, W, vowels       → ignored (after first letter)');
      lines.push('');
      // Find similar-sounding famous names
      const similar = famousPairs.filter(p => {
        try { return soundex(p[0]) === sdx || soundex(p[1]) === sdx; } catch { return false; }
      });
      if (similar.length > 0) {
        lines.push('Similar-sounding names (same Soundex):');
        for (const [a, b] of similar) {
          lines.push(`  ${a} ↔ ${b} (both ${soundex(a)})`);
        }
      } else {
        lines.push('Example pairs with same Soundex:');
        lines.push('  Robert   ↔ Rupert    (R163)');
        lines.push('  Johnson  ↔ Jonson    (J525)');
        lines.push('  Williams ↔ Willems   (W452)');
      }
    } catch (e) {
      lines.push(`Error: ${(e as Error).message}`);
    }
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
