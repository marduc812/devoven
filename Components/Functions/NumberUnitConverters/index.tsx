'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  binaryToDecimal, decimalToBinary,
  romanToArabic, arabicToRoman,
  numberToWords,
  getAllLengthConversions, LENGTH_UNITS, LengthUnit,
  getAllWeightConversions, WEIGHT_UNITS, WeightUnit,
  getAllTemperatureConversions, TEMPERATURE_UNITS, TemperatureUnit,
  getAllSpeedConversions, SPEED_UNITS, SpeedUnit, SPEED_LABELS,
  getAllAreaConversions, AREA_UNITS, AreaUnit, AREA_LABELS,
  getAllVolumeConversions, VOLUME_UNITS, VolumeUnit, VOLUME_LABELS,
  getAllDataSizeConversions, DATA_UNITS, DataUnit,
  getAllAngleConversions, ANGLE_UNITS, AngleUnit, ANGLE_LABELS,
  getAllBitrateConversions, BITRATE_UNITS, BitrateUnit,
} from './logic';

// ─── Reusable unit-table UI helper ────────────────────────────────────────────

type UnitTableRow = { unit: string; label: string; value: number };

function UnitTable({
  rows,
  selectedUnit,
}: {
  rows: UnitTableRow[];
  selectedUnit: string;
}) {
  return (
    <table className="w-full text-sm font-mono">
      <tbody>
        {rows.map(({ unit, label, value }) => (
          <tr
            key={unit}
            className={`border-b border-gray-200 ${unit === selectedUnit ? 'text-gray-900 font-bold' : 'text-gray-500'}`}
          >
            <td className="py-1.5 pr-4 text-right font-semibold w-16">{label}</td>
            <td className="py-1.5">{Number.isFinite(value) ? value.toPrecision(7).replace(/\.?0+$/, '') : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Shared Panel UI helper ───────────────────────────────────────────────────

function UnitConverterPanel<TUnit extends string>({
  title,
  description,
  units,
  labels,
  defaultUnit,
  getConversions,
}: {
  title: string;
  description: string;
  units: readonly TUnit[];
  labels?: Record<TUnit, string>;
  defaultUnit: TUnit;
  getConversions: (value: number, from: TUnit) => Record<TUnit, number>;
}) {
  const [inputStr, setInputStr] = useState('1');
  const [fromUnit, setFromUnit] = useState<TUnit>(defaultUnit);
  const [conversions, setConversions] = useState<Record<TUnit, number> | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setInputStr(from);
  }, []);

  useEffect(() => {
    const num = parseFloat(inputStr);
    if (!inputStr.trim() || isNaN(num)) { setConversions(null); return; }
    setConversions(getConversions(num, fromUnit));
  }, [inputStr, fromUnit, getConversions]);

  const rows: UnitTableRow[] = units.map(u => ({
    unit: u,
    label: labels ? labels[u] : u,
    value: conversions ? conversions[u] : NaN,
  }));

  return (
    <Panel
      title={title}
      description={description}
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-3 items-center">
            <input
              type="number"
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm flex-1"
              placeholder="Enter value"
              value={inputStr}
              onChange={e => setInputStr(e.target.value)}
            />
            <select
              className="bg-white backdrop-blur-sm text-gray-900 p-3 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
              value={fromUnit}
              onChange={e => setFromUnit(e.target.value as TUnit)}
            >
              {units.map(u => (
                <option key={u} value={u}>{labels ? labels[u] : u}</option>
              ))}
            </select>
          </div>
          {conversions ? (
            <UnitTable rows={rows} selectedUnit={fromUnit} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Enter a number to see conversions.</p>
          )}
        </div>
      }
    />
  );
}

// ─── Binary ↔ Decimal ─────────────────────────────────────────────────────────

export const BinaryToDecimal = () => {
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
      setToValue(binaryToDecimal(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid binary input' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Binary to Decimal Converter"
      description="Convert a binary (base-2) number to its decimal (base-10) equivalent. Enter only [1 0 2] and [1 1 2] digits. For example, [1 1010 2] becomes [1 10 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Binary Input"
      toTitle="Decimal Output"
      swapLink="/converting/decimal-to-binary"
      backColor="cyan"
    />
  );
};

export const DecimalToBinary = () => {
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
      setToValue(decimalToBinary(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid decimal input' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Decimal to Binary Converter"
      description="Convert a decimal (base-10) integer to its binary (base-2) representation. For example, [1 10 2] becomes [1 1010 2] and [1 255 2] becomes [1 11111111 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Decimal Input"
      toTitle="Binary Output"
      swapLink="/converting/binary-to-decimal"
      backColor="cyan"
    />
  );
};

// ─── Roman Numerals ↔ Arabic ──────────────────────────────────────────────────

export const RomanToArabic = () => {
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
      setToValue(romanToArabic(fromValue));
    } catch {
      setToValue(fromValue ? 'Invalid Roman numeral' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Roman to Arabic Numeral Converter"
      description="Convert Roman numerals to Arabic (standard) integers. Supports values from [1 I 2] (1) to [1 MMMCMXCIX 2] (3999). For example, [1 MMXXIV 2] becomes [1 2024 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Roman Numeral Input"
      toTitle="Arabic Number Output"
      swapLink="/converting/arabic-to-roman"
      backColor="cyan"
    />
  );
};

export const ArabicToRoman = () => {
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
      setToValue(arabicToRoman(fromValue));
    } catch {
      setToValue(fromValue ? 'Number out of range (1–3999)' : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Arabic to Roman Numeral Converter"
      description="Convert an Arabic (standard) integer to Roman numerals. Supports values from [1 1 2] to [1 3999 2]. For example, [1 2024 2] becomes [1 MMXXIV 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Arabic Number Input"
      toTitle="Roman Numeral Output"
      swapLink="/converting/roman-to-arabic"
      backColor="cyan"
    />
  );
};

// ─── Number to Words ──────────────────────────────────────────────────────────

export const NumberToWords = () => {
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
      setToValue(numberToWords(fromValue));
    } catch (e) {
      setToValue(fromValue ? (e instanceof Error ? e.message : 'Invalid input') : '');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Number to Words Converter"
      description="Convert any integer into its English word representation, up to trillions. For example, [1 1234567 2] becomes [1 one million, two hundred thirty-four thousand, five hundred sixty-seven 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Number Input"
      toTitle="Words Output"
      backColor="cyan"
    />
  );
};

// ─── Length Converter ─────────────────────────────────────────────────────────

export const LengthConverter = () => (
  <UnitConverterPanel<LengthUnit>
    title="Length Converter"
    description="Convert between length and distance units instantly. Enter a value, select your source unit, and see all conversions at once. Supports [1 metres 2], [1 kilometres 2], [1 centimetres 2], [1 millimetres 2], [1 miles 2], [1 yards 2], [1 feet 2], and [1 inches 2]."
    units={LENGTH_UNITS}
    defaultUnit="m"
    getConversions={getAllLengthConversions}
  />
);

// ─── Weight Converter ─────────────────────────────────────────────────────────

export const WeightConverter = () => (
  <UnitConverterPanel<WeightUnit>
    title="Weight Converter"
    description="Convert between weight and mass units instantly. Supports [1 kilograms 2], [1 grams 2], [1 pounds 2], [1 ounces 2], and [1 metric tonnes 2]."
    units={WEIGHT_UNITS}
    defaultUnit="kg"
    getConversions={getAllWeightConversions}
  />
);

// ─── Temperature Converter ────────────────────────────────────────────────────

const TEMPERATURE_LABELS: Record<TemperatureUnit, string> = {
  C: '°C',
  F: '°F',
  K: 'K',
};

export const TemperatureConverter = () => (
  <UnitConverterPanel<TemperatureUnit>
    title="Temperature Converter"
    description="Convert between temperature scales instantly. Enter a value and select a unit to see all equivalents. For example, [1 100°C 2] equals [1 212°F 2] and [1 373.15 K 2]."
    units={TEMPERATURE_UNITS}
    labels={TEMPERATURE_LABELS}
    defaultUnit="C"
    getConversions={getAllTemperatureConversions}
  />
);

// ─── Area Converter ───────────────────────────────────────────────────────────
export const AreaConverter = () => (
  <UnitConverterPanel<AreaUnit>
    title="Area Converter"
    description="Convert between area units instantly. Supports [1 m² 2], [1 km² 2], [1 ft² 2], [1 mi² 2], [1 acres 2], and [1 hectares 2]. For example, [1 1 km² 2] equals [1 100 ha 2]."
    units={AREA_UNITS}
    labels={AREA_LABELS}
    defaultUnit="m2"
    getConversions={getAllAreaConversions}
  />
);

// ─── Angle Converter ──────────────────────────────────────────────────────────
export const AngleConverter = () => (
  <UnitConverterPanel<AngleUnit>
    title="Angle Converter"
    description="Convert between angle units instantly. Supports [1 degrees 2], [1 radians 2], and [1 gradians 2]. For example, [1 180° 2] equals [1 π radians 2] and [1 200 grad 2]."
    units={ANGLE_UNITS}
    labels={ANGLE_LABELS}
    defaultUnit="deg"
    getConversions={getAllAngleConversions}
  />
);

// ─── Bitrate Converter ────────────────────────────────────────────────────────

export const BitrateConverter = () => (
  <UnitConverterPanel<BitrateUnit>
    title="Bitrate Converter"
    description="Convert between data transfer rate units instantly. Supports [1 bps 2], [1 kbps 2], [1 Mbps 2], and [1 Gbps 2] using decimal (base-1000) prefixes. For example, [1 100 Mbps 2] equals [1 0.1 Gbps 2]."
    units={BITRATE_UNITS}
    defaultUnit="Mbps"
    getConversions={getAllBitrateConversions}
  />
);
