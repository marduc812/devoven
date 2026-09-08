'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { ASN1_SAMPLE, formatOidLookup, lookupOid, parseAsn1Text } from '@/Components/Functions/Asn1Tools/logic';
import {
  extractPublicKey,
  formatCsr,
  formatPublicKey,
  jwkToPem,
  parseCsr,
  pemToJwk,
} from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
const buttonClass = 'px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer';

const run = (fn: () => string): string => {
  try {
    return fn();
  } catch (e: unknown) {
    return e instanceof Error ? `Error: ${e.message}` : 'Cannot read that input';
  }
};

/** Reads `?from=` on mount, the way every text tool does. */
function useFromParam(setter: (value: string) => void) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setter(from);
    // The setter is a state setter, stable for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── 1. ASN.1 Parser ──────────────────────────────────────────────────────────

export function Asn1Parser() {
  const [input, setInput] = useState('');
  const [offsets, setOffsets] = useState(true);
  const [full, setFull] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    if (params.get('offsets') === 'false') setOffsets(false);
    if (params.get('full') === 'true') setFull(true);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ offsets, full });

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return run(() => parseAsn1Text(input, { offsets, maxValue: full ? 0 : 120 }));
  }, [input, offsets, full]);

  return (
    <AdvancedConverter
      title="ASN.1 Parser"
      description="Walk the DER inside a certificate, a key, a CSR or any other ASN.1 structure. Paste a PEM block, Base64 or raw hex: tags are named, OIDs are looked up, integers and strings are decoded, and DER hiding inside an OCTET STRING or BIT STRING is unwrapped rather than shown as a wall of bytes."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="PEM, Base64 or Hex"
      toTitle="Structure"
      backColor="yellow"
      extraElements={
        <>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={offsets} onChange={(e) => setOffsets(e.target.checked)} />
            <span className="text-gray-500 text-xs whitespace-nowrap">Show offsets</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={full} onChange={(e) => setFull(e.target.checked)} />
            <span className="text-gray-500 text-xs whitespace-nowrap">Full values</span>
          </label>
          <button className={buttonClass} onClick={() => setInput(ASN1_SAMPLE)}>Load Sample</button>
        </>
      }
    />
  );
}

// ─── 2. OID Lookup ────────────────────────────────────────────────────────────

export function OidLookupTool() {
  const [input, setInput] = useState('');
  useFromParam(setInput);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return run(() => formatOidLookup(lookupOid(input)));
  }, [input]);

  return (
    <BasicConverter
      title="OID to Hex Converter"
      description="Convert an object identifier between its dotted form and its DER bytes, in either direction. [1 1.2.840.10045.3.1.7 2] encodes to [1 06 08 2a 86 48 ce 3d 03 01 07 2] and back, and known OIDs are named. The first two arcs share one value, which is why [1 2.100.3 2] does not start with a single byte."
      fromTitle="OID or DER Bytes"
      toTitle="Details"
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      backColor="yellow"
    />
  );
}

// ─── 3. CSR Parser ────────────────────────────────────────────────────────────

export function CsrParser() {
  const [input, setInput] = useState('');
  useFromParam(setInput);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return run(() => formatCsr(parseCsr(input)));
  }, [input]);

  return (
    <BasicConverter
      title="CSR Parser"
      description="Read a PKCS#10 certificate signing request: the subject it asks for, the algorithm it will be signed with, the public key inside it, and the subject alternative names carried in its extension request. The one thing worth checking before you send a CSR to a CA is the one thing you cannot see in the Base64."
      fromTitle="CSR (PEM or Base64)"
      toTitle="Request"
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      backColor="yellow"
    />
  );
}

// ─── 4. Public Key Extractor ──────────────────────────────────────────────────

export function PublicKeyExtractor() {
  const [input, setInput] = useState('');
  useFromParam(setInput);

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return run(() => formatPublicKey(extractPublicKey(input)));
  }, [input]);

  return (
    <BasicConverter
      title="Extract Public Key"
      description="Pull the public half out of whatever you have: a certificate, a CSR, or a private key in PKCS#8, PKCS#1 or SEC1 form. The result is a [1 PUBLIC KEY 2] PEM, the same bytes [1 openssl x509 -pubkey 2] would give you, along with the key's algorithm and size. RSA and EC keys are supported; an Ed25519 private key does not carry its public half in the clear."
      fromTitle="Certificate, CSR or Key"
      toTitle="Public Key"
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      backColor="yellow"
    />
  );
}

// ─── 5. JWK to PEM ────────────────────────────────────────────────────────────

type JwkDirection = 'jwk-to-pem' | 'pem-to-jwk';

export function JwkPemConverter() {
  const [input, setInput] = useState('');
  const [direction, setDirection] = useState<JwkDirection>('jwk-to-pem');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const mode = params.get('mode');
    if (mode === 'jwk-to-pem' || mode === 'pem-to-jwk') setDirection(mode);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ mode: direction });

  const output = useMemo(() => {
    if (!input.trim()) return '';
    return run(() => (direction === 'jwk-to-pem' ? jwkToPem(input) : pemToJwk(input)));
  }, [input, direction]);

  return (
    <AdvancedConverter
      title="JWK to PEM Converter"
      description="Move a key between the JSON Web Key form and PEM, both ways. RSA, EC (P-256, P-384, P-521, secp256k1) and OKP (Ed25519, Ed448) are supported; a JWK with a [1 d 2] becomes a PKCS#8 private key, one without becomes a [1 PUBLIC KEY 2]. Paste a whole JWK Set and the first key in it is used."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle={direction === 'jwk-to-pem' ? 'JWK' : 'PEM'}
      toTitle={direction === 'jwk-to-pem' ? 'PEM' : 'JWK'}
      backColor="yellow"
      extraElements={
        <div className="flex items-center gap-2">
          <label className={labelClass}>Direction</label>
          <select
            className={selectClass}
            value={direction}
            onChange={(e) => setDirection(e.target.value as JwkDirection)}
          >
            <option value="jwk-to-pem">JWK to PEM</option>
            <option value="pem-to-jwk">PEM to JWK</option>
          </select>
        </div>
      }
    />
  );
}
