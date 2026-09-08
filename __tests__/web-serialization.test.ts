import { createHmac } from 'crypto';
import {
  phpUnserialize,
  phpToJson,
  jsonToPhp,
  PHP_SAMPLE,
} from '@/Components/Functions/PhpSerializeTools/logic';
import {
  decodeRison,
  risonToJson,
  encodeRison,
  jsonToRison,
  RISON_SAMPLE,
} from '@/Components/Functions/RisonTools/logic';
import {
  decodeFlaskSession,
  formatFlaskSession,
  signFlaskSession,
  verifyFlaskSession,
} from '@/Components/Functions/FlaskSessionTools/logic';

describe('PHP unserialize', () => {
  const json = (input: string) => JSON.parse(phpToJson(input));

  it('reads the scalar types', () => {
    expect(phpUnserialize('N;').value).toBe(null);
    expect(phpUnserialize('b:1;').value).toBe(true);
    expect(phpUnserialize('b:0;').value).toBe(false);
    expect(phpUnserialize('i:-42;').value).toBe(-42);
    expect(phpUnserialize('d:1.5;').value).toBe(1.5);
    expect(phpUnserialize('d:INF;').value).toBe(Infinity);
    expect(phpUnserialize('s:5:"hello";').value).toBe('hello');
  });

  it('counts string lengths in bytes, not characters', () => {
    // "hé" is three bytes, so a length of 2 would cut the accent in half.
    expect(phpUnserialize('s:3:"hé";').value).toBe('hé');
    expect(json('s:3:"é!";')).toBe('é!');
    expect(() => phpUnserialize('s:2:"hé";')).toThrow('Expected');
  });

  it('turns a list-shaped array into a JSON array', () => {
    expect(json('a:2:{i:0;s:1:"a";i:1;s:1:"b";}')).toEqual(['a', 'b']);
  });

  it('keeps a keyed array as an object', () => {
    expect(json('a:2:{s:1:"a";i:1;s:1:"b";i:2;}')).toEqual({ a: 1, b: 2 });
    expect(json('a:1:{i:5;i:1;}')).toEqual({ '5': 1 });
  });

  it('keeps the class name and property visibility of an object', () => {
    const value = json('O:4:"User":2:{s:4:"name";s:3:"amy";s:7:"\u0000*\u0000role";s:5:"admin";}');
    expect(value.$class).toBe('User');
    expect(value.name).toBe('amy');
    expect(value['role (protected)']).toBe('admin');

    const priv = json('O:4:"User":1:{s:9:"\u0000User\u0000pin";i:7;}');
    expect(priv['pin (private User)']).toBe(7);
  });

  it('reads enums and references', () => {
    expect(json('E:11:"Suit:Hearts";')).toEqual({ $enum: 'Suit:Hearts' });
    expect(json('a:1:{i:0;R:2;}')).toEqual([{ $ref: 2 }]);
    expect(json('a:1:{i:0;r:2;}')).toEqual([{ $objectRef: 2 }]);
  });

  it('reports the shapes it cannot read', () => {
    expect(() => phpUnserialize('x:1;')).toThrow('not a PHP serialization type');
    expect(() => phpUnserialize('s:9:"short";')).toThrow('shorter than its declared length');
    expect(() => phpUnserialize('a:2:{i:0;N;}')).toThrow();
    expect(() => phpUnserialize('  ')).toThrow('Paste a serialized PHP value');
  });

  it('notes trailing data instead of ignoring it', () => {
    expect(phpToJson('i:1;i:2;')).toContain('trailing byte');
  });

  it('decodes its own sample', () => {
    expect(json(PHP_SAMPLE)).toEqual({ name: 'Alice', roles: ['admin', 'editor'], active: true });
  });
});

