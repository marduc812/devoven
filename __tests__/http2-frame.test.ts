import {
  decodeHttp2Frames,
  hexToBytes,
  FRAME_TYPES,
  ERROR_CODES,
} from '../Components/Functions/Http2FrameTools/logic';

describe('hexToBytes', () => {
  it('converts simple hex', () => {
    const bytes = hexToBytes('00ff');
    expect(bytes[0]).toBe(0x00);
    expect(bytes[1]).toBe(0xff);
  });

  it('handles spaces and newlines', () => {
    const bytes = hexToBytes('00 ff\n0a');
    expect(bytes).toHaveLength(3);
    expect(bytes[2]).toBe(0x0a);
  });

  it('handles colon separator', () => {
    const bytes = hexToBytes('00:ff:0a');
    expect(bytes).toHaveLength(3);
  });

  it('throws on odd length', () => {
    expect(() => hexToBytes('abc')).toThrow();
  });

  it('throws on invalid chars', () => {
    expect(() => hexToBytes('ghij')).toThrow();
  });
});

describe('decodeHttp2Frames', () => {
  // SETTINGS frame: 00 00 00 04 00 00 00 00 00
  const SETTINGS_EMPTY = '00 00 00 04 00 00 00 00 00';
  // SETTINGS ACK:    00 00 00 04 01 00 00 00 00
  const SETTINGS_ACK = '00 00 00 04 01 00 00 00 00';
  // PING:            00 00 08 06 00 00 00 00 00 01 02 03 04 05 06 07 08
  const PING = '00 00 08 06 00 00 00 00 00 01 02 03 04 05 06 07 08';
  // WINDOW_UPDATE stream 0: 00 00 04 08 00 00 00 00 00 00 00 ff ff
  const WINDOW_UPDATE = '00 00 04 08 00 00 00 00 00 00 00 ff ff';
  // RST_STREAM stream 1: 00 00 04 03 00 00 00 00 01 00 00 00 00
  const RST_STREAM = '00 00 04 03 00 00 00 00 01 00 00 00 00';

  it('decodes empty SETTINGS frame', () => {
    const result = decodeHttp2Frames(SETTINGS_EMPTY);
    expect(result.frames).toHaveLength(1);
    const f = result.frames[0];
    expect(f.type).toBe('SETTINGS');
    expect(f.length).toBe(0);
    expect(f.streamId).toBe(0);
    expect(f.flags).toBe(0);
  });

  it('decodes SETTINGS ACK (flags=0x1)', () => {
    const result = decodeHttp2Frames(SETTINGS_ACK);
    expect(result.frames[0].type).toBe('SETTINGS');
    expect(result.frames[0].flagNames).toContain('ACK');
    // ACK SETTINGS has empty payload, flagNames carries the ACK info
    expect(result.frames[0].flags).toBe(0x1);
  });

  it('decodes PING frame', () => {
    const result = decodeHttp2Frames(PING);
    expect(result.frames[0].type).toBe('PING');
    expect(result.frames[0].length).toBe(8);
    expect(result.frames[0].streamId).toBe(0);
  });

  it('decodes WINDOW_UPDATE frame', () => {
    const result = decodeHttp2Frames(WINDOW_UPDATE);
    const f = result.frames[0];
    expect(f.type).toBe('WINDOW_UPDATE');
    expect(f.payloadInterpretation).toContain('65535');
  });

  it('decodes RST_STREAM frame', () => {
    const result = decodeHttp2Frames(RST_STREAM);
    const f = result.frames[0];
    expect(f.type).toBe('RST_STREAM');
    expect(f.streamId).toBe(1);
    expect(f.payloadInterpretation).toContain('NO_ERROR');
  });

  it('decodes multiple frames', () => {
    const result = decodeHttp2Frames(SETTINGS_EMPTY + ' ' + SETTINGS_ACK);
    expect(result.frames).toHaveLength(2);
  });

  it('reports error for incomplete frame', () => {
    const result = decodeHttp2Frames('00 00 ff');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns error for invalid hex', () => {
    const result = decodeHttp2Frames('xyz');
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('returns empty frames for empty input', () => {
    const result = decodeHttp2Frames('');
    expect(result.frames).toHaveLength(0);
  });
});

describe('FRAME_TYPES', () => {
  it('has 10 known frame types', () => {
    expect(FRAME_TYPES).toHaveLength(10);
  });

  it('DATA is code 0', () => {
    const dt = FRAME_TYPES.find(t => t.name === 'DATA');
    expect(dt!.code).toBe(0);
  });

  it('CONTINUATION is code 9', () => {
    const ct = FRAME_TYPES.find(t => t.name === 'CONTINUATION');
    expect(ct!.code).toBe(9);
  });
});

describe('ERROR_CODES', () => {
  it('has NO_ERROR at 0', () => {
    expect(ERROR_CODES[0]).toContain('NO_ERROR');
  });

  it('has PROTOCOL_ERROR at 1', () => {
    expect(ERROR_CODES[1]).toContain('PROTOCOL_ERROR');
  });
});
