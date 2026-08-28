import { tomlToJson } from '@/Components/Functions/TomlToJsonTools/logic';
import { iniToJson as iniParserToJson } from '@/Components/Functions/IniParserTools/logic';
import { gitConfigToJson } from '@/Components/Functions/GitConfigTools/logic';
import {
  iniToJson as extraIniToJson,
  unflattenJson,
} from '@/Components/Functions/ExtraConverters/logic';

// Every parser here builds an object out of keys the user typed, and every one
// of them is reachable from a link via `?from=`. A key of `__proto__` must end
// up as data in the output, never as a write onto Object.prototype.

const probe = () => Object.getOwnPropertyNames(Object.prototype).length;

describe('config parsers do not pollute Object.prototype', () => {
  const before = probe();

  afterEach(() => {
    expect(probe()).toBe(before);
    expect(({} as Record<string, unknown>).pwn).toBeUndefined();
  });

  it('tomlToJson: [__proto__] table header', () => {
    const out = tomlToJson('[__proto__]\npwn = "OWNED"\n');
    expect(JSON.parse(out)).toEqual({ ['__proto__']: { pwn: 'OWNED' } });
  });

  it('tomlToJson: dotted key path through __proto__', () => {
    const out = tomlToJson('__proto__.pwn = "OWNED"\n');
    expect(JSON.parse(out)).toEqual({ ['__proto__']: { pwn: 'OWNED' } });
  });

  it('tomlToJson: [[__proto__]] array of tables', () => {
    const out = tomlToJson('[[__proto__]]\npwn = "OWNED"\n');
    expect(JSON.parse(out)).toEqual({ ['__proto__']: [{ pwn: 'OWNED' }] });
  });

  it('tomlToJson: inline table with a __proto__ key', () => {
    const out = tomlToJson('a = { __proto__ = "OWNED" }\n');
    expect(JSON.parse(out)).toEqual({ a: { ['__proto__']: 'OWNED' } });
  });

  it('iniToJson (ini-parser): [__proto__] section', () => {
    const out = iniParserToJson('[__proto__]\npwn = OWNED\n');
    expect(JSON.parse(out)).toEqual({ ['__proto__']: { pwn: 'OWNED' } });
  });

  it('gitConfigToJson: [__proto__] section', () => {
    const out = gitConfigToJson('[__proto__]\n\tpwn = OWNED\n');
    expect(JSON.parse(out)).toEqual({ ['__proto__']: { pwn: 'OWNED' } });
  });

  it('iniToJson (extra converters): [__proto__] section', () => {
    const out = extraIniToJson('[__proto__]\npwn = OWNED\n');
    expect(JSON.parse(out)).toEqual({ ['__proto__']: { pwn: 'OWNED' } });
  });

  it('unflattenJson: __proto__ inside a flattened key path', () => {
    const out = unflattenJson('{"__proto__.pwn":"OWNED"}');
    expect(JSON.parse(out)).toEqual({ ['__proto__']: { pwn: 'OWNED' } });
  });

  it('constructor and prototype are treated as data too', () => {
    expect(JSON.parse(tomlToJson('[constructor.prototype]\npwn = "OWNED"\n'))).toEqual({
      constructor: { prototype: { pwn: 'OWNED' } },
    });
    expect(JSON.parse(iniParserToJson('[constructor]\npwn = OWNED\n'))).toEqual({
      constructor: { pwn: 'OWNED' },
    });
    expect(JSON.parse(gitConfigToJson('[constructor]\n\tpwn = OWNED\n'))).toEqual({
      constructor: { pwn: 'OWNED' },
    });
  });
});
