'use client'

import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter'
import { Buffer } from 'buffer'
import AdvancedConverter from '../MainView/MainPanel/AdvancedConverter'
import { textToBinary, binaryToString, hexToBinary, trackToolError, urlEncodeAll, urlEncodeUnicode, urlDecodeWithUnicode, urlEncodeModes, URLEncodeMode } from './Utils'
import { stringToHex, hexToString, numberToHex, hexToNumber } from 'web3-utils'
import { Switch } from '@/Components/UI/Switch'

export const URLDecode = () => {

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');


  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])


  useEffect(() => {
    try {
      // decodeURIComponent does not know about %uXXXX, so parse those inputs ourselves
      setToValue(/%u[0-9a-fA-F]{4}/.test(fromValue)
        ? urlDecodeWithUnicode(fromValue)
        : decodeURIComponent(fromValue));
    } catch (error) {
      setToValue('Invalid input');
    }
  }, [fromValue])

  return (
    <BasicConverter
      title="URL Decoder"
      swapLink="/encoding/url-encode"
      description="URL decoding is a method to decode arbitrary data from a Uniform Resource Identifier (URI) that's been encoded using only the limited US-ASCII characters legal within a URI. For example, the string [1 Hello%2C%20World%21 2] becomes [1 Hello, World! 2]. The non-standard Unicode form [1 %u0048%u0065 2] is decoded as well."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='URL Encoded Input'
      toTitle='Text Output'
      pageTitle='Online URL Decoder'
      backColor='yellow'
    />
  )
}


export const URLEncode = ({ defaultMode = 'standard' }: { defaultMode?: URLEncodeMode } = {}) => {

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [mode, setMode] = useState<URLEncodeMode>(defaultMode);
  const [extraLink, setExtraLink] = useState<string>('');


  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';
    const modeQuery = (searchParams.get('mode') ?? '').toLowerCase();

    if (from != '') {
      setFromValue(from);
    }

    if (urlEncodeModes.includes(modeQuery as URLEncodeMode)) {
      setMode(modeQuery as URLEncodeMode);
    }
  }, [])


  useEffect(() => {
    setExtraLink('&mode=' + mode)

    if (mode === 'all') {
      setToValue(urlEncodeAll(fromValue))
    } else if (mode === 'unicode') {
      setToValue(urlEncodeUnicode(fromValue))
    } else {
      setToValue(encodeURIComponent(fromValue))
    }
  }, [fromValue, mode])

  const SelectElements = () => {
    return (
      <select className='mx-1 rounded border-2 border-black' onChange={(e) => setMode(e.target.value as URLEncodeMode)} defaultValue={mode}>
        <option value="standard">Standard</option>
        <option value="all">All Characters</option>
        <option value="unicode">Unicode (%uXXXX)</option>
      </select>
    )
  }

  return (
    <AdvancedConverter
      title={defaultMode === 'unicode' ? 'Unicode URL Encoder' : 'URL Encoder'}
      swapLink="/encoding/url-decode"
      description="URL encoding, is a method to encode arbitrary data in a Uniform Resource Identifier (URI) using only the limited US-ASCII characters legal within a URI. Standard encodes only the characters that are unsafe in a URI, so [1 Hello, World! 2] becomes [1 Hello%2C%20World%21 2]. All Characters percent-encodes every character, dots and letters included, turning [1 a.b 2] into [1 %61%2E%62 2]. Unicode uses the non-standard [1 %uXXXX 2] form, so [1 a.b 2] becomes [1 %u0061%u002E%u0062 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Text Input'
      toTitle='URL Encoded Output'
      extraElements={<SelectElements />}
      extraLink={extraLink}
      backColor='yellow'
    />
  )
}


export const HTMLEncode = () => {

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {

    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])


  useEffect(() => {
    const escaped = fromValue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    setToValue(escaped)
  }, [fromValue])

  return (
    <BasicConverter
      title="HTML Encoder"
      swapLink="/encoding/html-decode"
      description="HTML encoding is a method to encode arbitrary data into a format suitable for inclusion within HTML content. For example, the string [1 <script>alert(1)</script> 2] becomes [1 &amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt; 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Text Input'
      toTitle='HTML Encoded Output'
      backColor='yellow'
    />
  )
}


