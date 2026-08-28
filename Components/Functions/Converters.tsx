'use client'

import React, { useEffect, useState } from 'react';
import { Switch } from '@/Components/UI/Switch';
import { keccak_256 } from 'js-sha3';
import { hexToBytes } from 'web3-utils';
import BasicConverter from '../MainView/MainPanel/BasicConverter';
import AdvancedConverter from '../MainView/MainPanel/AdvancedConverter';
import Panel from '../MainView/MainPanel/Panel';
import { IoClipboardOutline } from 'react-icons/io5';
import { hexToRgb, rgbToHex } from './Utils';
import RGBToHexView from '@/Components/View/RGBToHex'
import RGBToCMYKView from '@/Components/View/RGBToCMYK'
import ColorInputAnalytics from '../HexToRGB/ColorInputAnalytics';
import toast from 'react-hot-toast';
import CMYKToRGBView from '../View/CMYKToRGB';
import UnixTimestampView from '../View/UnixTimestamp';

export const ETHPubToAddr = () => {
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
      const userInput = fromValue.replace('0x', '');
      let formattedInput = userInput.replace(/^04/, '');

      if (formattedInput.length % 2 !== 0) {
        formattedInput = '0' + formattedInput;
      }

      try {
        setToValue('0x' + keccak_256(hexToBytes('0x' + formattedInput)).toUpperCase().slice(-40));
      } catch (error) {
        console.error("Failed to convert", error);
        setToValue('Invalid input');
      }
    } else {
      setToValue('');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Ethereum Public Key To Address"
      description="The address of a public key in Ethereum is calculated by doing keccak 256 on the bytes representation of the public key and keeping only the last 40 bytes. For example, the hex value [1 DEADBEEF 2] becomes [1 0xE11198C739161B4C0116A9A2DCCDFA1C492006F1 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Public Key'
      toTitle='Wallet Address'
      backColor='cyan'
    />
  )
}



export const HexToRGB = () => {
  const [fromValue, setFromValue] = useState<string>('#000000');
  const [toValue, setToValue] = useState<{ r: number; g: number; b: number; }>({ r: 0, g: 0, b: 0 });
  

  // Convert HEX to RGB
  const convertToRGB = (hexColor: string) => {
    if (/^#(?:[0-9a-fA-F]{6})$/.test(hexColor)) {
      const rgbColor = hexToRgb(hexColor);
      if (rgbColor) {
        setToValue(rgbColor);
      }
    } else {
      setToValue({ r: 0, g: 0, b: 0 });
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
  
    const from = searchParams.get('from') ?? '';
    if (from != '') {
      setFromValue(from);
    }
  }, []);


  const colorInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    const colorInput = event.target.value;
    setFromValue(colorInput);
    convertToRGB(colorInput);
  };

  const threeToSixHex = (input: string): string => {
    if (input.length === 4) {
      const formatted = input.split("").map((item: string) => {
        if (item === "#") { return item }
        return item + item;
      }).join("");
      return formatted;
    } else {
      return input;
    }
  }

  const notifySuccess = (message: string) => toast.success(message)

  const copyHandler = (colorSelected: string) => {
    navigator.clipboard.writeText(colorSelected);
    notifySuccess('Copied to clipboard');
  }

  return (
    <Panel
      title="Hex to RGB"
      description="A hex to RGB converter is a tool that translates hexadecimal color values into their respective Red, Green, and Blue components, commonly used in web design and graphic applications to specify colors. For example, the hex value [1 #A43737 2] becomes [1 Red: 164, Green: 55, Blue: 55 2]."
      backColor='cyan'
      extraElements={
        <div className="flex flex-col gap-5 w-full">

          {/* Color swatch */}
          <div
            style={{ backgroundColor: threeToSixHex(fromValue) || '#000000' }}
            className="h-14 w-full border border-gray-200 transition-colors duration-300"
          />

          {/* Hex input + color picker */}
          <div className="flex items-center gap-3">
            <input
              maxLength={7}
              value={fromValue}
              onChange={(e) => { setFromValue(e.target.value); convertToRGB(e.target.value); }}
              placeholder="#000000"
              className="flex-1 bg-gray-950/80 border border-gray-200 text-gray-900 font-mono text-sm px-4 py-2.5 focus:border-gray-400 focus:outline-none"
            />
            <input
              type="color"
              onChange={colorInputHandler}
              value={threeToSixHex(fromValue)}
              className="h-10 w-10 cursor-pointer border border-gray-200 bg-transparent"
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-200" />

          {/* RGB output cards */}
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: 'R', name: 'Red',   value: toValue.r, accent: 'text-red-400' },
              { label: 'G', name: 'Green', value: toValue.g, accent: 'text-green-700' },
              { label: 'B', name: 'Blue',  value: toValue.b, accent: 'text-blue-400' },
            ] as const).map(({ label, name, value, accent }) => (
              <button
                key={label}
                onClick={() => copyHandler(value.toString())}
                className="flex flex-col items-center gap-1 bg-gray-950/80 border border-gray-200 py-3 px-2 hover:border-gray-400 transition-all duration-200 group"
                aria-label={`Copy ${name}`}
              >
                <span className={`text-xs font-bold ${accent}`}>{label}</span>
                <span className="text-2xl font-light text-gray-900">{value}</span>
                <IoClipboardOutline className="text-gray-700 group-hover:text-gray-400 text-xs transition-colors" />
              </button>
            ))}
          </div>

          {/* CSS rgb() string */}
          <button
            onClick={() => copyHandler(`rgb(${toValue.r}, ${toValue.g}, ${toValue.b})`)}
            className="flex items-center justify-between bg-gray-950/80 border border-gray-200 px-4 py-2.5 hover:border-gray-400 transition-all duration-200 group"
          >
            <span className="text-sm font-mono text-gray-300">rgb({toValue.r}, {toValue.g}, {toValue.b})</span>
            <IoClipboardOutline className="text-gray-600 group-hover:text-gray-300 transition-colors shrink-0 ml-2" />
          </button>

        </div>
      }
    />
  )
}



