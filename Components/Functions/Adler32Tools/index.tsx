'use client';

import { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { computeAdler32, stringToBytes } from '../FletcherTools/logic';

type Format = 'hex' | 'decimal' | 'both';

/**
 * Adler-32 already ships inside the Fletcher checksum tool, which is where the
 * implementation lives. This page exists because nobody looking for Adler-32
 * searches for "Fletcher".
 */
export const Adler32 = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [format, setFormat] = useState<Format>('hex');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);

    const paramFormat = params.get('format');
    if (paramFormat === 'hex' || paramFormat === 'decimal' || paramFormat === 'both') {
      setFormat(paramFormat);
    }
  }, []);

  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    const checksum = computeAdler32(stringToBytes(fromValue));
    const hex = checksum.toString(16).padStart(8, '0');
    const decimal = checksum.toString(10);

    if (format === 'hex') setToValue(hex);
    else if (format === 'decimal') setToValue(decimal);
    else {
      // The two halves are the whole point of Adler-32 — showing them makes the
      // "sum of bytes / sum of sums" structure visible.
      const low = checksum & 0xffff;
      const high = checksum >>> 16;
      setToValue(
        [
          `Hex:      ${hex}`,
          `Decimal:  ${decimal}`,
          `A (sum):  ${low}`,
          `B (sums): ${high}`,
        ].join('\n'),
      );
    }
  }, [fromValue, format]);

  const extraElements = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs uppercase tracking-widest">Output</label>
        <select
          className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
          value={format}
          onChange={(e) => setFormat(e.target.value as Format)}
        >
          <option value="hex">Hex</option>
          <option value="decimal">Decimal</option>
          <option value="both">Full breakdown</option>
        </select>
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="Adler-32 Checksum"
      description="Adler-32 is the checksum used by zlib: two running sums combined into one 32-bit value. It is faster than CRC-32 but weaker on short inputs, which is why zlib pairs it with the compressed stream rather than trusting it alone. For example, the string [1 Wikipedia 2] becomes [1 11e60398 2]. The Fletcher checksum tool computes it alongside Fletcher-16 and Fletcher-32."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Text Input"
      toTitle="Adler-32 Checksum"
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
