'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseBcryptHash, formatBcryptInfo } from './logic';

export const BcryptInfo = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      return;
    }
    try {
      const info = parseBcryptHash(fromValue);
      setToValue(formatBcryptInfo(info));
    } catch (e) {
      setToValue('Error: ' + (e instanceof Error ? e.message : 'Invalid input'));
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Bcrypt Hash Inspector"
      description="Parse and inspect a bcrypt hash to extract its version, cost factor, salt, and hash components. Supports formats [1 $2a$ 2], [1 $2b$ 2], and [1 $2y$ 2]. Example: [1 $2b$12$... 2] reveals cost factor 12 (4096 rounds)."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Bcrypt Hash"
      toTitle="Hash Analysis"
      backColor="teal"
    />
  );
};
