'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatIpMappings } from './logic';

export const IpMapping = () => {
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
    setToValue(formatIpMappings(fromValue));
  }, [fromValue]);

  return (
    <BasicConverter
      title="IPv4/IPv6 Mapping"
      description="Show all IPv6 representations of an IPv4 address. Enter an IPv4 address like [1 192.168.1.1 2] or [1 8.8.8.8 2] to get IPv4-mapped, IPv4-compatible, 6to4, Teredo, and decimal/hex formats."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="IPv4 Address"
      toTitle="IPv6 Representations"
      backColor="sky"
    />
  );
};