export const RGBToHex = () => {
  const [tovalue, setToValue] = useState<string>('#000000');
  const [fromRed, setFromRed] = useState<string>('0');
  const [fromGreen, setFromGreen] = useState<string>('0');
  const [fromBlue, setFromBlue] = useState<string>('0');


  const rgbToHex = (r: string, g: string, b: string) => '#' + [r, g, b].map(x => {
    const hex = parseInt(x).toString(16).toUpperCase()
    return hex.length === 1 ? '0' + hex : hex
  }).join('')

  useEffect(() => {
    if (validateInput(fromRed) && validateInput(fromGreen) && validateInput(fromBlue)) {
      setToValue(rgbToHex(fromRed, fromGreen, fromBlue))
    } else {
      setToValue('');
    }
  }, [fromRed, fromBlue, fromGreen]);

  const validateInput = (userInput: string) => {
    if (userInput !== '' && Number(userInput) >= 0 && Number(userInput) < 256) {
      return true
    } else {
      return false
    }
  }

  return (
    <Panel
      title="RGB to Hex"
      description="An RGB to hex converter is a tool that translates the Red, Green, and Blue color components into their corresponding hexadecimal value, often utilized in web design and digital media to represent colors. For example, the value [1 Red: 164, Green: 55, Blue: 55 2] becomes [1 #A43737 2]."
      backColor='cyan'
      extraElements={
        <RGBToHexView
          fromRed={fromRed}
          fromBlue={fromBlue}
          fromGreen={fromGreen}
          toValue={tovalue}
          setFromBlue={setFromBlue}
          setFromRed={setFromRed}
          setFromGreen={setFromGreen}
        />
      }
    />
  )
}


