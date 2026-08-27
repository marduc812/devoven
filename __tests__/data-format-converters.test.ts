import {
  jsonToYaml, yamlToJson,
  jsonToXml, xmlToJson,
  jsonToCsv, csvToJson,
  jsonToToml, tomlToJson,
  csvToXml, xmlToCsv,
  csvToMarkdownTable, markdownTableToCsv,
  tableDataToCsv, tableDataToJson,
  jsonToTypeScriptInterface,
  jsonToGoStruct,
  jsonToRustStruct,
  jsonToZodSchema,
  markdownToHtml,
  htmlToMarkdown,
} from '../Components/Functions/DataFormatConverters/logic';

// ─── JSON ↔ YAML ─────────────────────────────────────────────────────────────

describe('jsonToYaml', () => {
  it('converts a flat JSON object to YAML', () => {
    const result = jsonToYaml('{"name":"Alice","age":30}');
    expect(result).toContain('name: Alice');
    expect(result).toContain('age: 30');
  });
  it('converts nested JSON to YAML', () => {
    const result = jsonToYaml('{"user":{"id":1,"active":true}}');
    expect(result).toContain('user:');
    expect(result).toContain('id: 1');
  });
  it('converts a JSON array to YAML', () => {
    const result = jsonToYaml('[1,2,3]');
    expect(result).toContain('- 1');
    expect(result).toContain('- 2');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToYaml('')).toBe('');
    expect(jsonToYaml('   ')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToYaml('{bad')).toThrow();
  });
});

describe('yamlToJson', () => {
  it('converts a YAML scalar mapping to JSON', () => {
    const result = JSON.parse(yamlToJson('name: Alice\nage: 30'));
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });
  it('converts a YAML list to JSON', () => {
    const result = JSON.parse(yamlToJson('- 1\n- 2\n- 3'));
    expect(result).toEqual([1, 2, 3]);
  });
  it('round-trips with jsonToYaml', () => {
    const original = { name: 'Bob', score: 42 };
    const yaml = jsonToYaml(JSON.stringify(original));
    const restored = JSON.parse(yamlToJson(yaml));
    expect(restored).toEqual(original);
  });
  it('returns empty string for empty input', () => {
    expect(yamlToJson('')).toBe('');
  });
  it('throws on invalid YAML', () => {
    expect(() => yamlToJson(': : :')).toThrow();
  });
});

// ─── JSON ↔ XML ──────────────────────────────────────────────────────────────

describe('jsonToXml', () => {
  it('wraps JSON in a root element', () => {
    const result = jsonToXml('{"name":"Alice"}');
    expect(result).toContain('<name>Alice</name>');
    expect(result).toContain('<?xml');
  });
  it('handles nested objects', () => {
    const result = jsonToXml('{"user":{"id":1}}');
    expect(result).toContain('<user>');
    expect(result).toContain('<id>1</id>');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToXml('')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToXml('{bad')).toThrow();
  });
});

describe('xmlToJson', () => {
  it('parses simple XML to JSON', () => {
    const xml = '<?xml version="1.0"?><root><name>Alice</name><age>30</age></root>';
    const obj = JSON.parse(xmlToJson(xml));
    expect(obj.root.name).toBe('Alice');
    expect(obj.root.age).toBe(30);
  });
  it('returns empty string for empty input', () => {
    expect(xmlToJson('')).toBe('');
  });
  it('round-trips simple objects', () => {
    const xml = jsonToXml('{"city":"London"}');
    const result = JSON.parse(xmlToJson(xml));
    expect(result.root.city).toBe('London');
  });
});

// ─── JSON ↔ CSV ──────────────────────────────────────────────────────────────

describe('jsonToCsv', () => {
  it('converts an array of flat objects to CSV', () => {
    const result = jsonToCsv('[{"name":"Alice","age":30},{"name":"Bob","age":25}]');
    const lines = result.split('\n');
    expect(lines[0]).toBe('name,age');
    expect(lines[1]).toBe('Alice,30');
    expect(lines[2]).toBe('Bob,25');
  });
  it('quotes values that contain commas', () => {
    const result = jsonToCsv('[{"city":"Portland, OR"}]');
    expect(result).toContain('"Portland, OR"');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToCsv('')).toBe('');
  });
  it('throws for non-array input', () => {
    expect(() => jsonToCsv('{"a":1}')).toThrow();
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToCsv('{bad')).toThrow();
  });
});

describe('csvToJson', () => {
  it('converts CSV to array of objects', () => {
    const result = JSON.parse(csvToJson('name,age\nAlice,30\nBob,25'));
    expect(result).toEqual([{ name: 'Alice', age: '30' }, { name: 'Bob', age: '25' }]);
  });
  it('handles quoted fields with commas', () => {
    const result = JSON.parse(csvToJson('city\n"Portland, OR"'));
    expect(result[0].city).toBe('Portland, OR');
  });
  it('round-trips with jsonToCsv', () => {
    const original = [{ a: 'x', b: 'y' }];
    const csv = jsonToCsv(JSON.stringify(original));
    const restored = JSON.parse(csvToJson(csv));
    expect(restored).toEqual(original);
  });
  it('returns empty string for empty input', () => {
    expect(csvToJson('')).toBe('');
  });
});

