'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  buildOAuthResult,
  decodeJwtPayload,
  formatJwtPayload,
  type GrantType,
  type OAuthParams,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const OAuthFlowBuilder = () => {
  const [grantType, setGrantType] = useState<GrantType>('authorization_code');
  const [clientId, setClientId] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [scope, setScope] = useState('');
  const [state, setState] = useState('');
  const [codeChallenge, setCodeChallenge] = useState('');
  const [authEndpoint, setAuthEndpoint] = useState('');
  const [tokenEndpoint, setTokenEndpoint] = useState('');
  const [jwtInput, setJwtInput] = useState('');
  const [activeTab, setActiveTab] = useState<'builder' | 'decoder'>('builder');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setClientId(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: clientId })

  const params: OAuthParams = {
    grantType,
    clientId,
    redirectUri,
    scope,
    state: state || undefined,
    codeChallenge: codeChallenge || undefined,
    authorizationEndpoint: authEndpoint || undefined,
    tokenEndpoint: tokenEndpoint || undefined,
  };

  const result = buildOAuthResult(params);

  let jwtOutput = '';
  if (jwtInput.trim()) {
    const payload = decodeJwtPayload(jwtInput);
    jwtOutput = payload ? formatJwtPayload(payload) : 'Not a valid JWT or could not decode payload.';
  }

  const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm font-mono w-full';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block';

  const extraElements = (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex gap-1">
        <button
          className={`px-4 py-2 text-sm font-semibold border transition-colors ${activeTab === 'builder' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'}`}
          onClick={() => setActiveTab('builder')}
        >
          Flow Builder
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border transition-colors ${activeTab === 'decoder' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'}`}
          onClick={() => setActiveTab('decoder')}
        >
          Token Decoder
        </button>
      </div>

      {activeTab === 'builder' && (
        <>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>Grant Type</label>
              <select className={inputClass} value={grantType} onChange={e => setGrantType(e.target.value as GrantType)}>
                <option value="authorization_code">Authorization Code (+ PKCE)</option>
                <option value="client_credentials">Client Credentials</option>
                <option value="device_code">Device Code</option>
                <option value="implicit">Implicit (Deprecated)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Client ID</label>
              <input type="text" className={inputClass} placeholder="your-client-id" value={clientId} onChange={e => setClientId(e.target.value)} />
            </div>
            {grantType !== 'client_credentials' && grantType !== 'device_code' && (
              <div>
                <label className={labelClass}>Redirect URI</label>
                <input type="text" className={inputClass} placeholder="https://your-app.example.com/callback" value={redirectUri} onChange={e => setRedirectUri(e.target.value)} />
              </div>
            )}
            <div>
              <label className={labelClass}>Scope</label>
              <input type="text" className={inputClass} placeholder="openid profile email" value={scope} onChange={e => setScope(e.target.value)} />
            </div>
            {(grantType === 'authorization_code' || grantType === 'implicit') && (
              <div>
                <label className={labelClass}>State (CSRF protection)</label>
                <input type="text" className={inputClass} placeholder="random-state-value" value={state} onChange={e => setState(e.target.value)} />
              </div>
            )}
            {grantType === 'authorization_code' && (
              <div>
                <label className={labelClass}>Code Challenge (PKCE)</label>
                <input type="text" className={inputClass} placeholder="base64url-encoded SHA256 of code_verifier" value={codeChallenge} onChange={e => setCodeChallenge(e.target.value)} />
              </div>
            )}
            <div>
              <label className={labelClass}>Authorization Endpoint (optional)</label>
              <input type="text" className={inputClass} placeholder="https://authorization-server.example.com/authorize" value={authEndpoint} onChange={e => setAuthEndpoint(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Token Endpoint (optional)</label>
              <input type="text" className={inputClass} placeholder="https://authorization-server.example.com/token" value={tokenEndpoint} onChange={e => setTokenEndpoint(e.target.value)} />
            </div>
          </div>

          {result.notes.length > 0 && (
            <div className="border border-amber-300 bg-amber-50 p-3">
              {result.notes.map((note, i) => (
                <div key={i} className="text-amber-700 text-xs">{note}</div>
              ))}
            </div>
          )}

          {result.authorizationUrl && (
            <div>
              <div className={labelClass}>Authorization URL</div>
              <pre className="bg-gray-50 text-gray-900 border border-gray-200 p-3 text-xs font-mono whitespace-pre-wrap break-all">
                {result.authorizationUrl}
              </pre>
            </div>
          )}

          <div>
            <div className={labelClass}>Flow Steps</div>
            <div className="border border-gray-200 overflow-hidden">
              {result.flowSteps.map((step, i) => (
                <div key={i} className={`text-gray-700 text-xs font-mono px-3 py-2 ${i > 0 ? 'border-t border-gray-200' : ''}`}>{step}</div>
              ))}
            </div>
          </div>

          <div>
            <div className={labelClass}>Token Request (cURL)</div>
            <pre className="bg-gray-50 text-gray-900 border border-gray-200 p-3 text-xs font-mono whitespace-pre-wrap overflow-auto">
              {result.tokenCurlExample}
            </pre>
          </div>
        </>
      )}

      {activeTab === 'decoder' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Access Token (JWT)</label>
            <textarea
              rows={4}
              className={inputClass}
              placeholder="Paste a JWT access token here..."
              value={jwtInput}
              onChange={e => setJwtInput(e.target.value)}
            />
          </div>
          {jwtOutput && (
            <pre className="bg-gray-50 text-gray-900 border border-gray-200 p-3 text-xs font-mono whitespace-pre-wrap">
              {jwtOutput}
            </pre>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="OAuth 2.0 Flow Builder"
      description="Build [1 OAuth 2.0 2] authorization URLs and understand each flow. Supports [1 Authorization Code 2], [1 Client Credentials 2], [1 Device Code 2], and [1 Implicit 2] grant types. Also decodes JWT access tokens."
      extraElements={extraElements}
      backColor="sky"
    />
  );
};
