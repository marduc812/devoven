import { hexToHsl, rgbToHsl, hexToHsv, hslChannelsToHex, hslChannelsToRgbString, hsvChannelsToHex } from '@/Components/Functions/ColorTools/logic';
import { rgbToCmyk, cmykToRgb } from '@/Components/Functions/CmykTools/logic';
import { checkContrast, formatContrastResult } from '@/Components/Functions/ColorContrastTools/logic';
import { rgbToHex } from '@/Components/Functions/Utils';
import { InputField, Operation } from '../types';

// Colour operations that take their values as separate fields. Each field is
// read from `params` by its id; the pipeline has already put the previous
// block's output into whichever field is linked.

/** A field holding a number, checked against its range with a message naming the field. */
export function channel(params: Record<string, string>, field: InputField, min: number, max: number): number {
  const raw = (params[field.id] ?? '').trim();
  if (raw === '') throw new Error(`${field.label} is empty`);
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${field.label} must be a number between ${min} and ${max}`);
  }
  return n;
}

const rgbFields: InputField[] = [
  { id: 'r', label: 'R', placeholder: '0–255' },
  { id: 'g', label: 'G', placeholder: '0–255' },
  { id: 'b', label: 'B', placeholder: '0–255' },
];

const hslFields: InputField[] = [
  { id: 'h', label: 'H', placeholder: '0–360' },
  { id: 's', label: 'S', placeholder: '0–100' },
  { id: 'l', label: 'L', placeholder: '0–100' },
];

const hsvFields: InputField[] = [
  { id: 'h', label: 'H', placeholder: '0–360' },
  { id: 's', label: 'S', placeholder: '0–100' },
  { id: 'v', label: 'V', placeholder: '0–100' },
];

const cmykFields: InputField[] = [
  { id: 'c', label: 'C', placeholder: '0–100' },
  { id: 'm', label: 'M', placeholder: '0–100' },
  { id: 'y', label: 'Y', placeholder: '0–100' },
  { id: 'k', label: 'K', placeholder: '0–100' },
];

const readRgb = (params: Record<string, string>) => rgbFields.map((f) => channel(params, f, 0, 255)) as [number, number, number];

const readHsl = (params: Record<string, string>, fields: InputField[]) =>
  [channel(params, fields[0], 0, 360), channel(params, fields[1], 0, 100), channel(params, fields[2], 0, 100)] as [number, number, number];

export const rgbToHexOp: Operation = {
  id: 'rgb-to-hex',
  name: 'RGB → Hex',
  category: 'conversion',
  params: [],
  inputs: rgbFields,
  fn: (_input, params) => rgbToHex(...readRgb(params)),
};

const rgbToCmykOp: Operation = {
  id: 'rgb-to-cmyk',
  name: 'RGB → CMYK',
  category: 'conversion',
  params: [],
  inputs: rgbFields,
  fn: (_input, params) => {
    const { c, m, y, k } = rgbToCmyk(...readRgb(params));
    return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
  },
};

const cmykToRgbOp: Operation = {
  id: 'cmyk-to-rgb',
  name: 'CMYK → RGB',
  category: 'conversion',
  params: [],
  inputs: cmykFields,
  fn: (_input, params) => {
    const [c, m, y, k] = cmykFields.map((f) => channel(params, f, 0, 100));
    const { r, g, b } = cmykToRgb(c, m, y, k);
    return `rgb(${r}, ${g}, ${b})`;
  },
};

const hslToHexOp: Operation = {
  id: 'hsl-to-hex',
  name: 'HSL → Hex',
  category: 'conversion',
  params: [],
  inputs: hslFields,
  fn: (_input, params) => hslChannelsToHex(...readHsl(params, hslFields)),
};

const hslToRgbOp: Operation = {
  id: 'hsl-to-rgb',
  name: 'HSL → RGB',
  category: 'conversion',
  params: [],
  inputs: hslFields,
  fn: (_input, params) => hslChannelsToRgbString(...readHsl(params, hslFields)),
};

const hsvToHexOp: Operation = {
  id: 'hsv-to-hex',
  name: 'HSV → Hex',
  category: 'conversion',
  params: [],
  inputs: hsvFields,
  fn: (_input, params) => hsvChannelsToHex(...readHsl(params, hsvFields)),
};

const hexToHslOp: Operation = {
  id: 'hex-to-hsl',
  name: 'Hex → HSL',
  category: 'conversion',
  params: [],
  fn: (input) => hexToHsl(input.trim()),
};

const rgbToHslOp: Operation = {
  id: 'rgb-to-hsl',
  name: 'RGB → HSL',
  category: 'conversion',
  params: [],
  fn: (input) => rgbToHsl(input.trim()),
};

const hexToHsvOp: Operation = {
  id: 'hex-to-hsv',
  name: 'Hex → HSV',
  category: 'conversion',
  params: [],
  fn: (input) => hexToHsv(input.trim()),
};

// The contrast checker compares two colours and reports the WCAG verdicts, so
// it ends the pipeline.
const contrastFields: InputField[] = [
  { id: 'fg', label: 'Text', placeholder: '#000000' },
  { id: 'bg', label: 'Background', placeholder: '#FFFFFF' },
];

const colorContrastOp: Operation = {
  id: 'color-contrast',
  name: 'Colour Contrast',
  category: 'analysis',
  params: [],
  inputs: contrastFields,
  terminal: true,
  fn: (_input, params) => {
    for (const f of contrastFields) {
      if (!(params[f.id] ?? '').trim()) throw new Error(`${f.label} is empty`);
    }
    return formatContrastResult(checkContrast(params.fg, params.bg));
  },
};

export const colorOperations: Operation[] = [
  rgbToHexOp,
  rgbToCmykOp,
  cmykToRgbOp,
  hslToHexOp,
  hslToRgbOp,
  hsvToHexOp,
  hexToHslOp,
  rgbToHslOp,
  hexToHsvOp,
  colorContrastOp,
];
