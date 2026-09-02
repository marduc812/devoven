'use client';

import { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { whirlpool } from './logic';

export const Whirlpool = () => {
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
    setToValue(fromValue ? whirlpool(fromValue) : '');
  }, [fromValue]);

  return (
    <BasicConverter
      title="Whirlpool Hash Generator"
      description="Whirlpool is a 512-bit hash by Barreto and Rijmen, standardised in ISO/IEC 10118-3 and built on an AES-like block cipher. It has no known practical attacks and shows up in TrueCrypt/VeraCrypt volumes, and in hashcat mode 6100. For example, the string [1 abc 2] becomes [1 4e2448a4c6f486bb16b6562c73b4020bf3043e3a731bce721ae1b303d97e6d4c7181eebdb6c57e277d0e34957114cbd6c797fc9d95d8b582d225292076d4eef5 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Text Input"
      toTitle="Whirlpool Hash"
      backColor="teal"
    />
  );
};
