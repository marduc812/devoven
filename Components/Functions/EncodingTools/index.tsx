'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  base32Encode, base32Decode,
  base58Encode, base58Decode,
  ascii85Encode, ascii85Decode,
  rot13,
  rot47,
  caesarEncode,
  morseEncode, morseDecode,
  punycodeEncode, punycodeDecode,
  quotedPrintableEncode, quotedPrintableDecode,
  base64urlEncode, base64urlDecode,
} from './logic';

export const Base32Encode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(base32Encode(fromValue));
    } catch {
      setToValue(fromValue ? 'Encoding error' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Base32 Encoder"
      description="Encode text to Base32 format using the RFC 4648 alphabet. For example, [1 Hello 2] becomes [1 JBSWY3DP 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Plain Text"
      toTitle="Base32 Encoded"
      swapLink="/encoding/base32-decode"
      backColor="yellow"
    />
  );
};

export const Base32Decode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(base32Decode(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid Base32 input' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Base32 Decoder"
      description="Decode Base32-encoded text back to plain text using the RFC 4648 alphabet. For example, [1 JBSWY3DP 2] becomes [1 Hello 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Base32 Encoded"
      toTitle="Plain Text"
      swapLink="/encoding/base32-encode"
      backColor="yellow"
    />
  );
};

export const Base58Encode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(base58Encode(fromValue));
    } catch {
      setToValue(fromValue ? 'Encoding error' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Base58 Encoder"
      description="Encode text to Base58 using the Bitcoin alphabet. Base58 omits easily confused characters like 0 (zero), O (capital o), I (capital i) and l (lower L). For example, [1 abc 2] becomes [1 ZiCa 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Plain Text"
      toTitle="Base58 Encoded"
      swapLink="/encoding/base58-decode"
      backColor="yellow"
    />
  );
};

export const Base58Decode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(base58Decode(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid Base58 input' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Base58 Decoder"
      description="Decode Base58-encoded text (Bitcoin alphabet) back to plain text. For example, [1 ZiCa 2] becomes [1 abc 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Base58 Encoded"
      toTitle="Plain Text"
      swapLink="/encoding/base58-encode"
      backColor="yellow"
    />
  );
};

export const Ascii85Encode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(ascii85Encode(fromValue));
    } catch {
      setToValue(fromValue ? 'Encoding error' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Ascii85 Encoder"
      description="Encode binary data to Ascii85 (Base85) format. More efficient than Base64, using 5 ASCII characters for every 4 bytes. Four null bytes are encoded as the shorthand [1 z 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Plain Text"
      toTitle="Ascii85 Encoded"
      swapLink="/encoding/ascii85-decode"
      backColor="yellow"
    />
  );
};

export const Ascii85Decode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(ascii85Decode(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid Ascii85 input' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Ascii85 Decoder"
      description="Decode Ascii85 (Base85) encoded text back to plain text. The shorthand [1 z 2] expands to four null bytes."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Ascii85 Encoded"
      toTitle="Plain Text"
      swapLink="/encoding/ascii85-encode"
      backColor="yellow"
    />
  );
};

export const Rot13 = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    setToValue(rot13(fromValue));
  }, [fromValue]);

  return (
    <BasicConverter
      title="ROT13 Encoder / Decoder"
      description="Apply ROT13 substitution cipher. Each letter is replaced by the letter 13 positions ahead in the alphabet. ROT13 is its own inverse — applying it twice returns the original text. For example, [1 Hello 2] becomes [1 Uryyb 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input"
      toTitle="ROT13 Output"
      backColor="yellow"
    />
  );
};

export const Rot47 = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    setToValue(rot47(fromValue));
  }, [fromValue]);

  return (
    <BasicConverter
      title="ROT47 Encoder / Decoder"
      description="Apply ROT47 substitution cipher. Rotates all printable ASCII characters (! through ~) by 47 positions, including digits and punctuation. ROT47 is its own inverse. For example, [1 Hello 2] becomes [1 w6==@ 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input"
      toTitle="ROT47 Output"
      backColor="yellow"
    />
  );
};

