'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { parseMac, formatMacInfo, generateRandomMac } from './logic';

export const MacAddressTools = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    const info = parseMac(fromValue);
    setToValue(formatMacInfo(info));
  }, [fromValue]);

  const handleGenerate = () => {
    const mac = generateRandomMac();
    setFromValue(mac);
  };

  const extraEl = (
    <button
      onClick={handleGenerate}
      className="px-4 py-2 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer"
    >
      Generate Random
    </button>
  );

  return (
    <AdvancedConverter
      title="MAC Address Tools"
      description="Validate, format, and inspect a MAC address. Enter a MAC in any format ([1 AA:BB:CC:DD:EE:FF 2], [1 AA-BB-CC-DD-EE-FF 2], or [1 AABB.CCDD.EEFF 2]) to see all formats and properties."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="MAC Address"
      toTitle="Info"
      extraElements={extraEl}
      backColor="sky"
    />
  );
};
