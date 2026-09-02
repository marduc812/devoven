'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { generateNginxConfig, getExampleInput, NginxTemplate } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const TEMPLATES: { value: NginxTemplate; label: string }[] = [
  { value: 'reverse-proxy', label: 'Reverse Proxy' },
  { value: 'static-site', label: 'Static Site' },
  { value: 'php-fpm', label: 'PHP-FPM' },
  { value: 'redirect', label: 'Redirect' },
];

export function NginxConfigGen() {
  const [template, setTemplate] = useState<NginxTemplate>('reverse-proxy');
  const [fromValue, setFromValue] = useState(getExampleInput('reverse-proxy'));
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setFromValue(decodeURIComponent(from));
    const tmpl = params.get('template') as NginxTemplate | null;
    if (tmpl && TEMPLATES.find(t => t.value === tmpl)) setTemplate(tmpl);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ template })

  useEffect(() => {
    try {
      setToValue(generateNginxConfig(fromValue, template));
    } catch (e) {
      setToValue('# Error: ' + (e instanceof Error ? e.message : 'Invalid input'));
    }
  }, [fromValue, template]);

  const handleTemplateChange = (t: NginxTemplate) => {
    setTemplate(t);
    setFromValue(getExampleInput(t));
  };

  return (
    <AdvancedConverter
      title="Nginx Config Generator"
      description="Generate nginx [1 server block 2] configuration from key=value options. Choose a template type: [1 Reverse Proxy 2], [1 Static Site 2], [1 PHP-FPM 2], or [1 Redirect 2]. Supports SSL, gzip, www redirect, and custom paths."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Options"
      toTitle="nginx server block"
      backColor="lime"
      extraElements={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wider">Template:</span>
          {TEMPLATES.map(t => (
            <button
              key={t.value}
              onClick={() => handleTemplateChange(t.value)}
              className={`px-3 py-1.5 text-xs border transition-all ${
                template === t.value
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-white/5 text-gray-400 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    />
  );
}
