'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { cleanSvg, getSvgStats } from './logic';

export const SvgCleanerTools = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [stats, setStats] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      setStats('');
      return;
    }
    const cleaned = cleanSvg(fromValue);
    setToValue(cleaned);
    setStats(getSvgStats(fromValue, cleaned));
  }, [fromValue]);

  const statsEl: React.JSX.Element = stats ? (
    <div className="border border-gray-200 bg-gray-50 px-4 py-3">
      <p className="text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">Stats</p>
      <pre className="text-gray-900 font-mono text-xs whitespace-pre">{stats}</pre>
    </div>
  ) : <></>;

  return (
    <AdvancedConverter
      title="SVG Cleaner"
      description="Remove unnecessary SVG metadata, comments, and empty elements to reduce file size. Strips [1 XML declarations 2], [1 comments 2], [1 title/desc 2], [1 data-* attributes 2], and [1 empty defs 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Original SVG"
      toTitle="Cleaned SVG"
      extraElements={statsEl}
      backColor="cyan"
    />
  );
};
