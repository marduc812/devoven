import {
  yamlToToml,
  tomlToYaml,
  iniToJson,
  jsonToIni,
  convertBase,
  getBaseLabel,
  flattenJson,
  unflattenJson,
  toHexDump,
  encodeBytes,
  hexDumpRows,
  byteToPrintable,
  classifyByte,
  encodeUnicodeEscapes,
  decodeUnicodeEscapes,
  formatNumber,
  unformatNumber,
} from '../Components/Functions/ExtraConverters/logic';

// ─── yamlToToml ───────────────────────────────────────────────────────────────

describe('yamlToToml', () => {
  it('converts a flat YAML object to TOML', () => {
    const result = yamlToToml('name: Alice\nage: 30');
    expect(result).toContain('name');
    expect(result).toContain('Alice');
  });
  it('converts nested YAML to TOML', () => {
    const result = yamlToToml('database:\n  host: localhost\n  port: 5432');
    expect(result).toContain('[database]');
    expect(result).toContain('host');
  });
  it('handles YAML with boolean values', () => {
    const result = yamlToToml('enabled: true\ndisabled: false');
    expect(result).toContain('true');
    expect(result).toContain('false');
  });
  it('returns empty string for empty input', () => {
    expect(yamlToToml('')).toBe('');
    expect(yamlToToml('   ')).toBe('');
  });
  it('throws when YAML is not an object', () => {
    expect(() => yamlToToml('- item1\n- item2')).toThrow();
  });
});

// ─── tomlToYaml ───────────────────────────────────────────────────────────────

describe('tomlToYaml', () => {
  it('converts a flat TOML to YAML', () => {
    const result = tomlToYaml('name = "Alice"\nage = 30');
    expect(result).toContain('name: Alice');
    expect(result).toContain('age: 30');
  });
  it('converts a TOML table to YAML', () => {
    const result = tomlToYaml('[database]\nhost = "localhost"\nport = 5432');
    expect(result).toContain('database:');
    expect(result).toContain('host: localhost');
  });
  it('handles TOML boolean values', () => {
    const result = tomlToYaml('enabled = true');
    expect(result).toContain('true');
  });
  it('returns empty string for empty input', () => {
    expect(tomlToYaml('')).toBe('');
    expect(tomlToYaml('   ')).toBe('');
  });
  it('throws on invalid TOML', () => {
    expect(() => tomlToYaml('not valid toml =')).toThrow();
  });
});

// ─── iniToJson ────────────────────────────────────────────────────────────────

describe('iniToJson', () => {
  it('parses simple key=value pairs', () => {
    const result = JSON.parse(iniToJson('key = value\nnum = 42'));
    expect(result.key).toBe('value');
    expect(result.num).toBe(42);
  });
  it('parses sections', () => {
    const result = JSON.parse(iniToJson('[section]\nfoo = bar'));
    expect(result.section.foo).toBe('bar');
  });
  it('parses boolean values', () => {
    const result = JSON.parse(iniToJson('enabled = true\ndisabled = false'));
    expect(result.enabled).toBe(true);
    expect(result.disabled).toBe(false);
  });
  it('returns empty string for empty input', () => {
    expect(iniToJson('')).toBe('');
    expect(iniToJson('   ')).toBe('');
  });
  it('ignores comment lines', () => {
    const result = JSON.parse(iniToJson('; comment\n# also comment\nkey = val'));
    expect(result.key).toBe('val');
    expect(Object.keys(result)).toHaveLength(1);
  });
});

// ─── jsonToIni ────────────────────────────────────────────────────────────────

describe('jsonToIni', () => {
  it('converts flat JSON to INI', () => {
    const result = jsonToIni('{"name":"Alice","age":30}');
    expect(result).toContain('name = Alice');
    expect(result).toContain('age = 30');
  });
  it('converts nested JSON to INI sections', () => {
    const result = jsonToIni('{"db":{"host":"localhost","port":5432}}');
    expect(result).toContain('[db]');
    expect(result).toContain('host = localhost');
  });
  it('handles mixed flat and section values', () => {
    const result = jsonToIni('{"app":"myapp","db":{"host":"localhost"}}');
    expect(result).toContain('app = myapp');
    expect(result).toContain('[db]');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToIni('')).toBe('');
    expect(jsonToIni('   ')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToIni('{bad')).toThrow();
  });
});

