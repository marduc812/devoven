'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parsePemCertificate, CertificateInfo } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const Field = ({ label, value }: { label: string; value: string }) => (
  <div className="border-b border-gray-200 py-2 last:border-0">
    <div className="text-xs text-gray-500 mb-0.5">{label}</div>
    <div className="text-sm text-gray-900 font-mono break-all">{value}</div>
  </div>
);

export const PemViewer = () => {
  const [input, setInput] = useState('');
  const [info, setInfo] = useState<CertificateInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = searchParams.get('from') ?? '';
    if (from) setInput(decodeURIComponent(from));
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input.trim()) {
      setInfo(null);
      setError('');
      return;
    }
    try {
      const result = parsePemCertificate(input);
      setInfo(result);
      setError('');
    } catch (e: unknown) {
      setInfo(null);
      setError(e instanceof Error ? e.message : 'Failed to parse certificate');
    }
  }, [input]);

  return (
    <Panel
      backColor="yellow"
      title="PEM Certificate Viewer"
      description="Paste a PEM-encoded X.509 certificate to view its fields: version, serial number, subject, issuer, validity dates, and basic constraints. All parsing is done in your browser."
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">PEM Certificate</label>
            <textarea
              className="bg-white text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none font-mono text-xs resize-none"
              rows={8}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste your -----BEGIN CERTIFICATE----- here..."
              spellCheck={false}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 px-4 py-3">
              {error}
            </div>
          )}

          {info && (
            <div className="border border-gray-200 bg-gray-50 px-4 py-3 flex flex-col">
              <Field label="Version" value={info.version} />
              <Field label="Serial Number" value={info.serialNumber} />
              <Field label="Signature Algorithm" value={info.algorithm} />
              <Field label="Subject" value={info.subject} />
              <Field label="Issuer" value={info.issuer} />
              <Field label="Valid From" value={info.validFrom} />
              <Field label="Valid To" value={info.validTo} />
              <Field label="CA Certificate" value={info.isCA} />
              <Field label="Subject Alt Names" value={info.subjectAltNames} />
              <Field label="DER Size" value={info.raw} />
            </div>
          )}

          {!info && !error && (
            <p className="text-gray-400 text-sm text-center py-4">
              Paste a PEM certificate above to inspect its fields
            </p>
          )}
        </div>
      }
    />
  );
};
