'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { inspectJwk, describeKeyUse, describeAlgorithm, type JwkInspectResult, type JwkKeyInfo } from './logic';

function KeyCard({ info, index }: { info: JwkKeyInfo; index: number }) {
  const labelClass = 'text-gray-500 text-xs w-36 shrink-0 font-medium';
  const valueClass = 'text-gray-200 text-xs font-mono';

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Key Type (kty)', value: info.keyType },
  ];

  if (info.algorithm) {
    rows.push({ label: 'Algorithm (alg)', value: `${info.algorithm} — ${describeAlgorithm(info.algorithm)}` });
  }
  if (info.use) {
    rows.push({ label: 'Key Use (use)', value: `${info.use} — ${describeKeyUse(info.use)}` });
  }
  if (info.keyId) {
    rows.push({ label: 'Key ID (kid)', value: info.keyId });
  }
  if (info.keyOps.length > 0) {
    rows.push({ label: 'Key Ops', value: info.keyOps.join(', ') });
  }
  if (info.keyType === 'RSA' && info.modulusBits > 0) {
    rows.push({ label: 'Modulus Size', value: `${info.modulusBits} bits` });
    rows.push({ label: 'Public Key Fields', value: 'n (modulus), e (exponent)' + (info.raw['d'] ? ', d (private — handle carefully!)' : '') });
  }
  if (info.keyType === 'EC' && info.curve) {
    rows.push({ label: 'Curve (crv)', value: info.curve });
    rows.push({ label: 'Public Key Fields', value: 'x, y (coordinates)' + (info.raw['d'] ? ', d (private — handle carefully!)' : '') });
  }
  if (info.keyType === 'oct' && info.octKeyBits > 0) {
    rows.push({ label: 'Key Length', value: `${info.octKeyBits} bits (symmetric)` });
  }

  return (
    <div className="border border-gray-200 p-4 bg-gray-50">
      <p className="text-yellow-300/80 text-xs font-semibold uppercase tracking-wider mb-3">
        Key {index + 1}{info.keyId ? ` — ${info.keyId}` : ''}
      </p>
      <div className="flex flex-col gap-2">
        {rows.map(row => (
          <div key={row.label} className="flex gap-3 border-b border-gray-200 pb-2">
            <span className={labelClass}>{row.label}</span>
            <span className={valueClass}>{row.value}</span>
          </div>
        ))}
      </div>
      {info.warnings.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {info.warnings.map((w, i) => (
            <p key={i} className="text-amber-400 text-xs">⚠ {w}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export const JwkInspector = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<JwkInspectResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) {
      setResult(null);
      return;
    }
    setResult(inspectJwk(input));
  }, [input]);

  const textareaClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-xs resize-none';

  return (
    <Panel
      title="JWK Inspector"
      description="Parse a JSON Web Key ([1 JWK 2]) or JSON Web Key Set ([1 JWKS 2]). Inspect key type, algorithm, use, key ID, and parameters like modulus size, EC curve, or symmetric key length."
      backColor="yellow"
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-yellow-300 text-xs font-semibold uppercase tracking-wider block mb-2">JWK or JWKS (JSON)</label>
            <textarea
              className={textareaClass}
              rows={8}
              placeholder={'Paste a JWK or JWKS JSON object here...\n\nExample:\n{"kty":"EC","crv":"P-256","x":"...","y":"...","alg":"ES256","use":"sig"}'}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {result && result.error && (
            <p className="text-red-400 text-sm font-mono">{result.error}</p>
          )}

          {result && !result.error && (
            <div className="flex flex-col gap-4">
              <p className="text-gray-500 text-xs">
                {result.isJwks ? 'JWKS (JSON Web Key Set)' : 'Single JWK'} · {result.keys.length} key{result.keys.length !== 1 ? 's' : ''}
              </p>
              {result.keys.map((k, i) => (
                <KeyCard key={i} info={k} index={i} />
              ))}
            </div>
          )}
        </div>
      }
    />
  );
};
