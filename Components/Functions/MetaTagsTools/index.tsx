'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { generateMetaTags, getDefaultMetaConfig, MetaConfig } from './logic';

export const MetaTagsGenerator = () => {
  const [config, setConfig] = useState<MetaConfig>(getDefaultMetaConfig());
  const [copied, setCopied] = useState(false);

  const output = generateMetaTags(config);

  const set = (field: keyof MetaConfig) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setConfig(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const inputClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-2.5 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 text-sm';

  const labelClass = 'text-gray-400 text-xs mb-1 block';

  const fields: { label: string; field: keyof MetaConfig; placeholder: string; type?: string }[] = [
    { label: 'Title', field: 'title', placeholder: 'Page title' },
    { label: 'Description', field: 'description', placeholder: 'Brief description for search engines' },
    { label: 'URL', field: 'url', placeholder: 'https://example.com/page' },
    { label: 'Image URL', field: 'image', placeholder: 'https://example.com/image.png' },
    { label: 'Site Name', field: 'siteName', placeholder: 'My Website' },
    { label: 'Twitter Handle', field: 'twitterHandle', placeholder: '@handle' },
    { label: 'Locale', field: 'locale', placeholder: 'en_US' },
  ];

  return (
    <Panel
      title="HTML Meta Tags Generator"
      description="Generate complete HTML meta tags including Open Graph and Twitter Card markup for better SEO and social sharing."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.field}>
                <label className={labelClass}>{f.label}</label>
                <input
                  className={inputClass}
                  placeholder={f.placeholder}
                  value={config[f.field] as string}
                  onChange={set(f.field)}
                />
              </div>
            ))}
            <div>
              <label className={labelClass}>Type</label>
              <select
                className={inputClass}
                value={config.type}
                onChange={set('type')}
              >
                <option value="website">website</option>
                <option value="article">article</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Generated Meta Tags</span>
              <button
                onClick={handleCopy}
                className="text-xs px-3 py-1 bg-gray-900 text-white border-gray-900 hover:bg-gray-700 transition-colors duration-150"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              rows={20}
              className="bg-white text-gray-300 font-mono text-xs p-3 border border-gray-200 w-full resize-none focus:outline-none"
            />
          </div>
        </div>
      }
    />
  );
};