export const HTMLDecode = () => {

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');


  const setHTMLOutput = (userInput: string) => {
    let area = document.createElement("textarea");
    area.innerHTML = userInput;
    setToValue(area.value);
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])


  useEffect(() => {
    setHTMLOutput(fromValue)
  }, [fromValue])

  return (
    <BasicConverter
      title="HTML Decoder"
      swapLink="/encoding/html-encode"
      description="HTML decoding is a method to decode arbitrary data from a format used within HTML content back to its original form. For example, the string [1 &amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt; 2] becomes [1 <script>alert(1)</script> 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='HTML Encoded Input'
      toTitle='Text Output'
      backColor='yellow'
    />
  )
}


export const Base64Encode = () => {

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [encoding, setEncoding] = useState<BufferEncoding>('utf-8')
  const [extraLink, setExtraLink] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';
    const encode = searchParams.get('encoding') ?? '';

    if (from != '') {
      setFromValue(from);
      if (encode === 'utf-8' || encode === 'utf16le' || encode === 'ascii' || encode === 'hex') {
        setEncoding(encode)
      }
    }
  }, [])

  useEffect(() => {
    setExtraLink('&encoding=' + encoding)
    try {
      setToValue(Buffer.from(fromValue, encoding).toString('base64'));
    } catch {
      setToValue('Invalid input for selected encoding');
    }
  }, [fromValue, encoding])

  const SelectElements = () => {
    return (
      <select className='mx-1 rounded border-2 border-black' onChange={(e) => setEncoding(e.target.value as BufferEncoding)} defaultValue={encoding}>
        <option value="utf-8">UTF-8</option>
        <option value="utf16le">UTF16-LE</option>
        <option value="ascii">ASCII</option>
        <option value="hex">HEX</option>
      </select>
    )
  }

  return (
    <AdvancedConverter
      title="Base64 Encode"
      swapLink="/encoding/base64-decode"
      description="Base64 encoding is a method to encode arbitrary data into a format that consists of plain text characters. This encoding helps to ensure that the data remains intact without modification during transport. For example, the string [1 admin 2] becomes [1 YWRtaW4= 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Text Input'
      toTitle='Base64 Encoded Output'
      extraElements={<SelectElements />}
      extraLink={extraLink}
      backColor='yellow'
    />
  )
}



export const Base64Decode = () => {

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [encoding, setEncoding] = useState<BufferEncoding>('utf-8')
  const [extraLink, setExtraLink] = useState<string>('');

  useEffect(() => {

    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const allowedValues = ['utf-8', 'utf16le', 'ascii', 'hex']
    const from = searchParams.get('from') ?? '';
    const encode = searchParams.get('encoding') ?? '';

    if (from != '') {
      if (encode && allowedValues.includes(encode.toLowerCase())) {
        setEncoding(encode.toLowerCase() as BufferEncoding)
      } else {
        setEncoding('utf8')
      }
      setFromValue(from);
    }
  }, [])

  useEffect(() => {
    setExtraLink('&encoding=' + encoding)
    try {
      const decoded = Buffer.from(fromValue, 'base64').toString(encoding);
      // Lone surrogates crash encodeURIComponent in the swap link render
      const hasLoneSurrogate = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(decoded);
      if (hasLoneSurrogate) {
        trackToolError('base64-decode', 'lone_surrogate', encoding);
        setToValue('Decoded data contains invalid characters for ' + encoding + ' encoding. The input may not be valid ' + encoding + ' text.');
      } else {
        setToValue(decoded);
      }
    } catch {
      trackToolError('base64-decode', 'decode_error', encoding);
      setToValue('Invalid input for selected encoding');
    }
  }, [fromValue, encoding])

  const SelectElements = () => {
    return (
      <select className='mx-1 rounded border-2 border-black' onChange={(e) => setEncoding(e.target.value as BufferEncoding)} value={encoding}>
        <option value="utf-8">UTF-8</option>
        <option value="utf16le">UTF16-LE</option>
        <option value="ascii">ASCII</option>
        <option value="hex">HEX</option>
      </select>
    )
  }

  return (
    <AdvancedConverter
      title="Base64 Decode"
      swapLink="/encoding/base64-encode"
      description="Base64 encoding is a method to encode arbitrary data into a format that consists of plain text characters. This encoding helps to ensure that the data remains intact without modification during transport. For example, the string [1 YWRtaW4= 2] becomes [1 admin 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Base64 Encoded Input'
      toTitle='Text Output'
      extraElements={<SelectElements />}
      extraLink={extraLink}
      backColor='yellow'
    />
  )
}

