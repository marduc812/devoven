'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { validateBitcoinAddress, formatBitcoinResult } from './logic';

export const BitcoinAddrValidator = () => {
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
    const result = validateBitcoinAddress(fromValue);
    toValue = formatBitcoinResult(result);
  }

  return (
    <BasicConverter
      title="Bitcoin Address Validator"
      description="Validate a Bitcoin address and detect its type. Supports [1 P2PKH legacy (1...) 2], [1 P2SH (3...) 2], and [1 Bech32 native SegWit (bc1...) 2] formats. Performs Base58Check checksum verification for legacy addresses and Bech32 character-set + checksum validation for SegWit addresses."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Bitcoin Address"
      toTitle="Validation Result"
      backColor="lime"
    />
  );
};
