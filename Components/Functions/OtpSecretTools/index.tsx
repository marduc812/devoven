'use client';

import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { bytesToBase32, formatOtpUri, otpQrFilename } from './logic';

export const OtpSecretTools = () => {
  const [secret, setSecret] = useState('');
  const [issuer, setIssuer] = useState('MyApp');
  const [account, setAccount] = useState('user@example.com');
  const qrRef = useRef<HTMLDivElement>(null);

  const generateSecret = () => {
    // Use WebCrypto for secure random bytes in the browser
    const bytes = new Uint8Array(20); // 160 bits
    crypto.getRandomValues(bytes);
    setSecret(bytesToBase32(Array.from(bytes)));
  };

  const uri = secret ? formatOtpUri(secret, issuer, account) : '';

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = otpQrFilename(issuer, account);
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const inputClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm';
  const labelClass = 'text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1 block';
  const btnClass =
    'px-4 py-2 bg-gray-900 text-white border-gray-900 text-sm font-medium hover:bg-gray-700 transition-colors duration-200 cursor-pointer';

  return (
    <Panel
      title="OTP Secret Generator"
      description="Generate random [1 TOTP 2] secret keys compatible with Google Authenticator, Authy, and 1Password. Produces base32-encoded secrets for [1 RFC 6238 2] compliant apps."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Issuer (app name)</label>
            <input
              className={inputClass}
              placeholder="MyApp"
              value={issuer}
              onChange={e => setIssuer(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Account (username / email)</label>
            <input
              className={inputClass}
              placeholder="user@example.com"
              value={account}
              onChange={e => setAccount(e.target.value)}
            />
          </div>
          <button className={btnClass} onClick={generateSecret}>
            Generate Secret
          </button>
          {secret && (
            <>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>Secret (base32)</label>
                <div className="bg-white border border-gray-200 p-3 font-mono text-sm text-gray-900 break-all select-all">
                  {secret}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>OTP Auth URI</label>
                <div className="bg-gray-50 border border-gray-200 p-3 font-mono text-xs text-gray-700 break-all">
                  {uri}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className={labelClass}>QR Code</label>
                <div ref={qrRef} className="border border-gray-200 bg-white p-6 flex justify-center">
                  <QRCodeCanvas value={uri} size={256} level="M" includeMargin />
                </div>
                <button className={btnClass + ' mt-2 self-start'} onClick={downloadQr}>
                  Download PNG
                </button>
              </div>
              <div className="border border-gray-200 bg-gray-50 p-3">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ['Algorithm', 'SHA1'],
                      ['Digits', '6'],
                      ['Period', '30 seconds'],
                      ['Secret bits', '160'],
                    ].map(([label, value]) => (
                      <tr key={label} className="border-b border-gray-200">
                        <td className="py-1.5 pr-4 text-gray-400 text-xs">{label}</td>
                        <td className="py-1.5 text-gray-900 font-mono text-xs">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-gray-500 text-xs">Compatible with Google Authenticator, Authy, 1Password, and any RFC 6238 TOTP app.</p>
            </>
          )}
        </div>
      }
    />
  );
};
