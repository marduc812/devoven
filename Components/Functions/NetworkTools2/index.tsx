'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { searchPorts, classifyIpv4, formatIpClassification } from './logic';

// ─── A2. IP Address Classifier ────────────────────────────────────────────────
export const IpClassifier = () => {
  const [fromValue, setFromValue] = useState('');

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = formatIpClassification(fromValue.trim());
    } catch {
      toValue = 'Invalid IPv4 address';
    }
  }

  return (
    <BasicConverter
      title="IP Address Classifier"
      description="Classify an IPv4 address as private, public, loopback, multicast, or reserved. Try [1 10.0.0.1 2], [1 8.8.8.8 2], or [1 127.0.0.1 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="IPv4 Address"
      toTitle="Classification"
      backColor="sky"
    />
  );
};