export const RGBToCMYK = () => {
  const [fromRed, setFromRed] = useState<string>('0');
  const [fromGreen, setFromGreen] = useState<string>('0');
  const [fromBlue, setFromBlue] = useState<string>('0');
  const [toValue, setToValue] = useState<{ c: number, m: number, y: number, k: number }>({ c: 0, m: 0, y: 0, k: 0 });
  const [toRGBColor, setToRGBColor] = useState<string>('#000000');

  

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
  
    const from = searchParams.get('from') ?? '';

    if (from !== '') {
      const rgbValues = from.split(',').map(value => value.trim());
      if (rgbValues.length === 3) {
        if (validateInput(rgbValues[0]) && validateInput(rgbValues[1]) && validateInput(rgbValues[2])) {
          setFromRed(rgbValues[0]);
          setFromGreen(rgbValues[1]);
          setFromBlue(rgbValues[2]);
        }
      }
    }
  }, [])


  const rgbToCmyk = (r: number, g: number, b: number) => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));

    c = (c - k) / (1 - k);
    m = (m - k) / (1 - k);
    y = (y - k) / (1 - k);

    c = Math.round(c * 10000) / 100;
    m = Math.round(m * 10000) / 100;
    y = Math.round(y * 10000) / 100;
    k = Math.round(k * 10000) / 100;

    c = isNaN(c) ? 0 : c;
    m = isNaN(m) ? 0 : m;
    y = isNaN(y) ? 0 : y;
    k = isNaN(k) ? 0 : k;

    return {
      c: Math.round(c),
      m: Math.round(m),
      y: Math.round(y),
      k: Math.round(k)
    }
  }

  useEffect(() => {
    if (validateInput(fromRed) && validateInput(fromGreen) && validateInput(fromBlue)) {
      setToRGBColor(rgbToHex(Number(fromRed), Number(fromGreen), Number(fromBlue)))
      setToValue(rgbToCmyk(Number(fromRed), Number(fromGreen), Number(fromBlue)))
    } else {
      setToValue({ c: 0, m: 0, y: 0, k: 0 });
    }
  }, [fromRed, fromBlue, fromGreen]);

  const validateInput = (userInput: string) => {
    if (userInput !== '' && Number(userInput) >= 0 && Number(userInput) < 256) {
      return true
    } else {
      return false
    }
  }

  return (
    <Panel
      title="RGB to CMYK"
      description="An RGB to CMYK converter is a tool that translates the Red, Green, and Blue color components into their corresponding Cyan, Magenta, Yellow, and Key (black) values. This conversion is often utilized in the printing industry and graphic design to represent colors for print materials, as CMYK is the color model typically used for color printing. For example, the value [1 Red: 164, Green: 55, Blue: 55 2] becomes [1 Cyan: 0%, Magenta: 66%, Yellow: 66%, Key: 36% 2]."
      backColor='cyan'
      extraElements={
        <RGBToCMYKView
          fromRed={fromRed}
          fromBlue={fromBlue}
          fromGreen={fromGreen}
          toValue={toValue}
          setFromBlue={setFromBlue}
          setFromRed={setFromRed}
          setFromGreen={setFromGreen}
          toRGBColor={toRGBColor}
        />
      }
    />
  )
}


export const TextReplace = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');
  const [find, setFind] = useState<string>('');
  const [replace, setReplace] = useState<string>('');
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [regexError, setRegexError] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from !== '') setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue || !find) {
      setToValue(fromValue);
      setRegexError('');
      return;
    }
    try {
      if (useRegex) {
        const regex = new RegExp(find, 'g');
        setToValue(fromValue.replace(regex, replace));
      } else {
        setToValue(fromValue.replaceAll(find, replace));
      }
      setRegexError('');
    } catch {
      setRegexError('Invalid regex pattern');
      setToValue('');
    }
  }, [fromValue, find, replace, useRegex]);

  const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-1.5 text-sm font-mono placeholder:text-gray-400';

  return (
    <AdvancedConverter
      title="Text Replace"
      description="Replace text or patterns inside any string. Enable [1 Regex 2] mode to use regular expressions for advanced matching. For example, replacing [1 hello 2] with [1 hi 2] turns [1 hello world 2] into [1 hi world 2]."
      fromValue={fromValue}
      toValue={regexError || toValue}
      setFromValue={setFromValue}
      fromTitle='Input Text'
      toTitle='Result'
      backColor='cyan'
      extraElements={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex-shrink-0">Find:</label>
            <input
              type="text"
              value={find}
              onChange={(e) => setFind(e.target.value)}
              placeholder={useRegex ? 'Pattern…' : 'Text to find…'}
              className={inputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex-shrink-0">Replace:</label>
            <input
              type="text"
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
              placeholder="Replace with…"
              className={inputClass}
            />
          </div>
          <Switch checked={useRegex} onChange={setUseRegex} label="Regex" />
          {regexError && (
            <span className="text-xs text-red-400">{regexError}</span>
          )}
        </div>
      }
    />
  );
};


