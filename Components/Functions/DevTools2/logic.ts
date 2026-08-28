// ─── C1. Aspect Ratio Calculator ─────────────────────────────────────────────

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function simplifyRatio(w: number, h: number): {w: number; h: number; ratio: string} {
  if (w <= 0 || h <= 0) throw new Error('Dimensions must be positive');
  const d = gcd(Math.round(w), Math.round(h));
  const sw = Math.round(w) / d;
  const sh = Math.round(h) / d;
  return {w: sw, h: sh, ratio: `${sw}:${sh}`};
}

export function ratioToDimensions(ratioW: number, ratioH: number, knownSide: 'width' | 'height', knownValue: number): {width: number; height: number} {
  if (knownSide === 'width') {
    return {width: knownValue, height: Math.round((knownValue * ratioH) / ratioW)};
  }
  return {width: Math.round((knownValue * ratioW) / ratioH), height: knownValue};
}

export function commonAspectRatios(): {name: string; w: number; h: number}[] {
  return [
    {name:'16:9 (HD/FHD)', w:16, h:9},
    {name:'4:3 (Standard)', w:4, h:3},
    {name:'1:1 (Square)', w:1, h:1},
    {name:'3:2 (DSLR)', w:3, h:2},
    {name:'21:9 (Ultrawide)', w:21, h:9},
    {name:'9:16 (Portrait/Mobile)', w:9, h:16},
    {name:'2:1 (2.00:1)', w:2, h:1},
    {name:'4:5 (Instagram Portrait)', w:4, h:5},
  ];
}

// ─── C2. Fake Data Generator ──────────────────────────────────────────────────

export type FakeDataType = 'name' | 'email' | 'phone' | 'address' | 'uuid' | 'ipv4' | 'date' | 'company' | 'url' | 'hex-color';

const FIRST_NAMES = ['James','Mary','John','Patricia','Robert','Jennifer','Michael','Linda','William','Barbara','David','Susan','Richard','Jessica','Joseph','Sarah','Thomas','Karen','Charles','Lisa','Christopher','Nancy','Daniel','Betty','Matthew','Margaret','Anthony','Sandra','Mark','Ashley'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson'];
const DOMAINS = ['gmail.com','yahoo.com','hotmail.com','outlook.com','example.com','test.org','mail.io','devoven.com'];
const STREETS = ['Main St','Oak Ave','Maple Dr','Cedar Ln','Pine Rd','Elm St','Park Ave','Lake Dr','River Rd','Hill Ln'];
const CITIES = ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose'];
const COMPANIES = ['Acme Corp','TechVision','DataSoft','CloudNine','PixelWorks','NexGen','AlphaCode','ByteForge','NetSphere','CyberLink'];

function seededRand(seed: number): number {
  // Simple LCG for deterministic generation per index
  return ((seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRand(seed) * arr.length)];
}

export function generateFakeItem(type: FakeDataType, index: number): string {
  const s = (offset: number) => Math.floor(seededRand(index * 31 + offset) * 10000);
  switch (type) {
    case 'name': return `${pick(FIRST_NAMES, s(1))} ${pick(LAST_NAMES, s(2))}`;
    case 'email': {
      const fn = pick(FIRST_NAMES, s(1)).toLowerCase();
      const ln = pick(LAST_NAMES, s(2)).toLowerCase();
      return `${fn}.${ln}${s(3) % 100}@${pick(DOMAINS, s(4))}`;
    }
    case 'phone': return `+1 (${400 + s(1) % 500}) ${100 + s(2) % 900}-${1000 + s(3) % 9000}`;
    case 'address': return `${100 + s(1) % 9900} ${pick(STREETS, s(2))}, ${pick(CITIES, s(3))}, ${String.fromCharCode(65 + s(4) % 26)}${String.fromCharCode(65 + s(5) % 26)} ${10000 + s(6) % 90000}`;
    case 'uuid': {
      const hex = () => s(Math.random() * 100 | 0).toString(16).padStart(4, '0').slice(0, 4);
      return `${hex()}${hex()}-${hex()}-4${hex().slice(1)}-${(8 + s(7) % 4).toString(16)}${hex().slice(1)}-${hex()}${hex()}${hex()}`;
    }
    case 'ipv4': return `${10 + s(1) % 245}.${s(2) % 256}.${s(3) % 256}.${1 + s(4) % 254}`;
    case 'date': {
      const year = 1970 + s(1) % 55;
      const month = 1 + s(2) % 12;
      const day = 1 + s(3) % 28;
      return `${year}-${month.toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
    }
    case 'company': return pick(COMPANIES, s(1));
    case 'url': return `https://${pick(COMPANIES, s(1)).toLowerCase().replace(/\s/g, '')}.${pick(['com','io','org','net'], s(2))}`;
    case 'hex-color': return `#${s(1).toString(16).padStart(4,'0').slice(0,2)}${s(2).toString(16).padStart(4,'0').slice(0,2)}${s(3).toString(16).padStart(4,'0').slice(0,2)}`.toUpperCase();
    default: return '';
  }
}

export function generateFakeData(type: FakeDataType, count: number): string {
  return Array.from({length: count}, (_, i) => generateFakeItem(type, i + Date.now() % 1000)).join('\n');
}

// ─── C3. Color Shades Generator ───────────────────────────────────────────────

export function hexToHsl2(hex: string): {h: number; s: number; l: number} {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100)};
}

export function hslToHex2(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return `#${f(0).toString(16).padStart(2,'0')}${f(8).toString(16).padStart(2,'0')}${f(4).toString(16).padStart(2,'0')}`.toUpperCase();
}

export function generateShades(hex: string, steps = 10): {shade: number; hex: string; hsl: string}[] {
  const normalized = hex.startsWith('#') ? hex : '#' + hex;
  if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) throw new Error('Invalid hex color');
  const {h, s} = hexToHsl2(normalized);
  const result: {shade: number; hex: string; hsl: string}[] = [];
  for (let i = 0; i < steps; i++) {
    const l = Math.round(95 - (i / (steps - 1)) * 90); // 95% down to 5%
    const shadeNum = Math.round((i / (steps - 1)) * 900) + 50;
    const shadeHex = hslToHex2(h, s, l);
    result.push({shade: shadeNum, hex: shadeHex, hsl: `hsl(${h}, ${s}%, ${l}%)`});
  }
  return result;
}
