'use client';

import React, { useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  parseCookieHeader,
  parseSetCookieHeader,
  formatParsedCookies,
  formatSetCookie,
} from './logic';

// ─── B1. HTTP Cookie Parser ───────────────────────────────────────────────────

export const CookieParser = () => {
  const [fromValue, setFromValue] = useState('');
  const [mode, setMode] = useState<'cookie' | 'set-cookie'>('cookie');

  let toValue = '';
  if (fromValue.trim()) {
    try {
      if (mode === 'cookie') {
        toValue = formatParsedCookies(parseCookieHeader(fromValue));
      } else {
        toValue = formatSetCookie(parseSetCookieHeader(fromValue));
      }
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  const extraElements = (
    <select
      className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
      value={mode}
      onChange={e => setMode(e.target.value as 'cookie' | 'set-cookie')}
    >
      <option value="cookie">Cookie Header</option>
      <option value="set-cookie">Set-Cookie Header</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="HTTP Cookie Parser"
      description="Parse [1 Cookie 2] or [1 Set-Cookie 2] HTTP header strings and inspect each attribute."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Cookie Header"
      toTitle="Parsed Result"
      extraElements={extraElements}
      backColor="sky"
    />
  );
};
