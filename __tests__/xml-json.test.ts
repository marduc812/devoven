import { xmlToJson, jsonToXml, detectXmlOrJson } from '../Components/Functions/XmlJsonTools/logic';

describe('xmlToJson', () => {
  it('converts simple XML to JSON', () => {
    const xml = '<root><name>Alice</name><age>30</age></root>';
    const result = JSON.parse(xmlToJson(xml));
    expect(result.root.name).toBe('Alice');
    expect(result.root.age).toBe('30');
  });

  it('handles XML attributes as @attr fields', () => {
    const xml = '<user id="1"><name>Bob</name></user>';
    const result = JSON.parse(xmlToJson(xml));
    expect(result.user['@id']).toBe('1');
    expect(result.user.name).toBe('Bob');
  });

  it('handles self-closing tags', () => {
    const xml = '<root><empty/></root>';
    const result = JSON.parse(xmlToJson(xml));
    expect(result.root.empty).toBeNull();
  });

  it('handles repeated elements as arrays', () => {
    const xml = '<root><item>a</item><item>b</item></root>';
    const result = JSON.parse(xmlToJson(xml));
    expect(Array.isArray(result.root.item)).toBe(true);
    expect(result.root.item).toHaveLength(2);
  });

  it('handles CDATA sections', () => {
    const xml = '<root><![CDATA[hello & world]]></root>';
    const result = JSON.parse(xmlToJson(xml));
    expect(result.root).toBe('hello & world');
  });

  it('skips XML processing instructions', () => {
    const xml = '<?xml version="1.0"?><root><a>1</a></root>';
    const result = JSON.parse(xmlToJson(xml));
    expect(result.root.a).toBe('1');
  });

  it('returns a string result for any input', () => {
    const result = xmlToJson('<root><item>value</item></root>');
    expect(typeof result).toBe('string');
  });
});

describe('jsonToXml', () => {
  it('converts simple JSON to XML', () => {
    const json = '{"root":{"name":"Alice","age":30}}';
    const result = jsonToXml(json);
    expect(result).toContain('<root>');
    expect(result).toContain('<name>Alice</name>');
    expect(result).toContain('<age>30</age>');
  });

  it('handles @attr attributes', () => {
    const json = '{"user":{"@id":"1","name":"Bob"}}';
    const result = jsonToXml(json);
    expect(result).toContain('id="1"');
    expect(result).toContain('<name>Bob</name>');
  });

  it('handles arrays as repeated elements', () => {
    const json = '{"root":{"item":["a","b"]}}';
    const result = jsonToXml(json);
    expect(result.split('<item>').length - 1).toBe(2);
  });

  it('returns error for invalid JSON', () => {
    expect(jsonToXml('not json')).toContain('Error');
  });

  it('generates XML declaration', () => {
    const json = '{"root":{"val":"x"}}';
    expect(jsonToXml(json)).toContain('<?xml');
  });
});

describe('detectXmlOrJson', () => {
  it('detects XML', () => {
    expect(detectXmlOrJson('<root/>')).toBe('xml');
  });

  it('detects JSON', () => {
    expect(detectXmlOrJson('{"a":1}')).toBe('json');
  });
});
