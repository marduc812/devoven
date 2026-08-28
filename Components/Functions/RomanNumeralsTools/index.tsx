'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { convertRoman } from './logic';

export function RomanNumerals() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(convertRoman(fromValue));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Roman Numeral Converter"
      description="Convert between Roman numerals and Arabic integers. Enter a number ([1 1–3999 2]) or a Roman numeral ([1 XIV 2]) — direction is auto-detected. Includes conversion table and step breakdown."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Number or Roman Numeral"
      toTitle="Conversion & Reference"
      backColor="cyan"
    />
  );
}
