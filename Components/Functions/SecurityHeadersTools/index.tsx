'use client';
import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  SecurityRequirements,
  generateSecurityHeaders,
  calculateSecurityScore,
  headersToText,
  headersToNginxConfig,
  headersToApacheConfig,
} from './logic';

const defaultReq: SecurityRequirements = {
  isSpa: false,
  hasExternalFonts: false,
  hasEmbeds: false,
  hasAnalytics: false,
  hasCdn: false,
  hasImages: true,
  hasVideos: false,
  allowsEmbedding: false,
  hasPayments: false,
  hasWebRtc: false,
  customDomains: '',
};

type OutputFormat = 'headers' | 'nginx' | 'apache';

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-rose-400';
};

const scoreLabel = (score: number) => {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Weak';
  return 'Very Weak';
};

export function SecurityHeadersGenerator() {
  const [req, setReq] = useState<SecurityRequirements>(defaultReq);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('headers');
  const [copied, setCopied] = useState(false);

  const headers = generateSecurityHeaders(req);
  const score = calculateSecurityScore(headers);

  const output =
    outputFormat === 'nginx'
      ? headersToNginxConfig(headers)
      : outputFormat === 'apache'
      ? headersToApacheConfig(headers)
      : headersToText(headers);

  const toggle = (key: keyof SecurityRequirements) => {
    setReq(prev => ({ ...prev, [key]: !prev[key as keyof SecurityRequirements] }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const checkboxItems: Array<{ key: keyof SecurityRequirements; label: string; hint: string }> = [
    { key: 'isSpa', label: 'Single-Page App (SPA)', hint: 'Adds unsafe-inline/eval to CSP script-src (use nonces in production)' },
    { key: 'hasExternalFonts', label: 'External Fonts (Google Fonts)', hint: 'Allows fonts.googleapis.com and fonts.gstatic.com' },
    { key: 'hasEmbeds', label: 'Third-party Embeds / iframes', hint: 'Relaxes frame-src and COEP to allow cross-origin iframes' },
    { key: 'hasAnalytics', label: 'Analytics (Google Analytics/GTM)', hint: 'Adds GA/GTM domains to script-src, img-src, connect-src' },
    { key: 'hasCdn', label: 'CDN for Images', hint: 'Allows https: in img-src for CDN-hosted images' },
    { key: 'hasVideos', label: 'Video Embeds (YouTube/Vimeo)', hint: 'Adds video platforms to frame-src, media-src' },
    { key: 'allowsEmbedding', label: 'Allow this site to be embedded', hint: 'Sets X-Frame-Options: SAMEORIGIN and relaxes frame-ancestors' },
    { key: 'hasPayments', label: 'Payment APIs', hint: 'Allows payment API in Permissions-Policy' },
    { key: 'hasWebRtc', label: 'WebRTC (camera/microphone/ws)', hint: 'Allows camera, microphone in Permissions-Policy and wss: in connect-src' },
  ];

  return (
    <Panel
      title="Web Security Headers Generator"
      description="Generate a complete set of [1 HTTP security headers 2] tailored to your site requirements: Content-Security-Policy, HSTS, X-Frame-Options, Permissions-Policy, COEP, COOP, and more."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6 w-full">
          {/* Site requirements */}
          <div className="border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
            <h3 className="text-gray-300 text-sm font-semibold">Site Requirements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {checkboxItems.map(({ key, label, hint }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={!!req[key]}
                      onChange={() => toggle(key)}
                      className="sr-only"
                    />
                    <div
                      onClick={() => toggle(key)}
                      className={`w-4 h-4 rounded border transition-colors ${
                        req[key]
                          ? 'bg-emerald-500/80 border-emerald-500'
                          : 'bg-white border-gray-400'
                      } flex items-center justify-center`}
                    >
                      {req[key] && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-300 text-sm">{label}</span>
                    <span className="text-gray-600 text-xs">{hint}</span>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-gray-400 text-xs">Custom external domains (comma-separated, optional)</label>
              <input
                className="bg-white text-gray-900 placeholder:text-gray-400 p-2 border border-gray-300 focus:border-gray-900 focus:outline-none text-sm font-mono"
                placeholder="https://api.example.com, https://cdn.example.com"
                value={req.customDomains}
                onChange={e => setReq(prev => ({ ...prev, customDomains: e.target.value }))}
              />
            </div>
          </div>

          {/* Security score */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="text-center flex-shrink-0">
              <div className={`text-4xl font-bold font-mono ${scoreColor(score)}`}>{score}</div>
              <div className="text-gray-500 text-xs">/ 100</div>
            </div>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${scoreColor(score)}`}>{scoreLabel(score)} Security</div>
              <div className="mt-2 w-full bg-gray-50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-yellow-500' : 'bg-rose-500'}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {headers.length} headers generated. Enable more options to strengthen your policy.
              </div>
            </div>
          </div>

          {/* Output format */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2">
                {(['headers', 'nginx', 'apache'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setOutputFormat(f)}
                    className={`px-3 py-1.5 text-xs border capitalize transition-colors ${
                      outputFormat === f
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {f === 'headers' ? 'HTTP Headers' : f === 'nginx' ? 'Nginx Config' : 'Apache Config'}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCopy}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-white border border-gray-200 p-4 text-emerald-300 text-xs font-mono overflow-x-auto whitespace-pre">
              {output}
            </pre>
          </div>

          {/* Header explanations */}
          <div className="flex flex-col gap-3">
            <h3 className="text-gray-400 text-xs uppercase tracking-wide">Header Explanations</h3>
            {headers.map((h, i) => (
              <div key={i} className="border border-gray-200 bg-gray-50 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-gray-500">{h.name}</span>
                  <span className="text-xs text-gray-600">+{h.score} pts</span>
                </div>
                <p className="text-gray-400 text-xs">{h.description}</p>
                <p className="text-xs text-rose-400/70">Mitigates: {h.risk}</p>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