// ─── JSON ↔ TOML ─────────────────────────────────────────────────────────────

describe('jsonToToml', () => {
  it('converts a flat JSON object to TOML', () => {
    const result = jsonToToml('{"name":"Alice","age":30}');
    expect(result).toContain('name = "Alice"');
    expect(result).toContain('age = 30');
  });
  it('converts nested objects to TOML sections', () => {
    const result = jsonToToml('{"database":{"host":"localhost","port":5432}}');
    expect(result).toContain('[database]');
    expect(result).toContain('host = "localhost"');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToToml('')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToToml('{bad')).toThrow();
  });
});

describe('tomlToJson', () => {
  it('converts a TOML string to JSON', () => {
    const result = JSON.parse(tomlToJson('name = "Alice"\nage = 30'));
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });
  it('round-trips with jsonToToml for flat objects', () => {
    const original = { host: 'localhost', port: 5432 };
    const toml = jsonToToml(JSON.stringify(original));
    const restored = JSON.parse(tomlToJson(toml));
    expect(restored).toEqual(original);
  });
  it('returns empty string for empty input', () => {
    expect(tomlToJson('')).toBe('');
  });
  it('throws on invalid TOML', () => {
    expect(() => tomlToJson('= invalid')).toThrow();
  });
});

// ─── CSV ↔ XML ───────────────────────────────────────────────────────────────

describe('csvToXml', () => {
  it('wraps each CSV row in a <row> element', () => {
    const result = csvToXml('name,age\nAlice,30\nBob,25');
    expect(result).toContain('<name>Alice</name>');
    expect(result).toContain('<age>30</age>');
    expect(result).toContain('<row>');
    expect(result).toContain('<root>');
  });
  it('escapes XML-unsafe characters in values', () => {
    const result = csvToXml('tag\n<b>bold</b>');
    expect(result).toContain('&lt;b&gt;');
    expect(result).not.toContain('<b>bold</b>');
  });
  it('returns empty string for empty input', () => {
    expect(csvToXml('')).toBe('');
  });
});

describe('xmlToCsv', () => {
  it('extracts rows from a simple XML structure', () => {
    const xml = `<root><row><name>Alice</name><age>30</age></row><row><name>Bob</name><age>25</age></row></root>`;
    const result = xmlToCsv(xml);
    const lines = result.split('\n');
    expect(lines[0]).toBe('name,age');
    expect(lines[1]).toBe('Alice,30');
  });
  it('returns empty string for empty input', () => {
    expect(xmlToCsv('')).toBe('');
  });
});

// ─── CSV ↔ Markdown Table ────────────────────────────────────────────────────

describe('csvToMarkdownTable', () => {
  it('converts CSV to a Markdown table', () => {
    const result = csvToMarkdownTable('name,age\nAlice,30\nBob,25');
    const lines = result.split('\n');
    expect(lines[0]).toBe('| name | age |');
    expect(lines[1]).toBe('| --- | --- |');
    expect(lines[2]).toBe('| Alice | 30 |');
    expect(lines[3]).toBe('| Bob | 25 |');
  });
  it('returns empty string for empty input', () => {
    expect(csvToMarkdownTable('')).toBe('');
  });
});

describe('markdownTableToCsv', () => {
  it('converts a Markdown table to CSV', () => {
    const md = '| name | age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |';
    const result = markdownTableToCsv(md);
    const lines = result.split('\n');
    expect(lines[0]).toBe('name,age');
    expect(lines[1]).toBe('Alice,30');
    expect(lines[2]).toBe('Bob,25');
  });
  it('round-trips with csvToMarkdownTable', () => {
    const original = 'name,age\nAlice,30';
    const md = csvToMarkdownTable(original);
    const restored = markdownTableToCsv(md);
    expect(restored.trim()).toBe(original.trim());
  });
  it('returns empty string for empty input', () => {
    expect(markdownTableToCsv('')).toBe('');
  });
});

// ─── HTML Table helpers ───────────────────────────────────────────────────────

describe('tableDataToCsv', () => {
  it('converts headers and rows to CSV', () => {
    const result = tableDataToCsv(['name', 'age'], [['Alice', '30'], ['Bob', '25']]);
    const lines = result.split('\n');
    expect(lines[0]).toBe('name,age');
    expect(lines[1]).toBe('Alice,30');
    expect(lines[2]).toBe('Bob,25');
  });
  it('quotes values with commas', () => {
    const result = tableDataToCsv(['city'], [['Portland, OR']]);
    expect(result).toContain('"Portland, OR"');
  });
  it('handles empty rows', () => {
    expect(tableDataToCsv(['a'], [])).toBe('a');
  });
});

