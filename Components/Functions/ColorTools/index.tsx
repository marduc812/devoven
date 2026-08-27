'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  hexToHsl, hslToHex,
  rgbToHsl, hslToRgb,
  hexToHsv, hsvToHex,
  colorNameToHex, hexToColorName,
  generateLinearGradientCss,
  quantizeColor, getTopColors,
} from './logic';

// ─── HEX ↔ HSL ───────────────────────────────────────────────────────────────

export const HexToHsl = () => {
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
      setToValue(hexToHsl(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid HEX color' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="HEX to HSL Converter"
      description="Convert a HEX color code to HSL format. For example, [1 #FF0000 2] becomes [1 hsl(0, 100%, 50%) 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="HEX"
      toTitle="HSL"
      swapLink="/converting/hsl-to-hex"
      backColor="cyan"
    />
  );
};

export const HslToHex = () => {
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
      setToValue(hslToHex(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid HSL color' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="HSL to HEX Converter"
      description="Convert an HSL color value to a HEX color code. For example, [1 hsl(0, 100%, 50%) 2] becomes [1 #FF0000 2]. You can also use bare format: [1 0, 100, 50 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="HSL"
      toTitle="HEX"
      swapLink="/converting/hex-to-hsl"
      backColor="cyan"
    />
  );
};

// ─── RGB ↔ HSL ───────────────────────────────────────────────────────────────

export const RgbToHsl = () => {
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
      setToValue(rgbToHsl(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid RGB color' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="RGB to HSL Converter"
      description="Convert an RGB color to HSL format. Accepts [1 rgb(255, 128, 0) 2] or bare [1 255,128,0 2] format. For example, [1 rgb(255, 0, 0) 2] becomes [1 hsl(0, 100%, 50%) 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="RGB"
      toTitle="HSL"
      swapLink="/converting/hsl-to-rgb"
      backColor="cyan"
    />
  );
};

export const HslToRgb = () => {
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
      setToValue(hslToRgb(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid HSL color' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="HSL to RGB Converter"
      description="Convert an HSL color to RGB format. Accepts [1 hsl(30, 100%, 50%) 2] or bare [1 30,100,50 2] format. For example, [1 hsl(0, 100%, 50%) 2] becomes [1 rgb(255, 0, 0) 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="HSL"
      toTitle="RGB"
      swapLink="/converting/rgb-to-hsl"
      backColor="cyan"
    />
  );
};

// ─── HEX ↔ HSV ───────────────────────────────────────────────────────────────

export const HexToHsv = () => {
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
      setToValue(hexToHsv(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid HEX color' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="HEX to HSV Converter"
      description="Convert a HEX color code to HSV (Hue, Saturation, Value) format. For example, [1 #FF0000 2] becomes [1 hsv(0, 100%, 100%) 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="HEX"
      toTitle="HSV"
      swapLink="/converting/hsv-to-hex"
      backColor="cyan"
    />
  );
};

export const HsvToHex = () => {
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
      setToValue(hsvToHex(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid HSV color' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="HSV to HEX Converter"
      description="Convert an HSV color value to a HEX color code. Accepts [1 hsv(0, 100%, 100%) 2] or bare [1 0, 100, 100 2] format. For example, [1 hsv(240, 100%, 100%) 2] becomes [1 #0000FF 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="HSV"
      toTitle="HEX"
      swapLink="/converting/hex-to-hsv"
      backColor="cyan"
    />
  );
};

// ─── Color Name ↔ HEX ────────────────────────────────────────────────────────

export const ColorNameToHex = () => {
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
      setToValue(colorNameToHex(fromValue));
    } catch {
      setToValue(fromValue ? 'Unknown CSS color name' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Color Name to HEX Converter"
      description="Convert a CSS named color to its HEX code. For example, [1 cornflowerblue 2] becomes [1 #6495ED 2] and [1 tomato 2] becomes [1 #FF6347 2]. Supports all 148 standard CSS named colors."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Color Name"
      toTitle="HEX"
      swapLink="/converting/hex-to-color-name"
      backColor="cyan"
    />
  );
};

export const HexToColorName = () => {
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
      setToValue(hexToColorName(fromValue));
    } catch {
      setToValue(fromValue ? 'No CSS named color matches this HEX' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="HEX to Color Name Converter"
      description="Convert a HEX color code to its CSS color name. For example, [1 #FF6347 2] becomes [1 tomato 2]. Only exact matches from the 148 CSS named colors are returned."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="HEX"
      toTitle="Color Name"
      swapLink="/converting/color-name-to-hex"
      backColor="cyan"
    />
  );
};

// ─── Gradient Generator ───────────────────────────────────────────────────────

const GRADIENT_DIRECTIONS = [
  { value: 'to right', label: 'Left → Right' },
  { value: 'to left', label: 'Right → Left' },
  { value: 'to bottom', label: 'Top → Bottom' },
  { value: 'to top', label: 'Bottom → Top' },
  { value: '135deg', label: 'Diagonal ↘' },
  { value: '45deg', label: 'Diagonal ↗' },
  { value: 'to bottom right', label: 'Top-Left → Bottom-Right' },
  { value: 'to top right', label: 'Bottom-Left → Top-Right' },
];

export const GradientGenerator = () => {
  const [color1, setColor1] = useState('#FF0000');
  const [color2, setColor2] = useState('#0000FF');
  const [direction, setDirection] = useState('to right');

  const css = generateLinearGradientCss(color1, color2, direction);

  return (
    <Panel
      title="CSS Gradient Generator"
      description="Generate a CSS linear gradient from two colors. Pick start and end colors, choose a direction, and copy the ready-to-use CSS string. For example, [1 linear-gradient(to right, #FF0000, #0000FF) 2]."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Color pickers */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm text-gray-300">Start Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={color1}
                  onChange={e => setColor1(e.target.value.toUpperCase())}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-600 bg-transparent"
                />
                <input
                  type="text"
                  value={color1}
                  onChange={e => setColor1(e.target.value.toUpperCase())}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="#FF0000"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-sm text-gray-300">End Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={color2}
                  onChange={e => setColor2(e.target.value.toUpperCase())}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-600 bg-transparent"
                />
                <input
                  type="text"
                  value={color2}
                  onChange={e => setColor2(e.target.value.toUpperCase())}
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="#0000FF"
                />
              </div>
            </div>
          </div>

          {/* Direction select */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Direction</label>
            <select
              value={direction}
              onChange={e => setDirection(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {GRADIENT_DIRECTIONS.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div
            className="w-full h-24 border border-gray-600"
            style={{ background: css }}
          />

          {/* CSS output */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">CSS Output</label>
            <div className="relative">
              <textarea
                readOnly
                value={`background: ${css};`}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm resize-none h-20 focus:outline-none"
              />
              <button
                onClick={() => navigator.clipboard.writeText(`background: ${css};`)}
                className="absolute top-2 right-2 text-xs text-gray-400 hover:text-white border border-gray-600 rounded px-2 py-1 bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      }
    />
  );
};

// ─── Color Palette Extractor ──────────────────────────────────────────────────

export const ColorPaletteExtractor = () => {
  const [palette, setPalette] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    setError('');
    setIsLoading(true);

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const MAX = 200; // scale down large images for performance
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;

      const colorCounts = new Map<string, number>();
      const STEP = 32;
      // Sample every pixel (canvas is already small after scaling)
      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a < 128) continue; // skip mostly-transparent pixels
        const hex = quantizeColor(data[i], data[i + 1], data[i + 2], STEP);
        colorCounts.set(hex, (colorCounts.get(hex) ?? 0) + 1);
      }

      const top = getTopColors(colorCounts, 10);
      setPalette(top);
      setIsLoading(false);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setError('Failed to load image.');
      setIsLoading(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <Panel
      title="Color Palette Extractor"
      description="Upload an image to extract its dominant colors. The tool samples every pixel, groups similar colors together using quantization, and returns the top 10 most common colors as HEX codes."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* File input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-600 file:bg-gray-800 file:text-gray-300 hover:file:bg-gray-700 file:cursor-pointer cursor-pointer"
            />
          </div>

          {/* Hidden canvas used for pixel sampling */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Loading / error */}
          {isLoading && <p className="text-sm text-gray-400">Analysing image...</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Palette swatches */}
          {palette.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="text-sm text-gray-300">Dominant Colors</label>
              <div className="flex flex-wrap gap-3">
                {palette.map(hex => (
                  <div key={hex} className="flex flex-col items-center gap-1">
                    <div
                      className="w-12 h-12 border border-gray-600 cursor-pointer"
                      style={{ background: hex }}
                      title={`Click to copy ${hex}`}
                      onClick={() => navigator.clipboard.writeText(hex)}
                    />
                    <span className="text-xs font-mono text-gray-400">{hex}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">Click a swatch to copy its HEX code.</p>
            </div>
          )}
        </div>
      }
    />
  );
};
