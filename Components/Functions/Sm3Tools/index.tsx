'use client';

import { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { hmacSm3, sm3 } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const Sm3 = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [key, setKey] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);

    const paramKey = params.get('key');
    if (paramKey) setKey(paramKey);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ key })

  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    setToValue(key ? hmacSm3(fromValue, key) : sm3(fromValue));
  }, [fromValue, key]);

  const extraElements = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-gray-500 text-xs uppercase tracking-widest">HMAC key (optional)</label>
        <input
          type="text"
          className="border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900"
          placeholder="leave empty for a plain SM3 digest"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="SM3 Hash Generator"
      description="SM3 is China's national 256-bit cryptographic hash (GB/T 32905-2016), required alongside SM2 signatures and in GM/T TLS. Its structure resembles SHA-256 but the message expansion and round function differ. Enter a key to compute HMAC-SM3 instead. For example, the string [1 abc 2] becomes [1 66c7f0f462eeedd9d1f2d46bdc10e4e24167c4875cf2f7a2297da02b8f4ba8e0 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Text Input"
      toTitle={key ? 'HMAC-SM3' : 'SM3 Hash'}
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
