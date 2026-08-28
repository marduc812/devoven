const LEET_MAP: Record<string, string> = {
  a: '4', e: '3', i: '1', o: '0', s: '5', t: '7', l: '1', g: '9', b: '8', z: '2',
  A: '4', E: '3', I: '1', O: '0', S: '5', T: '7', L: '1', G: '9', B: '8', Z: '2',
};

const REVERSE_MAP: Record<string, string> = {
  '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '7': 't', '9': 'g', '8': 'b', '2': 'z',
};

export function toLeet(text: string): string {
  return text.split('').map(ch => LEET_MAP[ch] ?? ch).join('');
}

export function fromLeet(text: string): string {
  return text.split('').map(ch => REVERSE_MAP[ch] ?? ch).join('');
}

// Advanced leet with more substitutions
const ADVANCED_MAP: Record<string, string> = {
  a: '@', e: '€', i: '!', o: '()', s: '$', t: '+', l: '|', g: '6', b: '|3', w: 'vv',
};

export function toAdvancedLeet(text: string): string {
  return text.toLowerCase().split('').map(ch => ADVANCED_MAP[ch] ?? LEET_MAP[ch.toLowerCase()] ?? ch).join('');
}