describe('PHP serialize', () => {
  it('writes the scalar types', () => {
    expect(jsonToPhp('null')).toBe('N;');
    expect(jsonToPhp('true')).toBe('b:1;');
    expect(jsonToPhp('42')).toBe('i:42;');
    expect(jsonToPhp('1.5')).toBe('d:1.5;');
    expect(jsonToPhp('"hi"')).toBe('s:2:"hi";');
    expect(jsonToPhp('"é"')).toBe('s:2:"é";');
  });

  it('writes arrays and objects', () => {
    expect(jsonToPhp('["a","b"]')).toBe('a:2:{i:0;s:1:"a";i:1;s:1:"b";}');
    expect(jsonToPhp('{"a":1}')).toBe('a:1:{s:1:"a";i:1;}');
    expect(jsonToPhp('{"5":1}')).toBe('a:1:{i:5;i:1;}');
  });

  it('round-trips through unserialize', () => {
    const original = { name: 'Alice', roles: ['admin', 'editor'], active: true };
    expect(JSON.parse(phpToJson(jsonToPhp(JSON.stringify(original))))).toEqual(original);
  });

  it('rejects input that is not JSON', () => {
    expect(() => jsonToPhp('{oops}')).toThrow('Not valid JSON');
    expect(() => jsonToPhp('')).toThrow('Paste some JSON');
  });
});

describe('Rison', () => {
  it('reads the scalar types', () => {
    expect(decodeRison('!t')).toBe(true);
    expect(decodeRison('!f')).toBe(false);
    expect(decodeRison('!n')).toBe(null);
    expect(decodeRison('123')).toBe(123);
    expect(decodeRison('-1.5')).toBe(-1.5);
    expect(decodeRison('1e3')).toBe(1000);
    expect(decodeRison('hello')).toBe('hello');
    expect(decodeRison("'with space'")).toBe('with space');
    expect(decodeRison("'it!'s !!'")).toBe("it's !");
  });

  it('reads objects and arrays', () => {
    expect(decodeRison('(a:1,b:two)')).toEqual({ a: 1, b: 'two' });
    expect(decodeRison('!(1,2,3)')).toEqual([1, 2, 3]);
    expect(decodeRison('()')).toEqual({});
    expect(decodeRison('!()')).toEqual([]);
    expect(decodeRison('(a:!(1,(b:!t)))')).toEqual({ a: [1, { b: true }] });
  });

  it('reads the bracket-less forms Kibana writes', () => {
    expect(decodeRison('a:1,b:2', 'o-rison')).toEqual({ a: 1, b: 2 });
    expect(decodeRison('1,2,3', 'a-rison')).toEqual([1, 2, 3]);
  });

  it('writes values back', () => {
    expect(encodeRison({ b: 2, a: 1 })).toBe('(a:1,b:2)');
    expect(encodeRison([1, 'two', null, true])).toBe("!(1,two,!n,!t)");
    expect(encodeRison({ a: 'with space' })).toBe("(a:'with space')");
    expect(encodeRison({ a: "it's" })).toBe("(a:'it!'s')");
    expect(encodeRison({ a: '5' })).toBe("(a:'5')");
    expect(encodeRison({ a: 1 }, 'o-rison')).toBe('a:1');
    expect(encodeRison([1, 2], 'a-rison')).toBe('1,2');
  });

  it('round-trips the sample', () => {
    const decoded = decodeRison(RISON_SAMPLE);
    expect(decodeRison(encodeRison(decoded))).toEqual(decoded);
    expect(JSON.parse(risonToJson(RISON_SAMPLE)).size).toBe(20);
  });

  it('round-trips through JSON', () => {
    expect(jsonToRison('{"a":[1,"x"]}')).toBe('(a:!(1,x))');
    expect(JSON.parse(risonToJson('(a:!(1,x))'))).toEqual({ a: [1, 'x'] });
  });

  it('reports what it cannot read', () => {
    expect(() => decodeRison('(a:1')).toThrow();
    expect(() => decodeRison('(a:1))')).toThrow('Trailing characters');
    expect(() => decodeRison('!z')).toThrow('is not a Rison value');
    expect(() => decodeRison('  ')).toThrow('Paste a Rison value');
  });
});

