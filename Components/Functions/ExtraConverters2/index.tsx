'use client';

import React, { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { svgToDataUri, svgToBase64DataUri, convertCssUnit } from './logic';

// ─── B1. SVG to Data URI ─────────────────────────────────────────────────────

export const SvgToDataUri = () => {
  const [fromValue, setFromValue] = useState('');
  const [format, setFormat] = useState<'url-encoded' | 'base64'>('url-encoded');

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = format === 'url-encoded'
        ? svgToDataUri(fromValue)
        : svgToBase64DataUri(fromValue);
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid SVG';
    }
  }

  const selectEl = (
    <select
      className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
      value={format}
      onChange={e => setFormat(e.target.value as typeof format)}
    >
      <option value="url-encoded">URL-encoded (CSS url())</option>
      <option value="base64">Base64 data URI</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="SVG to Data URI"
      description="Convert SVG markup to a CSS-embeddable data URI. Paste your [1 &lt;svg&gt;...&lt;/svg&gt; 2] markup to get a [1 url(&quot;data:image/svg+xml,...&quot;) 2] you can use in CSS."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="SVG Markup"
      toTitle="Data URI"
      extraElements={selectEl}
      backColor="cyan"
    />
  );
};

