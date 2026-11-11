import * as conversions from '@/lib/hex-conversions';

// Compatibility vectors captured from web3-utils 4.3.3 before removing it.
const cases = [
  {
    "fn": "hexToBytes",
    "input": "",
    "expected": []
  },
  {
    "fn": "hexToBytes",
    "input": "0x",
    "expected": []
  },
  {
    "fn": "hexToBytes",
    "input": "0x00ff",
    "expected": [
      0,
      255
    ]
  },
  {
    "fn": "hexToBytes",
    "input": "DEADBEEF",
    "expected": [
      222,
      173,
      190,
      239
    ]
  },
  {
    "fn": "hexToBytes",
    "input": "0Xff",
    "expected": [
      255
    ]
  },
  {
    "fn": "hexToBytes",
    "input": "0xabc",
    "error": true
  },
  {
    "fn": "hexToBytes",
    "input": "0xgg",
    "error": true
  },
  {
    "fn": "hexToBytes",
    "input": " ff",
    "error": true
  },
  {
    "fn": "stringToHex",
    "input": "",
    "expected": "0x"
  },
  {
    "fn": "stringToHex",
    "input": "hello",
    "expected": "0x68656c6c6f"
  },
  {
    "fn": "stringToHex",
    "input": "\u0000a\u0000",
    "expected": "0x61"
  },
  {
    "fn": "stringToHex",
    "input": "\u0000\u0000a\u0000\u0000",
    "expected": "0x006100"
  },
  {
    "fn": "stringToHex",
    "input": "a\u0000b",
    "expected": "0x610062"
  },
  {
    "fn": "stringToHex",
    "input": "café",
    "expected": "0x636166c3a9"
  },
  {
    "fn": "stringToHex",
    "input": "😀",
    "expected": "0xf09f9880"
  },
  {
    "fn": "hexToString",
    "input": "0x",
    "expected": ""
  },
  {
    "fn": "hexToString",
    "input": "0x6100",
    "expected": "a\u0000"
  },
  {
    "fn": "hexToString",
    "input": "0x006100",
    "expected": "\u0000a\u0000"
  },
  {
    "fn": "hexToString",
    "input": "0xff",
    "expected": "�"
  },
  {
    "fn": "hexToString",
    "input": "0xabc",
    "error": true
  },
  {
    "fn": "hexToString",
    "input": "6162",
    "expected": "ab"
  },
  {
    "fn": "hexToString",
    "input": "0xf09f9880",
    "expected": "😀"
  },
  {
    "fn": "hexToString",
    "input": "0xefbbbf61",
    "expected": "a"
  },
  {
    "fn": "numberToHex",
    "input": "",
    "expected": "0x0"
  },
  {
    "fn": "numberToHex",
    "input": "42",
    "expected": "0x2a"
  },
  {
    "fn": "numberToHex",
    "input": "-42",
    "expected": "-0x2a"
  },
  {
    "fn": "numberToHex",
    "input": "1.5",
    "error": true
  },
  {
    "fn": "numberToHex",
    "input": "0xff",
    "expected": "0xff"
  },
  {
    "fn": "numberToHex",
    "input": "9007199254740993",
    "expected": "0x20000000000001"
  },
  {
    "fn": "numberToHex",
    "input": "-9007199254740993",
    "expected": "-0x20000000000001"
  },
  {
    "fn": "hexToNumber",
    "input": "0x",
    "error": true
  },
  {
    "fn": "hexToNumber",
    "input": "0xff",
    "expected": 255
  },
  {
    "fn": "hexToNumber",
    "input": "-0xff",
    "expected": -255
  },
  {
    "fn": "hexToNumber",
    "input": "0x20000000000001",
    "expected": {
      "bigint": "9007199254740993"
    }
  },
  {
    "fn": "hexToNumber",
    "input": "-0x20000000000001",
    "expected": {
      "bigint": "-9007199254740993"
    }
  },
  {
    "fn": "hexToNumber",
    "input": "ff",
    "error": true
  },
  {
    "fn": "hexToNumber",
    "input": "0XFF",
    "expected": 255
  }
];

describe('hex conversion compatibility', () => {
  it.each(cases)('$fn($input)', ({ fn, input, expected, error }) => {
    const convert = conversions[fn as keyof typeof conversions];
    if (error) {
      expect(() => convert(input)).toThrow();
      return;
    }
    const result = convert(input);
    const normalized = result instanceof Uint8Array ? Array.from(result)
      : typeof result === 'bigint' ? { bigint: result.toString() } : result;
    expect(normalized).toEqual(expected);
  });
});
