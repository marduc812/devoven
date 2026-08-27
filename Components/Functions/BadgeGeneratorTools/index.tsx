'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  generateMarkdownBadge,
  generateShieldsUrl,
  formatBadgeOutput,
  BADGE_PRESETS,
  type BadgeConfig,
  type BadgeStyle,
} from './logic';

const DEFAULT_CONFIG: BadgeConfig = {
  label: 'build',
  message: 'passing',
  color: 'brightgreen',
  labelColor: '',
  style: 'flat',
  logo: '',
  link: '',
};

export const BadgeGenerator = () => {
  const [config, setConfig] = useState<BadgeConfig>(DEFAULT_CONFIG);
  const [copied, setCopied] = useState(false);

  const update = (field: keyof BadgeConfig, value: string) =>
    setConfig(prev => ({ ...prev, [field]: value }));

  const applyPreset = (idx: number) => {
    const preset = BADGE_PRESETS[idx];
    if (!preset) return;
    setConfig(prev => ({ ...DEFAULT_CONFIG, ...prev, ...preset.config }));
  };

  const output = formatBadgeOutput(config);
  const badgeUrl = generateShieldsUrl(config);

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownBadge(config)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-2 border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors text-sm w-full';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

  return (
    <Panel
      title="Markdown Badge Generator"
      description="Generate [1 shields.io 2] badges for README files. Configure label, message, color, style and logo."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Preset selector */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Presets</label>
            <select
              className="bg-white text-gray-900 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
              defaultValue=""
              onChange={e => { if (e.target.value !== '') applyPreset(Number(e.target.value)); }}
            >
              <option value="">— choose a preset —</option>
              {BADGE_PRESETS.map((p, i) => (
                <option key={p.name} value={i}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="w-full h-px bg-gray-200" />

          {/* Fields grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Label</label>
              <input className={inputClass} value={config.label} onChange={e => update('label', e.target.value)} placeholder="e.g. build" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Message</label>
              <input className={inputClass} value={config.message} onChange={e => update('message', e.target.value)} placeholder="e.g. passing" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Color</label>
              <input className={inputClass} value={config.color} onChange={e => update('color', e.target.value)} placeholder="e.g. brightgreen or #3178C6" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Label Color</label>
              <input className={inputClass} value={config.labelColor} onChange={e => update('labelColor', e.target.value)} placeholder="e.g. #555 (optional)" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Logo</label>
              <input className={inputClass} value={config.logo} onChange={e => update('logo', e.target.value)} placeholder="e.g. typescript (optional)" />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Style</label>
              <select
                className="bg-white text-gray-900 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
                value={config.style}
                onChange={e => update('style', e.target.value as BadgeStyle)}
              >
                <option value="flat">flat</option>
                <option value="flat-square">flat-square</option>
                <option value="plastic">plastic</option>
                <option value="for-the-badge">for-the-badge</option>
                <option value="social">social</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Link (optional)</label>
            <input className={inputClass} value={config.link} onChange={e => update('link', e.target.value)} placeholder="e.g. https://github.com/user/repo" />
          </div>

          <div className="w-full h-px bg-gray-200" />

          {/* Preview */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Preview</label>
            <div className="border border-gray-200 p-4 bg-gray-50 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgeUrl} alt={`${config.label}: ${config.message}`} className="h-auto w-auto max-w-full" style={{ imageRendering: 'auto' }} />
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Output</label>
              <button
                onClick={handleCopy}
                className="px-3 py-1 text-xs border border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Markdown'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={8}
              className="bg-white text-gray-900 p-3 border border-gray-200 font-mono text-xs resize-none w-full"
            />
          </div>
        </div>
      }
    />
  );
};