describe('Flask sessions', () => {
  // Produced by itsdangerous 2.2 with secret "devoven-secret" at t=1700000000.
  const SECRET = 'devoven-secret';
  const COOKIE = 'eyJsb2dnZWRfaW4iOnRydWUsInVzZXIiOiJhbGljZSJ9.ZVPxAA.H2WQSytbSEgJGBLFbRNvNuTwtbQ';
  const COMPRESSED =
    '.eJyrViotTi1SslJKzMlMTlXSUcrLL0ktBvIrRgHRQKkWAJSZlS8.ZVPxAA.oM5973DyX1mY-BWdqizUjgIRvV4';
  const OTHER_SALT = 'eyJhIjoxfQ.ZVPxAA.npPgNIy2hfi6D7cYIiWZhs7cBDg';

  it('decodes a real cookie without the key', () => {
    const session = decodeFlaskSession(COOKIE);
    expect(JSON.parse(session.payload)).toEqual({ logged_in: true, user: 'alice' });
    expect(session.compressed).toBe(false);
    expect(session.timestamp!.seconds).toBe(1700000000);
    expect(session.timestamp!.date.toISOString()).toBe('2023-11-14T22:13:20.000Z');
  });

  it('decompresses a payload marked with a leading dot', () => {
    const session = decodeFlaskSession(COMPRESSED);
    expect(session.compressed).toBe(true);
    expect(JSON.parse(session.payload).notes).toHaveLength(300);
  });

  it('accepts the cookie with its name and attributes attached', () => {
    expect(decodeFlaskSession(`session=${COOKIE}; HttpOnly; Path=/`).signature)
      .toBe('H2WQSytbSEgJGBLFbRNvNuTwtbQ');
  });

  it('verifies against the right key and rejects the wrong one', () => {
    expect(verifyFlaskSession(COOKIE, SECRET).valid).toBe(true);
    expect(verifyFlaskSession(COMPRESSED, SECRET).valid).toBe(true);
    expect(verifyFlaskSession(COOKIE, 'wrong-secret').valid).toBe(false);
  });

  it('honours a non-default salt', () => {
    expect(verifyFlaskSession(OTHER_SALT, SECRET, 'other-salt').valid).toBe(true);
    expect(verifyFlaskSession(OTHER_SALT, SECRET).valid).toBe(false);
  });

  it('signs a payload the way itsdangerous does', () => {
    const signed = signFlaskSession('{"logged_in": true, "user": "alice"}', SECRET, {
      timestamp: 1700000000,
    });
    expect(signed).toBe(COOKIE);
  });

  it('matches an independent HMAC of the signed value', () => {
    const session = decodeFlaskSession(COOKIE);
    const key = createHmac('sha1', SECRET).update('cookie-session').digest();
    const expected = createHmac('sha1', key)
      .update(session.signedValue)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(session.signature).toBe(expected);
  });

  it('round-trips a payload it signed', () => {
    const signed = signFlaskSession('{"a":1}', 'k', { timestamp: 1 });
    expect(verifyFlaskSession(signed, 'k').valid).toBe(true);
    expect(JSON.parse(decodeFlaskSession(signed).payload)).toEqual({ a: 1 });
  });

  it('reports what it cannot read', () => {
    expect(() => decodeFlaskSession('not-a-cookie')).toThrow('three dot-separated parts');
    expect(() => decodeFlaskSession('  ')).toThrow('Paste a Flask session cookie');
    expect(() => decodeFlaskSession('.aGk.ZVPxAA.sig')).toThrow('not valid zlib data');
    expect(() => verifyFlaskSession(COOKIE, '')).toThrow('Enter the secret key');
    expect(() => signFlaskSession('{oops}', 'k')).toThrow('not valid JSON');
  });

  it('reports both readings of the timestamp', () => {
    const text = formatFlaskSession(decodeFlaskSession(COOKIE));
    expect(text).toContain('2023-11-14T22:13:20.000Z');
    expect(text).toContain('itsdangerous 1.x');
  });
});
