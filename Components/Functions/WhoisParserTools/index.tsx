'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseWhois, formatWhoisSummary } from './logic';

export const WhoisParser = () => {
  const [fromValue, setFromValue] = useState('');

  let toValue = '';
  if (fromValue.trim()) {
    try {
      const data = parseWhois(fromValue);
      toValue = formatWhoisSummary(data);
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  return (
    <BasicConverter
      title="WHOIS Parser"
      description="Paste raw [1 WHOIS 2] output to extract and highlight key fields like domain name, registrar, expiry date, and name servers."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Raw WHOIS Output"
      toTitle="Parsed Fields"
      backColor="lime"
    />
  );
};
