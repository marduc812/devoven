'use client';
import { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { CspConfig, DEFAULT_CSP_CONFIG, buildCspPolicy, validateCspSyntax } from './logic';

type OutputTab = 'header' | 'report-only' | 'nonce';

export function CspBuilder() {
  const [config, setConfig] = useState<CspConfig>(DEFAULT_CSP_CONFIG);
  const [tab, setTab] = useState<OutputTab>('header');
  const [copied, setCopied] = useState(false);

  const output = buildCspPolicy(config);
  const syntaxErrors = validateCspSyntax(output.headerValue);

  const set = <K extends keyof CspConfig>(key: K, value: CspConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: value }));

  const currentOutput =
    tab === 'header' ? `Content-Security-Policy: ${output.headerValue}` :
    tab === 'report-only' ? output.reportOnlyHeader :
    output.nonceExample || '# Enable "Use Nonce" option to see nonce usage example';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOutput).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const boolOptions: Array<{ key: keyof CspConfig; label: string; hint: string }> = [
    { key: 'hasInlineScripts', label: 'Inline Scripts', hint: "Adds 'unsafe-inline' or nonce to script-src" },
    { key: 'hasInlineStyles', label: 'Inline Styles', hint: "Adds 'unsafe-inline' or nonce to style-src" },
    { key: 'useNonce', label: 'Use Nonce', hint: "Adds 'nonce-{NONCE}' and 'strict-dynamic' — recommended over unsafe-inline" },
    { key: 'hasUnsafeEval', label: 'Requires eval()', hint: "Adds 'unsafe-eval' — avoid if possible" },
    { key: 'allowForms', label: 'Allow Form Submissions', hint: "Sets form-action to 'self'" },
    { key: 'allowFrames', label: 'Allow Embedding (iframes)', hint: "Sets frame-ancestors to 'self'" },
    { key: 'allowMediaCdn', label: 'Media from CDN', hint: "Adds media-src 'self' https:" },
    { key: 'upgradeInsecure', label: 'Upgrade Insecure Requests', hint: "Adds upgrade-insecure-requests directive" },
  ];

  const domainOptions: Array<{ key: keyof CspConfig; label: string }> = [
    { key: 'externalScriptDomains', label: 'External Script Domains' },
    { key: 'externalStyleDomains', label: 'External Style Domains' },
    { key: 'externalFontDomains', label: 'External Font Domains' },
    { key: 'externalImageDomains', label: 'External Image Domains' },
    { key: 'externalConnectDomains', label: 'External Connect Domains (fetch/XHR/WS)' },
  ];

  return (
    <Panel
      title="Content Security Policy Builder"
      description="Build a [1 Content-Security-Policy 2] header tailored to your site. Configure script, style, font, and image sources. Includes nonce usage example and security warnings."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6 w-full">
          {/* Site features */}
          <div className="border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
            <h3 className="text-gray-300 text-sm font-semibold">Site Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {boolOptions.map(({ key, label, hint }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <div
                      onClick={() => set(key, !config[key] as CspConfig[typeof key])}
                      className={`w-4 h-4 rounded border transition-colors flex items-center justify-center cursor-pointer ${
                        config[key] ? 'bg-emerald-500/80 border-emerald-500' : 'bg-white border-gray-400'
                      }`}
                    >
                      {config[key] && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-300 text-sm">{label}</div>
                    <div className="text-gray-600 text-xs">{hint}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Domain inputs */}
          <div className="border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
            <h3 className="text-gray-300 text-sm font-semibold">External Domains (comma-separated)</h3>
            {domainOptions.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">{label}</label>
                <input
                  className="bg-white text-gray-900 placeholder:text-gray-400 p-2 border border-gray-300 focus:border-gray-900 focus:outline-none text-sm font-mono"
                  placeholder="https://cdn.example.com"
                  value={config[key] as string}
                  onChange={e => set(key, e.target.value as CspConfig[typeof key])}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">Report URI (CSP violation endpoint)</label>
              <input
                className="bg-white text-gray-900 placeholder:text-gray-400 p-2 border border-gray-300 focus:border-gray-900 focus:outline-none text-sm font-mono"
                placeholder="https://csp-report.example.com/report"
                value={config.reportUri}
                onChange={e => set('reportUri', e.target.value)}
              />
            </div>
          </div>

          {/* Warnings */}
          {output.warnings.length > 0 && (
            <div className="flex flex-col gap-2">
              {output.warnings.map((w, i) => (
                <div key={i} className="bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
                  ⚠ {w}
                </div>
              ))}
            </div>
          )}

          {/* Syntax errors */}
          {syntaxErrors.length > 0 && (
            <div className="flex flex-col gap-1">
              {syntaxErrors.map((e, i) => (
                <div key={i} className="bg-orange-500/10 border border-orange-500/30 p-3 text-xs text-orange-300">
                  Syntax: {e}
                </div>
              ))}
            </div>
          )}

          {/* Output tabs */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                {(['header', 'report-only', 'nonce'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-3 py-1.5 text-xs border transition-colors ${
                      tab === t
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {t === 'header' ? 'CSP Header' : t === 'report-only' ? 'Report-Only' : 'Nonce Example'}
                  </button>
                ))}
              </div>
              <button onClick={handleCopy} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-white border border-gray-200 p-4 text-emerald-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              {currentOutput}
            </pre>
          </div>

          {/* Directive explanations */}
          <div className="flex flex-col gap-2">
            <h3 className="text-gray-400 text-xs uppercase tracking-wide">Generated Directives</h3>
            {output.directives.map((d, i) => (
              <div key={i} className={`bg-black/10 border p-3 ${d.warning ? 'border-rose-500/30' : 'border-gray-200'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-gray-500">{d.name}</span>
                  {d.value && <code className="text-gray-400 text-xs">{d.value}</code>}
                  {d.warning && <span className="text-rose-400 text-xs">⚠ {d.warning}</span>}
                </div>
                <p className="text-gray-500 text-xs mt-1">{d.description}</p>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
