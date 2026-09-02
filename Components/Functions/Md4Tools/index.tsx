'use client';

import { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { md4 } from './logic';

export const Md4 = () => {
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
    setToValue(fromValue ? md4(fromValue) : '');
  }, [fromValue]);

  return (
    <BasicConverter
      title="MD4 Hash Generator"
      description="MD4 (RFC 1320) is a 128-bit hash from 1990 and the ancestor of MD5. It is thoroughly broken — collisions take milliseconds — so it survives only where old formats demand it: NTLM password hashes, rsync's rolling checksum, and eDonkey file IDs. For example, the string [1 abc 2] becomes [1 a448017aaf21d8525fc10ae87aa6729d 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Text Input"
      toTitle="MD4 Hash"
      backColor="teal"
    />
  );
};
