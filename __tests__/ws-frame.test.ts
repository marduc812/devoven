import { decodeWsFrame, formatFrameResult, OPCODES, CLOSE_CODES } from '@/Components/Functions/WsFrameTools/logic';

describe('decodeWsFrame', () => {
  it('decodes a simple unmasked text frame "Hello"', () => {
    // FIN=1, opcode=1 (text), no mask, payload length=5, "Hello"
    const result = decodeWsFrame('81 05 48 65 6c 6c 6f');
    expect(result.fin).toBe(true);
    expect(result.opcode).toBe(0x1);
    expect(result.opcodeLabel).toBe('Text');
    expect(result.masked).toBe(false);
    expect(result.payloadLength).toBe(5);
    expect(result.payloadText).toBe('Hello');
  });

  it('throws on input shorter than 2 bytes', () => {
    expect(() => decodeWsFrame('81')).toThrow('at least 2 bytes');
  });

  it('throws on empty hex string', () => {
    expect(() => decodeWsFrame('')).toThrow();
  });

  it('detects FIN bit', () => {
    // FIN=0 (0x01 & 0x80 = 0)
    const result = decodeWsFrame('01 00');
    expect(result.fin).toBe(false);
  });

  it('parses opcode correctly', () => {
    // 0x89 = FIN|Ping opcode
    const result = decodeWsFrame('89 00');
    expect(result.opcode).toBe(0x9);
    expect(result.opcodeLabel).toBe('Ping');
  });

  it('decodes a masked frame', () => {
    // Masked frame: MASK=1, payload_len=5, masking_key=0xDEADBEEF, payload
    // byte1 = 0x85 (MASK=1, payload_len=5)
    // masking key: 37 FA 21 3D
    // encoded payload: 7F 9F 4D 51 58 (encodes "Hello")
    const result = decodeWsFrame('81 85 37 FA 21 3D 7F 9F 4D 51 58');
    expect(result.masked).toBe(true);
    expect(result.maskingKey).toBeTruthy();
    expect(result.payloadLength).toBe(5);
  });

  it('parses 7-bit payload length', () => {
    const result = decodeWsFrame('81 05 48 65 6c 6c 6f');
    expect(result.payloadLengthExtended).toBe('7-bit');
  });

  it('parses RSV bits', () => {
    // RSV1=1: 0xC1
    const result = decodeWsFrame('C1 00');
    expect(result.rsv1).toBe(true);
    expect(result.rsv2).toBe(false);
    expect(result.rsv3).toBe(false);
  });

  it('handles binary opcode', () => {
    const result = decodeWsFrame('82 03 01 02 03');
    expect(result.opcode).toBe(0x2);
    expect(result.opcodeLabel).toBe('Binary');
  });

  it('handles close opcode', () => {
    const result = decodeWsFrame('88 00');
    expect(result.opcode).toBe(0x8);
    expect(result.opcodeLabel).toBe('Close');
  });
});

describe('OPCODES reference table', () => {
  it('has opcode 0x0 as Continuation', () => {
    expect(OPCODES[0x0]).toBe('Continuation');
  });
  it('has opcode 0x8 as Close', () => {
    expect(OPCODES[0x8]).toBe('Close');
  });
});

describe('CLOSE_CODES reference table', () => {
  it('contains code 1000', () => {
    const entry = CLOSE_CODES.find(c => c.code === 1000);
    expect(entry).toBeDefined();
    expect(entry!.name).toBe('Normal Closure');
  });
  it('contains code 1006', () => {
    const entry = CLOSE_CODES.find(c => c.code === 1006);
    expect(entry).toBeDefined();
  });
});

describe('formatFrameResult', () => {
  it('contains FIN, opcode, and payload sections', () => {
    const frame = decodeWsFrame('81 05 48 65 6c 6c 6f');
    const output = formatFrameResult(frame);
    expect(output).toContain('FIN:');
    expect(output).toContain('Opcode:');
    expect(output).toContain('Payload');
    expect(output).toContain('Hello');
  });
});