export const StringToBinary = () => {

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {

    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])


  useEffect(() => {
    try {
      setToValue(textToBinary(fromValue));
    } catch (error) {
      setToValue('Invalid input');
    }
  }, [fromValue])

  return (
    <BasicConverter
      title="String to Binary"
      swapLink="/converting/binary-to-string"
      description="String to binary encoding is a method to transform human-readable text into its binary representation using the sequence of bits that corresponds to the specific encoding standard, ensuring data is suitable for operations requiring binary formats. For example, the string [1 Admin 2] becomes [1 01000001 01100100 01101101 01101001 01101110  2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Text Input'
      toTitle='Binary Output'
      pageTitle='Online String to Binary Converter'
      backColor='cyan'
    />
  )
}



export const BinaryToString = () => {

  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');


  useEffect(() => {

    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])


  useEffect(() => {
    try {
      setToValue(binaryToString(fromValue));
    } catch (error) {
      setToValue('Invalid input');
    }
  }, [fromValue])

  return (
    <BasicConverter
      title="Binary to String"
      swapLink="/converting/string-to-binary"
      description="String to binary conversion is a method to transform human-readable text into its binary representation using the sequence of bits that corresponds to the specific encoding standard, ensuring data is suitable for operations requiring binary formats. For example, the string [1 01000001 01100100 01101101 01101001 01101110 2] becomes [1 Admin 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Binary Input'
      toTitle='Text Output'
      pageTitle='Online Binary to String Converter'
      backColor='cyan'
    />
  )
}



const BYTES32_MAX_CHARS = 31; // 31 ASCII chars = 62 hex chars + "0x" = 64, leaves room for padding

