'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { decodeCID, formatCIDInfo } from './logic';

export const IpfsCidDecoder = () => {
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
    const result = decodeCID(fromValue);
    toValue = formatCIDInfo(result);
  }

  return (
    <BasicConverter
      title="IPFS CID Decoder"
      description="Decode an IPFS [1 Content Identifier (CID) 2]. Supports [1 CIDv0 2] (starts with Qm, base58btc-encoded SHA-256 multihash) and [1 CIDv1 2] (starts with b for base32, z for base58btc, f for hex). Shows version, codec, hash function, digest length, and raw digest."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="IPFS CID"
      toTitle="Decoded CID Info"
      backColor="lime"
    />
  );
};