export const UnixTimestampConverter = () => {
  return (
    <Panel
      title="Unix Timestamp Converter"
      description="Convert a Unix timestamp to a human-readable date, or a date to a Unix timestamp. Supports both standard (seconds) and long (milliseconds) formats. Auto-detect is on by default — values with 13+ digits are treated as milliseconds. For example, [1 1710000000 2] represents [1 2024-03-09T16:00:00.000Z 2]."
      backColor='cyan'
      extraElements={<UnixTimestampView />}
    />
  )
}


export const CMYKToRGB = () => {
  const [fromCyan, setFromCyan] = useState<string>('0');
  const [fromMagenta, setFromMagenta] = useState<string>('0');
  const [fromYellow, setFromYellow] = useState<string>('0');
  const [fromKey, setFromKey] = useState<string>('0');
  const [toValue, setToValue] = useState<{ r: number, g: number, b: number }>({ r: 0, g: 0, b: 0 });
  const [toRGBColor, setToRGBColor] = useState<string>('#000000');

  

  useEffect(() => {

    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    
    if (from !== '') {
      const cmykValues = from.split(',').map(value => value.trim());
      if (cmykValues.length === 4) {
        if (validateInput(cmykValues[0]) && validateInput(cmykValues[1]) && validateInput(cmykValues[2]) && validateInput(cmykValues[3])) {
          setFromCyan(cmykValues[0]);
          setFromMagenta(cmykValues[1]);
          setFromYellow(cmykValues[2]);
          setFromKey(cmykValues[3]);
        }
      }
    }
  }, [])

  const cmyk2rgb = function (c: number, m: number, y: number, k: number) {
    c = (c / 100);
    m = (m / 100);
    y = (y / 100);
    k = (k / 100);

    c = c * (1 - k) + k;
    m = m * (1 - k) + k;
    y = y * (1 - k) + k;

    var r = 1 - c;
    var g = 1 - m;
    var b = 1 - y;

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    }
  }

  useEffect(() => {
    if (validateInput(fromCyan) && validateInput(fromMagenta) && validateInput(fromYellow) && validateInput(fromKey)) {
      const rgbColors = cmyk2rgb(Number(fromCyan), Number(fromMagenta), Number(fromYellow), Number(fromKey))
      setToRGBColor(rgbToHex(rgbColors.r, rgbColors.g, rgbColors.b))
      setToValue(rgbColors)
    } else {
      setToValue({ r: 0, g: 0, b: 0 });
    }
  }, [fromCyan, fromMagenta, fromYellow, fromKey]);

  const validateInput = (userInput: string) => {
    if (userInput !== '' && Number(userInput) >= 0 && Number(userInput) <= 100) {
      return true
    } else {
      return false
    }
  }

  return (
    <Panel
      title="CMYK to RGB"
      description="A CMYK to RGB converter is a tool that translates the Cyan, Magenta, Yellow, and Key (black) color components into their corresponding Red, Green, and Blue values. This conversion is often utilized in the digital media and web design industries to represent colors for display screens, as RGB is the color model typically used for electronic displays and web browsers. For example, the value [1 cyan: 85%, magenta: 0%, yellow:75%, key: 14% 2] becomes [1 red: 33, green:219, blue: 55 and hex value: #21DB37 2]."
      backColor='cyan'
      extraElements={
        <CMYKToRGBView
          fromCyan={fromCyan}
          fromMagenta={fromMagenta}
          fromYellow={fromYellow}
          fromKey={fromKey}
          toValue={toValue}
          setFromCyan={setFromCyan}
          setFromYellow={setFromYellow}
          setFromMagenta={setFromMagenta}
          setFromKey={setFromKey}
          toRGBColor={toRGBColor} />
      }
    />
  )
}