describe('tableDataToJson', () => {
  it('converts headers and rows to JSON array', () => {
    const result = JSON.parse(tableDataToJson(['name', 'age'], [['Alice', '30'], ['Bob', '25']]));
    expect(result).toEqual([{ name: 'Alice', age: '30' }, { name: 'Bob', age: '25' }]);
  });
  it('handles empty rows', () => {
    expect(JSON.parse(tableDataToJson(['a'], []))).toEqual([]);
  });
});

// ─── JSON → TypeScript Interface ─────────────────────────────────────────────

describe('jsonToTypeScriptInterface', () => {
  it('generates interface from flat object', () => {
    const result = jsonToTypeScriptInterface('{"name":"Alice","age":30,"active":true}');
    expect(result).toContain('export interface Root');
    expect(result).toContain('name: string');
    expect(result).toContain('age: number');
    expect(result).toContain('active: boolean');
  });
  it('handles array field', () => {
    const result = jsonToTypeScriptInterface('{"tags":["a","b"]}');
    expect(result).toContain('tags: string[]');
  });
  it('handles null field', () => {
    const result = jsonToTypeScriptInterface('{"deleted":null}');
    expect(result).toContain('deleted: null');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToTypeScriptInterface('')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToTypeScriptInterface('{bad}')).toThrow();
  });
});

// ─── JSON → Go Struct ─────────────────────────────────────────────────────────

describe('jsonToGoStruct', () => {
  it('generates Go struct from flat object', () => {
    const result = jsonToGoStruct('{"name":"Alice","age":30}');
    expect(result).toContain('type Root struct');
    expect(result).toContain('Name string');
    expect(result).toContain('Age int');
    expect(result).toContain('json:"name"');
    expect(result).toContain('json:"age"');
  });
  it('uses float64 for non-integer numbers', () => {
    const result = jsonToGoStruct('{"score":9.5}');
    expect(result).toContain('float64');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToGoStruct('')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToGoStruct('{bad}')).toThrow();
  });
});

// ─── JSON → Rust Struct ───────────────────────────────────────────────────────

describe('jsonToRustStruct', () => {
  it('generates Rust struct with derive macros', () => {
    const result = jsonToRustStruct('{"name":"Alice","age":30}');
    expect(result).toContain('#[derive(');
    expect(result).toContain('pub struct Root');
    expect(result).toContain('pub name: String');
    expect(result).toContain('pub age: i64');
  });
  it('uses f64 for non-integer numbers', () => {
    const result = jsonToRustStruct('{"score":9.5}');
    expect(result).toContain('f64');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToRustStruct('')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToRustStruct('{bad}')).toThrow();
  });
});

// ─── JSON → Zod Schema ───────────────────────────────────────────────────────

describe('jsonToZodSchema', () => {
  it('generates a Zod schema from flat object', () => {
    const result = jsonToZodSchema('{"name":"Alice","age":30,"active":true}');
    expect(result).toContain("import { z } from 'zod'");
    expect(result).toContain('z.object');
    expect(result).toContain('name: z.string()');
    expect(result).toContain('age: z.number()');
    expect(result).toContain('active: z.boolean()');
  });
  it('handles array fields', () => {
    const result = jsonToZodSchema('{"tags":["a"]}');
    expect(result).toContain('z.array(z.string())');
  });
  it('returns empty string for empty input', () => {
    expect(jsonToZodSchema('')).toBe('');
  });
  it('throws on invalid JSON', () => {
    expect(() => jsonToZodSchema('{bad}')).toThrow();
  });
});

// ─── Markdown ↔ HTML ─────────────────────────────────────────────────────────

describe('markdownToHtml', () => {
  it('converts a heading', () => {
    const result = markdownToHtml('# Hello');
    expect(result).toContain('<h1');
    expect(result).toContain('Hello');
  });
  it('converts bold text', () => {
    const result = markdownToHtml('**bold**');
    expect(result).toContain('<strong>bold</strong>');
  });
  it('converts a link', () => {
    const result = markdownToHtml('[text](https://example.com)');
    expect(result).toContain('href="https://example.com"');
  });
  it('returns empty string for empty input', () => {
    expect(markdownToHtml('')).toBe('');
  });
});

describe('htmlToMarkdown', () => {
  it('converts a heading element', () => {
    const result = htmlToMarkdown('<h1>Hello</h1>');
    expect(result.trim()).toBe('# Hello');
  });
  it('converts bold element', () => {
    const result = htmlToMarkdown('<strong>bold</strong>');
    expect(result.trim()).toBe('**bold**');
  });
  it('converts a link element', () => {
    const result = htmlToMarkdown('<a href="https://example.com">text</a>');
    expect(result).toContain('[text](https://example.com)');
  });
  it('returns empty string for empty input', () => {
    expect(htmlToMarkdown('')).toBe('');
  });
  it('round-trips with markdownToHtml (headings)', () => {
    const md = '# Title';
    const html = markdownToHtml(md);
    const restored = htmlToMarkdown(html as string);
    expect(restored.trim()).toBe('# Title');
  });
});
