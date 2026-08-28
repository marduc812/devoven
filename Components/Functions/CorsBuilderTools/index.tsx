'use client';
import { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CorsConfig,
  DEFAULT_CORS_CONFIG,
  ALL_METHODS,
  buildCorsHeaders,
  getHeaderExplanations,
} from './logic';

type OutputTab = 'headers' | 'express' | 'nginx' | 'apache';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1';
const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 p-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none text-sm font-mono';

export function CorsBuilder() {
  const [config, setConfig] = useState<CorsConfig>(DEFAULT_CORS_CONFIG);
  const [tab, setTab] = useState<OutputTab>('headers');
  const [copied, setCopied] = useState(false);

  const output = buildCorsHeaders(config);
  const explanations = getHeaderExplanations();

  const set = <K extends keyof CorsConfig>(key: K, value: CorsConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const toggleMethod = (method: string) => {
    const current = config.allowedMethods;
    set('allowedMethods', current.includes(method) ? current.filter(m => m !== method) : [...current, method]);
  };

  const currentOutput =
    tab === 'express' ? output.expressCode :
    tab === 'nginx' ? output.nginxConfig :
    tab === 'apache' ? output.apacheConfig :
    Object.entries(output.headers).map(([k, v]) => `${k}: ${v}`).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const tabClass = (t: OutputTab) =>
    `px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
      tab === t
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
    }`;

  return (
    <Panel
      title="CORS Policy Builder"
      description="Configure [1 Cross-Origin Resource Sharing (CORS) 2] headers for your API. Generate Access-Control-* headers and Express/Nginx/Apache config with security warnings."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6 w-full">
          {/* Configuration */}
          <div className="flex flex-col gap-4">
            <p className={labelClass}>CORS Configuration</p>

            {/* Origins */}
            <div>
              <label className={labelClass}>Allowed Origins <span className="normal-case font-normal text-gray-400">(comma-separated, or *)</span></label>
              <input
                className={inputClass}
                placeholder="https://example.com, https://app.example.com"
                value={config.allowedOrigins}
                onChange={e => set('allowedOrigins', e.target.value)}
              />
            </div>

            {/* Methods */}
            <div>
              <label className={labelClass}>Allowed Methods</label>
              <div className="flex flex-wrap gap-2">
                {ALL_METHODS.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMethod(m)}
                    className={`px-3 py-1 text-xs font-bold border transition-colors ${
                      config.allowedMethods.includes(m)
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Headers row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Allowed Headers <span className="normal-case font-normal text-gray-400">(comma-separated)</span></label>
                <input
                  className={inputClass}
                  placeholder="Content-Type, Authorization"
                  value={config.allowedHeaders}
                  onChange={e => set('allowedHeaders', e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Exposed Headers <span className="normal-case font-normal text-gray-400">(comma-separated)</span></label>
                <input
                  className={inputClass}
                  placeholder="X-Request-Id"
                  value={config.exposedHeaders}
                  onChange={e => set('exposedHeaders', e.target.value)}
                />
              </div>
            </div>

            {/* Max-Age */}
            <div>
              <label className={labelClass}>Max-Age <span className="normal-case font-normal text-gray-400">(seconds, 0 = omit)</span></label>
              <input
                type="number"
                min={0}
                value={config.maxAge}
                onChange={e => set('maxAge', parseInt(e.target.value) || 0)}
                className="bg-white text-gray-900 p-2 border border-gray-300 focus:border-gray-900 focus:outline-none text-sm w-full sm:w-48"
              />
            </div>

            {/* Checkboxes */}
            <div className="flex flex-wrap gap-4">
              {([
                { key: 'allowCredentials' as const, label: 'Allow Credentials' },
                { key: 'useReflectOrigin' as const, label: 'Reflect Origin (dynamic)' },
              ]).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer" onClick={() => set(key, !config[key])}>
                  <div className={`w-4 h-4 border flex items-center justify-center flex-shrink-0 ${config[key] ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-400'}`}>
                    {config[key] && <span className="text-white text-xs leading-none">✓</span>}
                  </div>
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {output.warnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {output.warnings.map((w, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}

          {/* Request type badge */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Request type:</span>
            <span className={`px-2 py-0.5 border text-xs font-bold ${
              output.requestType === 'both'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}>
              {output.requestType === 'both' ? 'Simple + Preflight' : 'Simple only'}
            </span>
            {output.requestType === 'both' && (
              <span className="text-gray-400">— OPTIONS preflight required for non-simple methods/headers</span>
            )}
          </div>

          {/* Output tabs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                {(['headers', 'express', 'nginx', 'apache'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={tabClass(t)}>
                    {t === 'headers' ? 'HTTP Headers' : t === 'express' ? 'Express.js' : t === 'nginx' ? 'Nginx' : 'Apache'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider border border-gray-300 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-900 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-white border border-gray-200 p-4 text-gray-900 text-xs font-mono overflow-x-auto whitespace-pre">
              {currentOutput}
            </pre>
          </div>

          {/* Header reference */}
          <div className="flex flex-col gap-2">
            <p className={labelClass}>Header Reference</p>
            <div className="border border-gray-200 overflow-hidden">
              {explanations.map((h, i) => (
                <div key={i} className={`p-3 ${i > 0 ? 'border-t border-gray-200' : ''}`}>
                  <p className="font-mono text-xs font-bold text-gray-900">{h.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">Example: <code className="text-gray-700">{h.value}</code></p>
                  <p className="text-gray-400 text-xs mt-1">{h.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
