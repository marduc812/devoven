import { parseIni, iniToJson, jsonToIni } from '../Components/Functions/IniParserTools/logic';

describe('parseIni', () => {
  it('parses a simple key=value pair', () => {
    const result = parseIni('key=value');
    expect(result['__root__']['key']).toBe('value');
  });

  it('parses sections', () => {
    const ini = '[database]\nhost=localhost\nport=5432';
    const result = parseIni(ini);
    expect(result['database']['host']).toBe('localhost');
    expect(result['database']['port']).toBe('5432');
  });

  it('ignores ; comments', () => {
    const ini = '; this is a comment\nkey=value';
    const result = parseIni(ini);
    expect(result['__root__']['key']).toBe('value');
    expect(Object.keys(result['__root__'])).toHaveLength(1);
  });

  it('ignores # comments', () => {
    const ini = '# this is a comment\nkey=value';
    const result = parseIni(ini);
    expect(result['__root__']['key']).toBe('value');
  });

  it('strips double quotes from values', () => {
    const ini = 'name="John Doe"';
    const result = parseIni(ini);
    expect(result['__root__']['name']).toBe('John Doe');
  });

  it('strips single quotes from values', () => {
    const ini = "name='Jane'";
    const result = parseIni(ini);
    expect(result['__root__']['name']).toBe('Jane');
  });

  it('handles key: value syntax', () => {
    const ini = 'key: value';
    const result = parseIni(ini);
    expect(result['__root__']['key']).toBe('value');
  });

  it('removes __root__ when empty', () => {
    const ini = '[section]\nkey=val';
    const result = parseIni(ini);
    expect(result['__root__']).toBeUndefined();
    expect(result['section']['key']).toBe('val');
  });

  it('handles multiple sections', () => {
    const ini = '[a]\nx=1\n[b]\ny=2';
    const result = parseIni(ini);
    expect(result['a']['x']).toBe('1');
    expect(result['b']['y']).toBe('2');
  });
});

describe('iniToJson', () => {
  it('returns valid JSON string', () => {
    const result = iniToJson('[app]\nname=test');
    const parsed = JSON.parse(result);
    expect(parsed.app.name).toBe('test');
  });
});

describe('jsonToIni', () => {
  it('converts flat JSON to INI root keys', () => {
    const json = JSON.stringify({ name: 'test', version: '1.0' });
    const result = jsonToIni(json);
    expect(result).toContain('name = test');
    expect(result).toContain('version = 1.0');
  });

  it('converts nested JSON to INI sections', () => {
    const json = JSON.stringify({ database: { host: 'localhost', port: 5432 } });
    const result = jsonToIni(json);
    expect(result).toContain('[database]');
    expect(result).toContain('host = localhost');
  });

  it('returns error for invalid JSON', () => {
    const result = jsonToIni('not json');
    expect(result).toContain('Error');
  });

  it('returns error for non-object JSON', () => {
    const result = jsonToIni('"string"');
    expect(result).toContain('Error');
  });
});