export const StringToBytes32 = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [zero, setZero] = useState<boolean>(false)
  const [extraLink, setExtraLink] = useState<string>('');

  useEffect(() => {

    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';
    const zeroQuery = searchParams.get('zeros') ?? '';

    if (from != '') {
      const cleanFrom = from.replace(/\u0000/g, '').slice(0, BYTES32_MAX_CHARS);
      setFromValue(cleanFrom);
      if (zeroQuery === 'true') {
        setZero(true);
      } else {
        setZero(false);
      }
    }
  }, [])

  useEffect(() => {
    setExtraLink('&zeros=' + zero)
    setToValue(zeroHandler(stringToHex(fromValue)))
  }, [fromValue, zero])

  const addZeros = (num: string): string => {
    const zeroCount = 66 - num.toString().length;
    if (zeroCount < 0) return num.toString().slice(0, 66);
    return num.toString() + "0".repeat(zeroCount);
  }

  const zeroHandler = (selvalue: string): string => {
    return zero ? addZeros(selvalue) : selvalue.toString();
  }

  const handleSetFromValue: Dispatch<SetStateAction<string>> = (val) => {
    const resolved = typeof val === 'function' ? val(fromValue) : val;
    setFromValue(resolved.slice(0, BYTES32_MAX_CHARS));
  }

  const CheboxElement = () => {
    return (
      <div className='flex flex-row items-center gap-4 flex-wrap'>
        <Switch checked={zero} onChange={setZero} label="Append Zeros" />
        <span className={`text-xs font-mono ${fromValue.length >= BYTES32_MAX_CHARS ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
          {fromValue.length}/{BYTES32_MAX_CHARS} chars
        </span>
      </div>
    )
  }

  return (
    <AdvancedConverter
      title="String to Bytes32"
      swapLink="/converting/bytes32-to-string"
      description="Bytes32 format is used in smart contracts with specific length of 64 characters, most commonly using the solidity programming language. For example, the string [1 test 2] becomes [1 0x74657374000000000000000000000000000000000000000000000000000000 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={handleSetFromValue}
      fromTitle='Text Input'
      toTitle='Bytes32 Output'
      extraElements={<CheboxElement />}
      extraLink={extraLink}
      backColor='cyan'
    />
  )
}

export const NumberToBytes32 = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [zero, setZero] = useState<boolean>(false)
  const [extraLink, setExtraLink] = useState<string>('');

  useEffect(() => {

    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';
    const zeroQuery = searchParams.get('zeros') ?? '';

    if (from != '') {
      setFromValue(from);
      if (zeroQuery === 'true') {
        setZero(true);
      } else {
        setZero(false);
      }
    }
  }, [])

  useEffect(() => {
    setExtraLink('&zeros=' + zero)
    setToValue(numberToHex(fromValue))
  }, [fromValue, zero])


  return (
    <BasicConverter
      title="Number to Bytes32"
      swapLink="/converting/bytes32-to-number"
      description="Bytes32 format is used in smart contracts with specific length of 64 characters, most commonly using the solidity programming language. For example, the number [1 2310 2] becomes [1 0x906 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Number Input'
      toTitle='Bytes32 Output'
      backColor='cyan' />
  )
}


export const Bytes32ToString = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');


  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])

  useEffect(() => {
    if (fromValue.length < 67 && fromValue.length > 4) {
      const validInput = hexValidator(fromValue);
      if (validInput.valid && validInput.output.length % 2 === 0) {
        setFromValue(validInput.output);
        setToValue(hexToString(validInput.output));
      }
    } else if (fromValue.length === 0) {
      setToValue('');
    }
  }, [fromValue]);

  const hexValidator = (userInput: string) => {
    const hexChunks = userInput.split(' ').map(chunk => chunk.startsWith('0x') ? chunk.slice(2) : chunk);

    userInput = '0x' + hexChunks.join('');

    const validHexInput = /0[xX][0-9a-fA-F]+$/.test(userInput);
    return { valid: validHexInput, output: userInput }
  }

  return (
    <BasicConverter
      title="Bytes32 to String"
      swapLink="/converting/string-to-bytes32"
      description="Bytes32 format is used in smart contracts with specific length of 64 characters, most commonly using the Solidity programming language. For example, the string [1 0x74657374000000000000000000000000000000000000000000000000000000 2] becomes [1 test 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Bytes32 Input'
      toTitle='Text Output'
      backColor='cyan'
    />
  )
}

export const Bytes32ToNumber = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');


  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])

  useEffect(() => {
    if (fromValue.length < 67 && fromValue.length > 4) {
      const validInput = hexValidator(fromValue);
      if (validInput.valid) {
        setFromValue(validInput.output);
        setToValue(hexToNumber(validInput.output).toString());
      }
    } else if (fromValue.length === 0) {
      setToValue('');
    }
  }, [fromValue]);

  const hexValidator = (userInput: string) => {
    const hexChunks = userInput.split(' ').map(chunk => chunk.startsWith('0x') ? chunk.slice(2) : chunk);

    userInput = '0x' + hexChunks.join('');

    const validHexInput = /0[xX][0-9a-fA-F]+$/.test(userInput);
    return { valid: validHexInput, output: userInput }
  }

  return (
    <BasicConverter
      title="Bytes32 to Number"
      swapLink="/converting/number-to-bytes32"
      description="Bytes32 format is used in smart contracts with specific length of 64 characters, most commonly using the Solidity programming language. For example, the number [1 0x906 2] becomes [1 2310 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Bytes32 Input'
      toTitle='Number Output'
      backColor='cyan'
    />
  )
}

export const BinaryToHex = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');


  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])

  useEffect(() => {
    if (/\b[01]+\b/.test(fromValue) && fromValue != '') {
      setToValue(binToHex(fromValue.replace(/\s/g, '')));
    } else {
      setToValue('Invalid binary input')
    }
  }, [fromValue]);

  const binToHex = (input: string) => {
    const groups = input.match(/.{4}/g);
    if (groups) {
      return groups.reduce((acc, i) => acc + parseInt(i, 2).toString(16), '');
    }
    return '';
  }

  return (
    <BasicConverter
      title="Binary to Hex"
      swapLink="/converting/hex-to-binary"
      description="Binary format is often used to represent raw data sequences in computing, while hexadecimal format offers a more compact and readable representation, especially when dealing with long binary sequences. For example, the string [1 11011110101011011011111011101111 2] becomes [1 deadbeef 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Binary Input'
      toTitle='Hex Output'
      backColor='cyan'
    />
  )
}

export const HexToBinary = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');


  useEffect(() => {

    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';

    if (from != '') {
      setFromValue(from);
    }
  }, [])

  useEffect(() => {
    if (fromValue != '') {
      try {
        setToValue(hexToBinary(fromValue));
      } catch {
        trackToolError('hex-to-binary', 'invalid_hex');
        setToValue('Invalid input');
      }
    } else {
      setToValue('')
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Hex to Binary"
      swapLink="/converting/binary-to-hex"
      description="Hexadecimal format is often used to represent byte data in computing, while ASCII format offers a more human-readable representation, especially when dealing with alphanumeric sequences. For example, the string [1 deadbeef 2] becomes [1 11011110101011011011111011101111 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Hex Input'
      toTitle='Binary Output'
      backColor='cyan'
    />
  )
}


export const TextToHex = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [zero, setZero] = useState<boolean>(false)
  const [appendSpace, setAppendSpace] = useState<boolean>(false);
  const [extraLink, setExtraLink] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';
    const zeroQuery = searchParams.get('zeros') ?? false;
    const preSpace = searchParams.get('space') ?? false;

    if (from != '') {
      setFromValue(from);
      if (zeroQuery === 'true') {
        setZero(true);
      } else {
        setZero(false);
      }
      if (preSpace === 'true') {
        setAppendSpace(true);
      } else {
        setAppendSpace(false);
      }
    }
  }, [])

  useEffect(() => {
    setExtraLink('&zeros=' + zero)
    setToValue(hexConverter(fromValue))
  }, [fromValue, zero, appendSpace])

  const zeroButtonHandler = () => {
    setZero(append => !append)
  }

  const spaceButtonHandler = () => {
    setAppendSpace(append => !append)
    setToValue(hexConverter(fromValue));
  }

  const formatter = (text: string) => {
    text = zero ? '0x' + text : text
    text = appendSpace ? ' ' + text : text
    return text
  }

  const hexConverter = (input: string) => {
    var result = '';
    for (var i = 0; i < input.length; i++) {
      result += formatter(input.charCodeAt(i).toString(16));
    }
    return result.trim();
  }

  const CheboxElement = () => {
    return (
      <div className='flex flex-row items-center gap-4'>
        <Switch checked={appendSpace} onChange={setAppendSpace} label="Spaced" />
        <Switch checked={zero} onChange={setZero} label="Prepend 0x" />
      </div>
    )
  }

  return (
    <AdvancedConverter
      title="Text to Hex"
      swapLink="/converting/hex-to-text"
      description="Hexadecimal format is often used to represent byte data in computing, while ASCII format offers a more human-readable representation, especially when dealing with alphanumeric sequences. For example, the string [1 admin 2] becomes [1 61646d696e 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Text Input'
      toTitle='Hex Output'
      extraElements={<CheboxElement />}
      extraLink={extraLink}
      backColor='cyan'
    />
  )
}


export const DecToHex = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from !== '') {
      setFromValue(from);
    }
  }, [])

  useEffect(() => {
    if (fromValue === '') {
      setToValue('');
      return;
    }
    const num = parseInt(fromValue, 10);
    if (isNaN(num)) {
      setToValue('Invalid input');
    } else {
      setToValue(num.toString(16));
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Decimal to Hex"
      swapLink="/converting/hex-to-dec"
      description="Decimal to hexadecimal conversion translates a base-10 number into its base-16 equivalent, using digits 0–9 and letters A–F. For example, the number [1 255 2] becomes [1 ff 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Decimal Input'
      toTitle='Hex Output'
      pageTitle='Online Decimal to Hex Converter'
      backColor='cyan'
    />
  )
}


export const DecToOctal = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from !== '') setFromValue(from);
  }, [])

  useEffect(() => {
    if (fromValue === '') { setToValue(''); return; }
    const num = parseInt(fromValue, 10);
    if (isNaN(num)) { setToValue('Invalid input'); return; }
    setToValue(num.toString(8));
  }, [fromValue]);

  return (
    <BasicConverter
      title="Decimal to Octal"
      swapLink="/converting/octal-to-dec"
      description="Decimal to octal conversion translates a base-10 number into its base-8 equivalent, using digits 0–7. For example, the number [1 255 2] becomes [1 377 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Decimal Input'
      toTitle='Octal Output'
      pageTitle='Online Decimal to Octal Converter'
      backColor='cyan'
    />
  )
}


export const OctalToDec = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from !== '') setFromValue(from);
  }, [])

  useEffect(() => {
    if (fromValue === '') { setToValue(''); return; }
    if (!/^[0-7]+$/.test(fromValue)) { setToValue('Invalid input'); return; }
    setToValue(parseInt(fromValue, 8).toString(10));
  }, [fromValue]);

  return (
    <BasicConverter
      title="Octal to Decimal"
      swapLink="/converting/dec-to-octal"
      description="Octal to decimal conversion translates a base-8 number into its base-10 equivalent. For example, the octal value [1 377 2] becomes [1 255 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Octal Input'
      toTitle='Decimal Output'
      pageTitle='Online Octal to Decimal Converter'
      backColor='cyan'
    />
  )
}


export const HexToDec = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from !== '') {
      setFromValue(from);
    }
  }, [])

  useEffect(() => {
    if (fromValue === '') {
      setToValue('');
      return;
    }
    const cleaned = fromValue.startsWith('0x') || fromValue.startsWith('0X')
      ? fromValue.slice(2)
      : fromValue;
    const num = parseInt(cleaned, 16);
    if (isNaN(num)) {
      setToValue('Invalid input');
    } else {
      setToValue(num.toString(10));
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Hex to Decimal"
      swapLink="/converting/dec-to-hex"
      description="Hexadecimal to decimal conversion translates a base-16 number into its base-10 equivalent. For example, the hex value [1 ff 2] becomes [1 255 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Hex Input'
      toTitle='Decimal Output'
      pageTitle='Online Hex to Decimal Converter'
      backColor='cyan'
    />
  )
}


export const HexToText = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [stripZero, setStripZero] = useState<boolean>(false)
  const [stripSpace, setStripSpace] = useState<boolean>(false);


  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );

    const from = searchParams.get('from') ?? '';
    const zeroQuery = searchParams.get('zeros') ?? false;
    const spaceQuery = searchParams.get('space') ?? false;

    if (from !== '') {
      setFromValue(from);
      setStripZero(zeroQuery === 'true');
      setStripSpace(spaceQuery === 'true');
    }
  }, []);

  useEffect(() => {
    setToValue(textConverter(fromValue));
  }, [fromValue, stripZero, stripSpace]);

  const formatter = (hex: string) => {
    if (stripZero) {
      hex = hex.replace(/0x/g, '');
    }

    if (stripSpace) {
      hex = hex.replace(/\s+/g, '');
    } else {
      hex = hex.replace(/\s+/g, '').match(/.{1,2}/g)?.join(' ') || '';
    }

    return hex;
  }

  const textConverter = (input: string) => {
    input = formatter(input);
    let str = '';

    // If the formatted string contains spaces, split it. Else, treat it as a continuous string.
    const hexValues = input.includes(' ') ? input.split(' ') : input.match(/.{1,2}/g) || [];

    // Convert each hex pair to a character
    for (const hexValue of hexValues) {
      str += String.fromCharCode(parseInt(hexValue, 16));
    }

    return str;
  }


  return (
    <BasicConverter
      title="Hex to Text"
      swapLink="/converting/text-to-hex"
      description="Hexadecimal format is often used to represent byte data in computing, while ASCII format offers a more human-readable representation. For example, the hex '68656c6c6f' becomes the text 'hello'."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Hex Input'
      toTitle='Text Output'
      backColor='cyan'
    />
  )
}
