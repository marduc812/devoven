export interface PhoneticAlphabets {
  nato: Record<string, string>;
  icao: Record<string, string>;
  oldBritish: Record<string, string>;
  german: Record<string, string>;
}

export const ALPHABETS: PhoneticAlphabets = {
  nato: {
    A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo',
    F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliet',
    K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar',
    P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
    U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee',
    Z: 'Zulu',
    '0': 'Zero', '1': 'One', '2': 'Two', '3': 'Three', '4': 'Four',
    '5': 'Five', '6': 'Six', '7': 'Seven', '8': 'Eight', '9': 'Nine',
  },
  icao: {
    A: 'Alfa', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo',
    F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett',
    K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar',
    P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
    U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'Xray', Y: 'Yankee',
    Z: 'Zulu',
    '0': 'Nadazero', '1': 'Unaone', '2': 'Bissotwo', '3': 'Terrathree',
    '4': 'Kartefour', '5': 'Pantafive', '6': 'Soxisix', '7': 'Setteseven',
    '8': 'Oktoeight', '9': 'Novenine',
  },
  oldBritish: {
    A: 'Ace', B: 'Beer', C: 'Cork', D: 'Dog', E: 'Edward',
    F: 'Freddy', G: 'George', H: 'Harry', I: 'Ink', J: 'Johnnie',
    K: 'King', L: 'London', M: 'Mother', N: 'Nuts', O: 'Orange',
    P: 'Peter', Q: 'Queen', R: 'Robert', S: 'Sugar', T: 'Tommy',
    U: 'Uncle', V: 'Vic', W: 'William', X: 'X-ray', Y: 'Yellow',
    Z: 'Zebra',
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  },
  german: {
    A: 'Anton', B: 'Berta', C: 'Cäsar', D: 'Dora', E: 'Emil',
    F: 'Friedrich', G: 'Gustav', H: 'Heinrich', I: 'Ida', J: 'Julius',
    K: 'Kaufmann', L: 'Ludwig', M: 'Martha', N: 'Nordpol', O: 'Otto',
    P: 'Paula', Q: 'Quelle', R: 'Richard', S: 'Samuel', T: 'Theodor',
    U: 'Ulrich', V: 'Viktor', W: 'Wilhelm', X: 'Xanthippe', Y: 'Ypsilon',
    Z: 'Zacharias',
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  },
};

export type AlphabetType = keyof PhoneticAlphabets;

export function textToPhonetic(text: string, alphabet: AlphabetType): string {
  const table = ALPHABETS[alphabet];
  const result: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toUpperCase();
    if (ch === ' ') {
      result.push('/ (space)');
    } else if (table[ch]) {
      result.push(`${text[i].toUpperCase()} - ${table[ch]}`);
    } else {
      result.push(`${text[i]} - [unknown]`);
    }
  }
  return result.join('\n');
}

export function phoneticToText(phonetic: string, alphabet: AlphabetType): string {
  const table = ALPHABETS[alphabet];
  const reversed: Record<string, string> = {};
  for (const key in table) {
    reversed[table[key].toLowerCase()] = key;
  }
  // Split by lines, commas, or multi-space
  const words = phonetic.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
  const chars: string[] = [];
  for (const word of words) {
    const lower = word.toLowerCase();
    if (lower === '/' || lower === '(space)' || lower === '/ (space)') {
      chars.push(' ');
    } else if (reversed[lower]) {
      chars.push(reversed[lower]);
    } else {
      chars.push('?');
    }
  }
  return chars.join('');
}

export function allAlphabetsForChar(ch: string): Record<AlphabetType, string> {
  const upper = ch.toUpperCase();
  return {
    nato: ALPHABETS.nato[upper] || '',
    icao: ALPHABETS.icao[upper] || '',
    oldBritish: ALPHABETS.oldBritish[upper] || '',
    german: ALPHABETS.german[upper] || '',
  };
}