export const MorseEncode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(morseEncode(fromValue));
    } catch {
      setToValue(fromValue ? 'Contains characters not in Morse table (A-Z, 0-9 only)' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Morse Code Encoder"
      description="Convert text to Morse code. Supports A-Z and 0-9. Letters are separated by spaces, words by [1 / 2]. For example, [1 SOS 2] becomes [1 ... --- ... 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Plain Text"
      toTitle="Morse Code"
      swapLink="/encoding/morse-decode"
      backColor="yellow"
    />
  );
};

export const MorseDecode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(morseDecode(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid Morse code sequence' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Morse Code Decoder"
      description="Convert Morse code back to plain text. Separate letters with spaces and words with [1 / 2]. For example, [1 ... --- ... 2] becomes [1 SOS 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Morse Code"
      toTitle="Plain Text"
      swapLink="/encoding/morse-encode"
      backColor="yellow"
    />
  );
};

export const PunycodeEncode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(punycodeEncode(fromValue));
    } catch {
      setToValue(fromValue ? 'Encoding error' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Punycode Encoder"
      description="Encode internationalized domain names (IDN) to Punycode (ASCII-compatible encoding, RFC 3492). For example, [1 münchen.de 2] becomes [1 xn--mnchen-3ya.de 2]. ASCII-only labels are left unchanged."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Unicode Domain"
      toTitle="Punycode"
      swapLink="/encoding/punycode-decode"
      backColor="yellow"
    />
  );
};

export const PunycodeDecode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(punycodeDecode(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid Punycode input' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Punycode Decoder"
      description="Decode Punycode-encoded domain names back to Unicode. For example, [1 xn--mnchen-3ya.de 2] becomes [1 münchen.de 2]. Labels without [1 xn-- 2] prefix are left unchanged."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Punycode"
      toTitle="Unicode Domain"
      swapLink="/encoding/punycode-encode"
      backColor="yellow"
    />
  );
};

export const QuotedPrintableEncode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(quotedPrintableEncode(fromValue));
    } catch {
      setToValue(fromValue ? 'Encoding error' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Quoted-Printable Encoder"
      description="Encode text to Quoted-Printable format (RFC 2045). Non-ASCII bytes are encoded as [1 =XX 2] hex sequences. For example, [1 é 2] (U+00E9) becomes [1 =C3=A9 2] and [1 = 2] becomes [1 =3D 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Plain Text"
      toTitle="Quoted-Printable"
      swapLink="/encoding/quoted-printable-decode"
      backColor="yellow"
    />
  );
};

export const QuotedPrintableDecode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(quotedPrintableDecode(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid Quoted-Printable input' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Quoted-Printable Decoder"
      description="Decode Quoted-Printable encoded text back to plain text. [1 =XX 2] hex sequences are decoded to their UTF-8 characters. For example, [1 =C3=A9 2] becomes [1 é 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Quoted-Printable"
      toTitle="Plain Text"
      swapLink="/encoding/quoted-printable-encode"
      backColor="yellow"
    />
  );
};

export const Base64UrlEncode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(base64urlEncode(fromValue));
    } catch {
      setToValue(fromValue ? 'Encoding error' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Base64URL Encoder"
      description="Encode text to Base64URL format (RFC 4648 §5). Like Base64 but [1 + 2] becomes [1 - 2], [1 / 2] becomes [1 _ 2], and padding is removed. Safe for use in URLs and filenames."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Plain Text"
      toTitle="Base64URL Encoded"
      swapLink="/encoding/base64url-decode"
      backColor="yellow"
    />
  );
};

export const Base64UrlDecode = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    try {
      setToValue(base64urlDecode(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid Base64URL input' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Base64URL Decoder"
      description="Decode Base64URL encoded text (RFC 4648 §5). Handles [1 - 2] and [1 _ 2] characters and missing padding automatically."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Base64URL Encoded"
      toTitle="Plain Text"
      swapLink="/encoding/base64url-encode"
      backColor="yellow"
    />
  );
};