// ─── convertBase ──────────────────────────────────────────────────────────────

describe('convertBase', () => {
  it('converts decimal to hex', () => {
    expect(convertBase('255', 10, 16)).toBe('FF');
  });
  it('converts binary to decimal', () => {
    expect(convertBase('1010', 2, 10)).toBe('10');
  });
  it('converts hex to binary', () => {
    expect(convertBase('A', 16, 2)).toBe('1010');
  });
  it('returns empty string for empty input', () => {
    expect(convertBase('', 10, 16)).toBe('');
    expect(convertBase('   ', 10, 16)).toBe('');
  });
  it('throws for invalid base-N numbers', () => {
    expect(() => convertBase('Z', 10, 16)).toThrow();
    expect(() => convertBase('2', 2, 10)).toThrow();
  });
});

// ─── getBaseLabel ─────────────────────────────────────────────────────────────

describe('getBaseLabel', () => {
  it('returns Binary for base 2', () => expect(getBaseLabel(2)).toBe('Binary'));
  it('returns Decimal for base 10', () => expect(getBaseLabel(10)).toBe('Decimal'));
  it('returns Hexadecimal for base 16', () => expect(getBaseLabel(16)).toBe('Hexadecimal'));
  it('returns a generic label for unknown base', () => expect(getBaseLabel(5)).toBe('Base 5'));
  it('returns Octal for base 8', () => expect(getBaseLabel(8)).toBe('Octal'));
});

// ─── flattenJson ──────────────────────────────────────────────────────────────

describe('flattenJson', () => {
  it('flattens nested object', () => {
    const result = JSON.parse(flattenJson('{"a":{"b":{"c":1}}}'));
    expect(result['a.b.c']).toBe(1);
  });
  it('flattens arrays with bracket notation', () => {
    const result = JSON.parse(flattenJson('{"arr":[1,2,3]}'));
    expect(result['arr[0]']).toBe(1);
    expect(result['arr[2]']).toBe(3);
  });
  it('leaves flat objects unchanged', () => {
    const result = JSON.parse(flattenJson('{"a":1,"b":2}'));
    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
  });
  it('returns empty string for empty input', () => {
    expect(flattenJson('')).toBe('');
    expect(flattenJson('   ')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => flattenJson('{bad')).toThrow();
  });
});

// ─── unflattenJson ────────────────────────────────────────────────────────────

describe('unflattenJson', () => {
  it('unflattens dot notation', () => {
    const result = JSON.parse(unflattenJson('{"a.b.c":1}'));
    expect(result.a.b.c).toBe(1);
  });
  it('unflattens bracket notation', () => {
    const result = JSON.parse(unflattenJson('{"arr[0]":1,"arr[1]":2}'));
    expect(result.arr['0']).toBe(1);
  });
  it('handles flat objects', () => {
    const result = JSON.parse(unflattenJson('{"a":1,"b":2}'));
    expect(result.a).toBe(1);
  });
  it('returns empty string for empty input', () => {
    expect(unflattenJson('')).toBe('');
    expect(unflattenJson('   ')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => unflattenJson('{bad')).toThrow();
  });
});

// ─── toHexDump ────────────────────────────────────────────────────────────────

describe('toHexDump', () => {
  it('produces offset column', () => {
    const result = toHexDump('Hello');
    expect(result).toContain('00000000');
  });
  it('shows ASCII representation', () => {
    const result = toHexDump('ABC');
    expect(result).toContain('|ABC');
  });
  it('replaces non-printable chars with dot', () => {
    const result = toHexDump('\x01\x02\x03');
    expect(result).toContain('...');
  });
  it('returns empty string for empty input', () => {
    expect(toHexDump('')).toBe('');
  });
  it('handles multi-line output for long input', () => {
    const result = toHexDump('A'.repeat(32));
    const lines = result.split('\n');
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('00000010');
  });
});

