'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  DEFAULT_SALT,
  decodeFlaskSession,
  formatFlaskSession,
  signFlaskSession,
  verifyFlaskSession,
} from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900 font-mono';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

type Mode = 'decode' | 'verify' | 'sign';

const SAMPLE = 'eyJsb2dnZWRfaW4iOnRydWUsInVzZXIiOiJhbGljZSJ9.ZVPxAA.H2WQSytbSEgJGBLFbRNvNuTwtbQ';

export function FlaskSession() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('decode');
  const [secret, setSecret] = useState('');
  const [salt, setSalt] = useState(DEFAULT_SALT);
  const [compress, setCompress] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const m = params.get('mode');
    if (m === 'decode' || m === 'verify' || m === 'sign') setMode(m);
    const s = params.get('salt');
    if (s) setSalt(s);
    if (params.get('compress') === 'true') setCompress(true);
  }, []);

  // The secret key is deliberately not published: a share link should not
  // carry it. Everything else round-trips.
  useShareLink({ mode, salt: salt === DEFAULT_SALT ? null : salt, compress });

  const output = useMemo(() => {
    if (!input.trim()) return '';
    try {
      if (mode === 'sign') return signFlaskSession(input, secret, { salt, compress });
      if (mode === 'verify') {
        const result = verifyFlaskSession(input, secret, salt);
        const session = decodeFlaskSession(input);
        return [
          result.valid
            ? 'Signature valid. This secret key signed this cookie.'
            : 'Signature does NOT match this secret key.',
          '',
          `Expected: ${result.expected}`,
          `Found:    ${result.found}`,
          '',
          formatFlaskSession(session),
        ].join('\n');
      }
      return formatFlaskSession(decodeFlaskSession(input));
    } catch (e: unknown) {
      return e instanceof Error ? `Error: ${e.message}` : 'Cannot read that cookie';
    }
  }, [input, mode, secret, salt, compress]);

  return (
    <AdvancedConverter
      title="Flask Session Decoder"
      description="A Flask session cookie is signed, not encrypted, so its contents are readable without the key: [1 payload.timestamp.signature 2], base64url, zlib-compressed when the token starts with a dot. Decoding needs no secret. Verifying and signing do, and use itsdangerous's defaults: HMAC-SHA1 with the key derived from the secret and the [1 cookie-session 2] salt."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={mode === 'sign' ? 'JSON Payload' : 'Session Cookie'}
      toTitle={mode === 'sign' ? 'Signed Cookie' : mode === 'verify' ? 'Verification' : 'Session'}
      backColor="lime"
      extraElements={
        <>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Mode</label>
            <select className={selectClass} value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
              <option value="decode">Decode</option>
              <option value="verify">Verify signature</option>
              <option value="sign">Sign a payload</option>
            </select>
          </div>
          {mode !== 'decode' && (
            <>
              <div className="flex items-center gap-2">
                <label className={labelClass}>Secret key</label>
                <input
                  className={`${inputClass} w-48`}
                  type="password"
                  placeholder="app.secret_key"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={labelClass}>Salt</label>
                <input
                  className={`${inputClass} w-40`}
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                />
              </div>
            </>
          )}
          {mode === 'sign' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={compress} onChange={(e) => setCompress(e.target.checked)} />
              <span className="text-gray-500 text-xs whitespace-nowrap">Compress the payload</span>
            </label>
          )}
          <button
            className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer"
            onClick={() => { setMode('decode'); setInput(SAMPLE); }}
          >
            Load Sample
          </button>
          {mode !== 'decode' && (
            <span className="text-gray-400 text-xs">The key stays in this tab and is never put in the share link.</span>
          )}
        </>
      }
    />
  );
}
