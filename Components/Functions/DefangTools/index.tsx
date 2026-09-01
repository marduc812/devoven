'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  DefangScope,
  DotStyle,
  defangText,
  defaultDefangOptions,
  describeDefang,
  fangText,
} from './logic';

type Direction = 'defang' | 'fang';

const selectClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

const UrlDefanger = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [stats, setStats] = useState('');
  const [direction, setDirection] = useState<Direction>('defang');
  const [dotStyle, setDotStyle] = useState<DotStyle>(defaultDefangOptions.dotStyle);
  const [scope, setScope] = useState<DefangScope>(defaultDefangOptions.scope);
  const [scheme, setScheme] = useState(defaultDefangOptions.scheme);
  const [separator, setSeparator] = useState(defaultDefangOptions.separator);
  const [at, setAt] = useState(defaultDefangOptions.at);

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);

    const mode = searchParams.get('mode');
    if (mode === 'defang' || mode === 'fang') setDirection(mode);

    const style = searchParams.get('style');
    if (style === 'brackets' || style === 'parens' || style === 'word') setDotStyle(style);

    const sc = searchParams.get('scope');
    if (sc === 'indicators' || sc === 'everything') setScope(sc);

    if (searchParams.get('scheme') === 'false') setScheme(false);
    if (searchParams.get('separator') === 'true') setSeparator(true);
    if (searchParams.get('at') === 'false') setAt(false);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      setStats('');
      return;
    }
    if (direction === 'defang') {
      setToValue(defangText(fromValue, { dotStyle, scope, scheme, separator, at }));
      setStats(describeDefang(fromValue, scope));
    } else {
      setToValue(fangText(fromValue));
      setStats('');
    }
  }, [fromValue, direction, dotStyle, scope, scheme, separator, at]);

  const checkbox = (label: string, checked: boolean, onChange: (v: boolean) => void) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-gray-400 text-xs whitespace-nowrap">{label}</span>
    </label>
  );

  const extraElements = (
    <>
      <div className="flex items-center gap-2">
        <label className="text-gray-400 text-xs whitespace-nowrap">Direction</label>
        <select
          className={selectClass}
          value={direction}
          onChange={(e) => setDirection(e.target.value as Direction)}
        >
          <option value="defang">Defang</option>
          <option value="fang">Fang</option>
        </select>
      </div>
      {direction === 'defang' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-xs whitespace-nowrap">Dots</label>
            <select
              className={selectClass}
              value={dotStyle}
              onChange={(e) => setDotStyle(e.target.value as DotStyle)}
            >
              <option value="brackets">[.]</option>
              <option value="parens">(.)</option>
              <option value="word">[dot]</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-xs whitespace-nowrap">Scope</label>
            <select
              className={selectClass}
              value={scope}
              onChange={(e) => setScope(e.target.value as DefangScope)}
            >
              <option value="indicators">Indicators only</option>
              <option value="everything">Everything</option>
            </select>
          </div>
          {checkbox('hxxp', scheme, setScheme)}
          {checkbox('[://]', separator, setSeparator)}
          {checkbox('[@]', at, setAt)}
        </>
      )}
      {stats && <span className="text-gray-500 text-xs font-mono whitespace-nowrap">{stats}</span>}
    </>
  );

  return (
    <AdvancedConverter
      title="URL Defanger"
      description="Make indicators safe to paste into a report, a ticket or an email: [1 http://evil.com 2] becomes [1 hxxp://evil[.]com 2], and fanging turns it back. Handles URLs, bare domains, IPv4, IPv6 and email addresses. [1 Indicators only 2] leaves the prose around them untouched; fanging accepts the usual dialects, including [1 (.) 2], [1 [dot] 2], [1 h**p 2] and [1 hxxp[:]// 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle={direction === 'defang' ? 'Live' : 'Defanged'}
      toTitle={direction === 'defang' ? 'Defanged' : 'Live'}
      extraElements={extraElements}
      backColor="sky"
    />
  );
};

export default UrlDefanger;