// ─── encodeUnicodeEscapes ─────────────────────────────────────────────────────

describe('encodeUnicodeEscapes', () => {
  it('encodes non-ASCII characters', () => {
    expect(encodeUnicodeEscapes('é')).toBe('\\u00e9');
  });
  it('leaves ASCII unchanged', () => {
    expect(encodeUnicodeEscapes('Hello')).toBe('Hello');
  });
  it('encodes emoji as \\U', () => {
    const result = encodeUnicodeEscapes('😀');
    expect(result).toMatch(/^\\U/);
  });
  it('returns empty string for empty input', () => {
    expect(encodeUnicodeEscapes('')).toBe('');
  });
  it('handles mixed ASCII and non-ASCII', () => {
    const result = encodeUnicodeEscapes('Hi é');
    expect(result).toBe('Hi \\u00e9');
  });
});

// ─── decodeUnicodeEscapes ─────────────────────────────────────────────────────

describe('decodeUnicodeEscapes', () => {
  it('decodes \\uXXXX sequences', () => {
    expect(decodeUnicodeEscapes('\\u00e9')).toBe('é');
  });
  it('decodes \\UXXXXXXXX sequences', () => {
    const result = decodeUnicodeEscapes('\\U0001f600');
    expect(result).toBe('😀');
  });
  it('leaves ASCII unchanged', () => {
    expect(decodeUnicodeEscapes('Hello')).toBe('Hello');
  });
  it('returns empty string for empty input', () => {
    expect(decodeUnicodeEscapes('')).toBe('');
  });
  it('handles mixed encoded and plain text', () => {
    expect(decodeUnicodeEscapes('Hi \\u00e9')).toBe('Hi é');
  });
});

// ─── formatNumber ─────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formats with thousands separators (en-US)', () => {
    expect(formatNumber('1234567', 'en-US', 0)).toBe('1,234,567');
  });
  it('formats with 2 decimal places', () => {
    expect(formatNumber('1234.5', 'en-US', 2)).toBe('1,234.50');
  });
  it('formats with German locale', () => {
    const result = formatNumber('1234567', 'de-DE', 0);
    expect(result).toContain('1');
    expect(result).toContain('234');
  });
  it('returns empty string for empty input', () => {
    expect(formatNumber('', 'en-US', 0)).toBe('');
    expect(formatNumber('   ', 'en-US', 0)).toBe('');
  });
  it('throws for invalid number', () => {
    expect(() => formatNumber('abc', 'en-US', 0)).toThrow();
  });
});

// ─── unformatNumber ───────────────────────────────────────────────────────────

describe('unformatNumber', () => {
  it('removes thousands separators', () => {
    expect(unformatNumber('1,234,567')).toBe('1234567');
  });
  it('handles decimal numbers', () => {
    expect(unformatNumber('1,234.50')).toBe('1234.5');
  });
  it('handles plain numbers', () => {
    expect(unformatNumber('42')).toBe('42');
  });
  it('returns empty string for empty input', () => {
    expect(unformatNumber('')).toBe('');
    expect(unformatNumber('   ')).toBe('');
  });
  it('throws for non-numeric input', () => {
    expect(() => unformatNumber('abc')).toThrow();
  });
});

// ─── encodeBytes ──────────────────────────────────────────────────────────────
// A dump has to count real bytes; charCodeAt counts UTF-16 code units, which is
// a different number as soon as the text leaves ASCII.

