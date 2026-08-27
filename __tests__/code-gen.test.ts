import { jsonToPython, jsonToPythonDataclass } from '../Components/Functions/CodeGenTools/logic';
import { jsonToPhp } from '../Components/Functions/CodeGenTools/logic';
import { jsonToJava } from '../Components/Functions/CodeGenTools/logic';
import { base64urlEncode, base64urlDecode } from '../Components/Functions/EncodingTools/logic';

// ─── JSON to Python ───────────────────────────────────────────────────────────

describe('jsonToPython', () => {
  it('converts null to None', () => {
    expect(jsonToPython('null')).toBe('None');
  });

  it('converts true to True', () => {
    expect(jsonToPython('true')).toBe('True');
  });

  it('converts false to False', () => {
    expect(jsonToPython('false')).toBe('False');
  });

  it('converts number', () => {
    expect(jsonToPython('42')).toBe('42');
    expect(jsonToPython('3.14')).toBe('3.14');
  });

  it('converts string', () => {
    expect(jsonToPython('"hello"')).toBe('"hello"');
  });

  it('converts empty array', () => {
    expect(jsonToPython('[]')).toBe('[]');
  });

  it('converts empty object', () => {
    expect(jsonToPython('{}')).toBe('{}');
  });

  it('converts array', () => {
    const result = jsonToPython('[1, 2, 3]');
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('3');
  });

  it('converts object to dict', () => {
    const result = jsonToPython('{"key": "value"}');
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
  });

  it('converts nested object', () => {
    const result = jsonToPython('{"a": {"b": 1}}');
    expect(result).toContain('"a"');
    expect(result).toContain('"b"');
    expect(result).toContain('1');
  });
});

describe('jsonToPythonDataclass', () => {
  it('generates dataclass for object', () => {
    const result = jsonToPythonDataclass('{"name": "Alice", "age": 30}');
    expect(result).toContain('@dataclass');
    expect(result).toContain('class Model:');
    expect(result).toContain('name: str');
    expect(result).toContain('age: int');
  });

  it('handles boolean fields', () => {
    const result = jsonToPythonDataclass('{"active": true}');
    expect(result).toContain('active: bool');
  });

  it('handles float fields', () => {
    const result = jsonToPythonDataclass('{"score": 3.14}');
    expect(result).toContain('score: float');
  });

  it('handles array fields', () => {
    const result = jsonToPythonDataclass('{"items": [1,2,3]}');
    expect(result).toContain('items: List[Any]');
  });

  it('handles null fields', () => {
    const result = jsonToPythonDataclass('{"value": null}');
    expect(result).toContain('value: Optional[Any]');
  });

  it('falls back for non-object input', () => {
    const result = jsonToPythonDataclass('[1,2,3]');
    expect(result).toContain('Cannot convert non-object');
  });
});

// ─── JSON to PHP ──────────────────────────────────────────────────────────────

describe('jsonToPhp', () => {
  it('outputs PHP opening tag', () => {
    const result = jsonToPhp('{"key": "value"}');
    expect(result).toContain('<?php');
    expect(result).toContain('$data =');
  });

  it('converts null to null', () => {
    const result = jsonToPhp('null');
    expect(result).toContain('null');
  });

  it('converts true to true', () => {
    const result = jsonToPhp('true');
    expect(result).toContain('true');
  });

  it('converts false to false', () => {
    const result = jsonToPhp('false');
    expect(result).toContain('false');
  });

  it('converts string with single quotes', () => {
    const result = jsonToPhp('"hello"');
    expect(result).toContain("'hello'");
  });

  it('escapes single quotes in strings', () => {
    const result = jsonToPhp("\"it's\"");
    expect(result).toContain("\\'");
  });

  it('converts array with => syntax', () => {
    const result = jsonToPhp('[1, 2, 3]');
    expect(result).toContain('=>');
  });

  it('converts object to associative array', () => {
    const result = jsonToPhp('{"name": "Alice"}');
    expect(result).toContain("'name' =>");
    expect(result).toContain("'Alice'");
  });

  it('converts empty array', () => {
    const result = jsonToPhp('[]');
    expect(result).toContain('[]');
  });

  it('converts empty object', () => {
    const result = jsonToPhp('{}');
    expect(result).toContain('[]');
  });
});

// ─── JSON to Java ─────────────────────────────────────────────────────────────

describe('jsonToJava', () => {
  it('generates Java class', () => {
    const result = jsonToJava('{"name": "Alice", "age": 30}');
    expect(result).toContain('public class Model {');
    expect(result).toContain('private String name;');
    expect(result).toContain('private Integer age;');
  });

  it('generates getters and setters', () => {
    const result = jsonToJava('{"name": "Alice"}');
    expect(result).toContain('getName()');
    expect(result).toContain('setName(');
  });

  it('handles boolean fields', () => {
    const result = jsonToJava('{"active": true}');
    expect(result).toContain('private Boolean active;');
  });

  it('handles double fields', () => {
    const result = jsonToJava('{"score": 3.14}');
    expect(result).toContain('private Double score;');
  });

  it('handles array fields', () => {
    const result = jsonToJava('{"items": [1,2,3]}');
    expect(result).toContain('List<Object>');
  });

  it('handles null fields', () => {
    const result = jsonToJava('{"value": null}');
    expect(result).toContain('Object');
  });

  it('handles non-object input', () => {
    const result = jsonToJava('[1,2,3]');
    expect(result).toContain('// Input must be a JSON object');
  });

  it('accepts custom class name', () => {
    const result = jsonToJava('{"x": 1}', 'MyClass');
    expect(result).toContain('public class MyClass {');
  });
});

// ─── Base64URL ────────────────────────────────────────────────────────────────

describe('base64urlEncode', () => {
  it('encodes simple ASCII string', () => {
    const result = base64urlEncode('hello');
    expect(result).toBe('aGVsbG8');
  });

  it('does not contain + or / or =', () => {
    const result = base64urlEncode('Many many characters to encode here!!');
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
    expect(result).not.toContain('=');
  });

  it('encodes empty string', () => {
    expect(base64urlEncode('')).toBe('');
  });

  it('handles strings that produce + in base64', () => {
    // base64 of bytes that produce +
    const result = base64urlEncode('\xfb\xff');
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
  });
});

describe('base64urlDecode', () => {
  it('decodes simple encoded string', () => {
    expect(base64urlDecode('aGVsbG8')).toBe('hello');
  });

  it('round-trips ASCII strings', () => {
    const inputs = ['hello', 'world', 'Hello World!', 'test123'];
    for (const input of inputs) {
      expect(base64urlDecode(base64urlEncode(input))).toBe(input);
    }
  });

  it('decodes empty string', () => {
    expect(base64urlDecode('')).toBe('');
  });

  it('handles base64url with - and _', () => {
    // Encode something that would normally have + or /
    const encoded = base64urlEncode('Man');
    expect(base64urlDecode(encoded)).toBe('Man');
  });
});
