'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { toEIP55Checksum, formatEthChecksumResult } from './logic';

export const EthChecksumConverter = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') ?? '';
      if (from) setFromValue(from);
    }
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    const result = toEIP55Checksum(fromValue);
    toValue = formatEthChecksumResult(result);
  }

  return (
    <BasicConverter
      title="Ethereum Address Checksum (EIP-55)"
      description="Convert an Ethereum address to its [1 EIP-55 checksummed 2] form. Input can be all-lowercase, all-uppercase, or mixed. The checksum capitalizes hex letters based on keccak256 of the lowercase address — for example [1 0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359 2] becomes [1 0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Ethereum Address"
      toTitle="EIP-55 Checksummed Address"
      backColor="lime"
    />
  );
};