describe('encodeBytes', () => {
  it('returns one byte per ASCII character under UTF-8', () => {
    expect(encodeBytes('ABC')).toEqual([0x41, 0x42, 0x43]);
  });

  it('spends two bytes on an accented character under UTF-8', () => {
    expect(encodeBytes('é')).toEqual([0xc3, 0xa9]);
  });

  it('spends three bytes on a BMP symbol under UTF-8', () => {
    expect(encodeBytes('☃')).toEqual([0xe2, 0x98, 0x83]);
  });

  it('spends four bytes on an astral character under UTF-8', () => {
    expect(encodeBytes('😀')).toHaveLength(4);
  });

  it('writes UTF-16 LE low byte first', () => {
    expect(encodeBytes('A', 'utf-16le')).toEqual([0x41, 0x00]);
  });

  it('writes UTF-16 BE high byte first', () => {
    expect(encodeBytes('A', 'utf-16be')).toEqual([0x00, 0x41]);
  });

  it('keeps Latin-1 to a single byte per character', () => {
    expect(encodeBytes('é', 'latin-1')).toEqual([0xe9]);
  });

  it('substitutes a question mark for characters Latin-1 cannot hold', () => {
    expect(encodeBytes('☃', 'latin-1')).toEqual([0x3f]);
  });

  it('returns nothing for empty input', () => expect(encodeBytes('')).toEqual([]));
});

// ─── byteToPrintable ──────────────────────────────────────────────────────────

describe('byteToPrintable', () => {
  it('renders a letter', () => expect(byteToPrintable(0x41)).toBe('A'));
  it('renders a space', () => expect(byteToPrintable(0x20)).toBe(' '));
  it('dots out a newline', () => expect(byteToPrintable(0x0a)).toBe('.'));
  it('dots out DEL', () => expect(byteToPrintable(0x7f)).toBe('.'));
  it('dots out a high byte', () => expect(byteToPrintable(0xc3)).toBe('.'));
});

// ─── classifyByte ─────────────────────────────────────────────────────────────

describe('classifyByte', () => {
  it('calls a letter printable', () => expect(classifyByte(0x41)).toBe('printable'));
  it('calls a space whitespace', () => expect(classifyByte(0x20)).toBe('whitespace'));
  it('calls a newline whitespace', () => expect(classifyByte(0x0a)).toBe('whitespace'));
  it('calls a bell a control byte', () => expect(classifyByte(0x07)).toBe('control'));
  it('calls DEL a control byte', () => expect(classifyByte(0x7f)).toBe('control'));
  it('calls a byte above 0x7F high', () => expect(classifyByte(0xc3)).toBe('high'));
  it('gives zero its own class', () => expect(classifyByte(0)).toBe('null'));
});

// ─── hexDumpRows ──────────────────────────────────────────────────────────────

describe('hexDumpRows', () => {
  it('splits at the requested width', () => {
    const rows = hexDumpRows(encodeBytes('A'.repeat(20)), 16);
    expect(rows).toHaveLength(2);
    expect(rows[0].bytes).toHaveLength(16);
    expect(rows[1].bytes).toHaveLength(4);
  });

  it('reports the byte offset of each row', () => {
    const rows = hexDumpRows(encodeBytes('A'.repeat(20)), 8);
    expect(rows.map((r) => r.offset)).toEqual([0, 8, 16]);
  });

  it('returns nothing for no bytes', () => expect(hexDumpRows([], 16)).toEqual([]));
});

// ─── toHexDump, byte oriented ─────────────────────────────────────────────────

describe('toHexDump byte handling', () => {
  it('emits both UTF-8 bytes of an accented character', () => {
    expect(toHexDump('é')).toContain('c3 a9');
  });

  it('keeps every hex column two digits wide', () => {
    // '☃' is 0x2603 as a code unit; the old charCodeAt version printed "2603"
    // in a single column and broke the alignment.
    const columns = toHexDump('☃').split('  ')[1].trim().split(/\s+/);
    for (const column of columns) expect(column).toHaveLength(2);
  });

  it('honours the requested line width', () => {
    const lines = toHexDump('A'.repeat(16), 8).split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('00000008');
  });

  it('honours the requested encoding', () => {
    expect(toHexDump('A', 16, 'utf-16le')).toContain('41 00');
  });
});
