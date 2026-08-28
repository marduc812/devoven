'use client';

import { useState, useRef } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { formatUuidsAsText, formatUlidsAsText, buildVCard, validateBcryptRounds, buildHtpasswdEntry, arrayBufferToPem } from './logic';

// ─── Shared Tailwind classes ──────────────────────────────────────────────────

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';
const selectClass = 'bg-white text-gray-900 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900';
const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-gray-900 w-full';
const textareaClass = 'bg-white text-gray-900 border border-gray-200 px-3 py-2 text-sm font-mono w-full resize-none focus:outline-none';
const buttonPrimaryClass = 'bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors';
const buttonSecondaryClass = 'bg-white hover:border-gray-900 text-gray-700 border border-gray-300 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors';

// ─── UUID Generator ───────────────────────────────────────────────────────────

export function UuidGenerator() {
  const [version, setVersion] = useState<'v1' | 'v4' | 'v7'>('v4');
  const [count, setCount] = useState(10);
  const [output, setOutput] = useState('');

  const generate = async () => {
    const { v1, v4, v7 } = await import('uuid');
    const uuids = Array.from({ length: count }, () => {
      if (version === 'v1') return v1();
      if (version === 'v7') return v7();
      return v4();
    });
    setOutput(formatUuidsAsText(uuids));
  };

  return (
    <Panel
      title="UUID Generator"
      description="Generate Universally Unique Identifiers (UUIDs). Choose between [1 v1 2] (time-based), [1 v4 2] (random), or [1 v7 2] (time-ordered random). Generate up to 10 at a time."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Version</label>
              <select
                value={version}
                onChange={e => setVersion(e.target.value as 'v1' | 'v4' | 'v7')}
                className={selectClass}
              >
                <option value="v4">v4 (random)</option>
                <option value="v1">v1 (time-based)</option>
                <option value="v7">v7 (time-ordered random)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Count</label>
              <select
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className={selectClass}
              >
                {[1, 2, 5, 10].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <button onClick={generate} className={buttonPrimaryClass}>
            Generate
          </button>
          {output && (
            <textarea
              readOnly
              value={output}
              rows={Math.min(count, 10)}
              className={textareaClass}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
          )}
        </div>
      }
    />
  );
}

// ─── ULID Generator ───────────────────────────────────────────────────────────

export function UlidGenerator() {
  const [count, setCount] = useState(10);
  const [output, setOutput] = useState('');

  const generate = async () => {
    const { ulid } = await import('ulid');
    const ulids = Array.from({ length: count }, () => ulid());
    setOutput(formatUlidsAsText(ulids));
  };

  return (
    <Panel
      title="ULID Generator"
      description="Generate Universally Unique Lexicographically Sortable Identifiers (ULIDs). ULIDs are [1 26-character 2] strings that are URL-safe, sortable by creation time, and monotonically increasing within the same millisecond."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Count</label>
            <select
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              className={selectClass}
            >
              {[1, 2, 5, 10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <button onClick={generate} className={buttonPrimaryClass}>
            Generate
          </button>
          {output && (
            <textarea
              readOnly
              value={output}
              rows={Math.min(count, 10)}
              className={textareaClass}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
          )}
        </div>
      }
    />
  );
}

// ─── QR Code Generator ────────────────────────────────────────────────────────

const QR_MAX_CHARS = 2000;

type QrTab = 'url' | 'text' | 'vcard';

export function QrCodeGenerator() {
  const [tab, setTab] = useState<QrTab>('url');
  const [inputText, setInputText] = useState('');
  const [vcName, setVcName] = useState('');
  const [vcPhone, setVcPhone] = useState('');
  const [vcEmail, setVcEmail] = useState('');
  const [vcUrl, setVcUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    setError('');
    setQrDataUrl('');
    try {
      const QRCode = (await import('qrcode')).default;
      let content = '';
      if (tab === 'vcard') {
        content = buildVCard(vcName, vcPhone, vcEmail, vcUrl);
      } else {
        content = inputText;
      }
      if (!content.trim()) {
        setError('Please enter some content to encode.');
        return;
      }
      if (content.length > QR_MAX_CHARS) {
        setError(`Text is too large to create a QR code (${content.length} / ${QR_MAX_CHARS} characters max).`);
        return;
      }
      const dataUrl = await QRCode.toDataURL(content, { errorCorrectionLevel: 'M', width: 300 });
      setQrDataUrl(dataUrl);
    } catch {
      setError('Failed to generate QR code. Check your input.');
    }
  };

  const tabButtonClass = (t: QrTab) =>
    `px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
      tab === t
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
    }`;

  return (
    <Panel
      title="QR Code Generator"
      description="Generate QR codes from a [1 URL 2], free [1 text 2], or a [1 vCard 2] contact. The QR code is generated entirely in your browser."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2">
            <button className={tabButtonClass('url')} onClick={() => setTab('url')}>URL</button>
            <button className={tabButtonClass('text')} onClick={() => setTab('text')}>Text</button>
            <button className={tabButtonClass('vcard')} onClick={() => setTab('vcard')}>vCard</button>
          </div>

          {(tab === 'url' || tab === 'text') && (
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={tab === 'url' ? 'https://example.com' : 'Enter text to encode'}
                className={inputClass}
              />
              <span className={`text-xs text-right ${inputText.length > QR_MAX_CHARS ? 'text-red-500' : 'text-gray-400'}`}>
                {inputText.length} / {QR_MAX_CHARS}
              </span>
            </div>
          )}

          {tab === 'vcard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Full Name', placeholder: 'Jane Smith', value: vcName, setter: setVcName, type: 'text' },
                { label: 'Phone', placeholder: '+1234567890', value: vcPhone, setter: setVcPhone, type: 'text' },
                { label: 'Email', placeholder: 'jane@example.com', value: vcEmail, setter: setVcEmail, type: 'email' },
                { label: 'Website', placeholder: 'https://example.com', value: vcUrl, setter: setVcUrl, type: 'url' },
              ].map(({ label, placeholder, value, setter, type }) => (
                <div key={label}>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">{label}</label>
                  <input type={type} placeholder={placeholder} value={value} onChange={e => setter(e.target.value)} className={inputClass} />
                </div>
              ))}
            </div>
          )}

          <button onClick={generate} className={buttonPrimaryClass}>Generate QR Code</button>

          {error && <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">{error}</div>}

          {qrDataUrl && (
            <div className="flex flex-col gap-3">
              <div className="border border-gray-200 p-6 flex justify-center bg-white">
                <img src={qrDataUrl} alt="Generated QR Code" />
              </div>
              <a
                href={qrDataUrl}
                download="qrcode.png"
                className={buttonSecondaryClass + ' text-center'}
              >
                Download PNG
              </a>
            </div>
          )}
        </div>
      }
    />
  );
}

// ─── Barcode Generator ────────────────────────────────────────────────────────

type BarcodeFormat = 'CODE128' | 'EAN13' | 'UPC';

export function BarcodeGenerator() {
  const [inputValue, setInputValue] = useState('');
  const [format, setFormat] = useState<BarcodeFormat>('CODE128');
  const [error, setError] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const generate = async () => {
    setError('');
    if (!inputValue.trim()) {
      setError('Please enter a value to encode.');
      return;
    }
    try {
      const JsBarcode = (await import('jsbarcode')).default;
      JsBarcode(svgRef.current, inputValue, {
        format,
        lineColor: '#e5e7eb',
        background: 'transparent',
        fontOptions: 'normal',
        fontSize: 14,
        margin: 10,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid input for selected format.';
      setError(message);
    }
  };

  const downloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgRef.current);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'barcode.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel
      title="Barcode Generator"
      description="Generate barcodes in [1 CODE128 2], [1 EAN-13 2], or [1 UPC 2] format. Enter your value, select a format, and click Generate."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4 flex-wrap">
            <div className="flex flex-col gap-1 flex-1">
              <label className={labelClass}>Value</label>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="e.g. 012345678905"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Format</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value as BarcodeFormat)}
                className={selectClass}
              >
                <option value="CODE128">CODE128 (any text)</option>
                <option value="EAN13">EAN-13 (12 digits)</option>
                <option value="UPC">UPC (11 digits)</option>
              </select>
            </div>
          </div>

          <button onClick={generate} className={buttonPrimaryClass}>Generate Barcode</button>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex justify-center">
            <svg ref={svgRef} className="max-w-full" />
          </div>

          <button onClick={downloadSvg} className={buttonSecondaryClass}>Download SVG</button>
        </div>
      }
    />
  );
}

// ─── Bcrypt Hash Generator ────────────────────────────────────────────────────

type BcryptMode = 'generate' | 'verify';

export function BcryptGenerator() {
  const [mode, setMode] = useState<BcryptMode>('generate');
  const [password, setPassword] = useState('');
  const [rounds, setRounds] = useState(10);
  const [hashInput, setHashInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<boolean | null>(null);

  const handleGenerate = async () => {
    if (!password) return;
    setIsLoading(true);
    setOutput('');
    try {
      const bcrypt = await import('bcryptjs');
      const safeRounds = validateBcryptRounds(rounds);
      const hash = await bcrypt.hash(password, safeRounds);
      setOutput(hash);
    } catch {
      setOutput('Error generating hash.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!password || !hashInput) return;
    setIsLoading(true);
    setVerifyResult(null);
    try {
      const bcrypt = await import('bcryptjs');
      const result = await bcrypt.compare(password, hashInput);
      setVerifyResult(result);
    } catch {
      setVerifyResult(false);
    } finally {
      setIsLoading(false);
    }
  };

  const tabClass = (m: BcryptMode) =>
    `px-4 py-1.5 text-xs font-bold uppercase tracking-wider border transition-colors ${
      mode === m
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white text-gray-500 border-gray-300 hover:border-gray-900 hover:text-gray-900'
    }`;

  return (
    <Panel
      title="Bcrypt Hash Generator"
      description="Hash passwords with [1 bcrypt 2] or verify a password against an existing hash. Choose the cost factor [1 rounds 2] (4–14) to control hashing speed."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-2">
            <button className={tabClass('generate')} onClick={() => setMode('generate')}>Generate</button>
            <button className={tabClass('verify')} onClick={() => setMode('verify')}>Verify</button>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className={inputClass}
            />
          </div>

          {mode === 'generate' && (
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Rounds (cost factor): {rounds}</label>
              <input
                type="range"
                min={4}
                max={14}
                value={rounds}
                onChange={e => setRounds(Number(e.target.value))}
                className="w-full accent-gray-900"
              />
              <span className="text-xs text-gray-500">Higher rounds = stronger but slower. 10 is the recommended default.</span>
            </div>
          )}

          {mode === 'verify' && (
            <div className="flex flex-col gap-1">
              <label className={labelClass}>Existing Hash</label>
              <input
                type="text"
                value={hashInput}
                onChange={e => setHashInput(e.target.value)}
                placeholder="$2a$10$..."
                className={inputClass}
              />
            </div>
          )}

          <button
            onClick={mode === 'generate' ? handleGenerate : handleVerify}
            disabled={isLoading}
            className={`${buttonPrimaryClass} disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : mode === 'generate' ? 'Generate Hash' : 'Verify Password'}
          </button>

          {mode === 'generate' && output && (
            <textarea
              readOnly
              value={output}
              rows={2}
              className={textareaClass}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
          )}

          {mode === 'verify' && verifyResult !== null && (
            <p className={verifyResult ? 'text-green-700 font-bold text-sm' : 'text-red-700 font-bold text-sm'}>
              {verifyResult ? 'Password matches the hash.' : 'Password does NOT match the hash.'}
            </p>
          )}
        </div>
      }
    />
  );
}

// ─── .htpasswd Generator ─────────────────────────────────────────────────────

export function HtpasswdGenerator() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rounds, setRounds] = useState(10);
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setError('');
    setOutput('');
    if (!username.trim()) { setError('Username is required.'); return; }
    if (!password) { setError('Password is required.'); return; }
    setIsLoading(true);
    try {
      const bcrypt = await import('bcryptjs');
      const safeRounds = validateBcryptRounds(rounds);
      const hash = await bcrypt.hash(password, safeRounds);
      setOutput(buildHtpasswdEntry(username.trim(), hash));
    } catch {
      setError('Error generating htpasswd entry.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Panel
      title=".htpasswd Generator"
      description="Generate a [1 .htpasswd 2] entry using bcrypt. Enter a username and password to produce a line ready to paste into your Apache or Nginx password file."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. alice"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Rounds (cost factor): {rounds}</label>
            <input
              type="range"
              min={4}
              max={14}
              value={rounds}
              onChange={e => setRounds(Number(e.target.value))}
              className="w-full accent-gray-900"
            />
          </div>
          <p className="text-xs text-gray-500">
            Note: This generator uses <span className="font-mono text-gray-700">bcrypt</span> ($2a$). Apache httpd 2.4+ and Nginx support bcrypt via the <span className="font-mono text-gray-700">apr1</span> or <span className="font-mono text-gray-700">bcrypt</span> schemes. The legacy MD5-APR1 ($apr1$) scheme is not supported here.
          </p>
          <button
            onClick={generate}
            disabled={isLoading}
            className={`${buttonPrimaryClass} disabled:opacity-50`}
          >
            {isLoading ? 'Generating...' : 'Generate Entry'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {output && (
            <textarea
              readOnly
              value={output}
              rows={2}
              className={textareaClass}
              onClick={e => (e.target as HTMLTextAreaElement).select()}
            />
          )}
        </div>
      }
    />
  );
}

// ─── RSA Key Pair Generator ───────────────────────────────────────────────────

type RsaKeySize = 2048 | 4096;

export function RsaKeyPairGenerator() {
  const [keySize, setKeySize] = useState<RsaKeySize>(2048);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    setError('');
    setPublicKey('');
    setPrivateKey('');
    setIsLoading(true);
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt'],
      );
      const [pubBuffer, privBuffer] = await Promise.all([
        window.crypto.subtle.exportKey('spki', keyPair.publicKey),
        window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
      ]);
      setPublicKey(arrayBufferToPem(pubBuffer, 'PUBLIC KEY'));
      setPrivateKey(arrayBufferToPem(privBuffer, 'PRIVATE KEY'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate RSA key pair.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Panel
      title="RSA Key Pair Generator"
      description="Generate an [1 RSA 2] public/private key pair in your browser using the WebCrypto API. Keys are exported in [1 PEM 2] format (SPKI public key, PKCS#8 private key). Nothing leaves your browser."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className={labelClass}>Key Size</label>
            <select
              value={keySize}
              onChange={e => setKeySize(Number(e.target.value) as RsaKeySize)}
              className={selectClass}
            >
              <option value={2048}>2048-bit (faster, widely compatible)</option>
              <option value={4096}>4096-bit (stronger, slower)</option>
            </select>
          </div>

          <button
            onClick={generate}
            disabled={isLoading}
            className={`${buttonPrimaryClass} disabled:opacity-50`}
          >
            {isLoading ? 'Generating key pair...' : 'Generate Key Pair'}
          </button>

          {isLoading && (
            <p className="text-gray-400 text-sm text-center">
              {keySize === 4096
                ? 'Generating 4096-bit keys, this may take a few seconds...'
                : 'Generating key pair...'}
            </p>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {publicKey && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-row justify-between items-center">
                <label className={labelClass}>Public Key (SPKI)</label>
                <button onClick={() => downloadText(publicKey, 'public_key.pem')} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-1 transition-colors">
                  Download
                </button>
              </div>
              <textarea
                readOnly
                value={publicKey}
                rows={8}
                className={textareaClass}
                onClick={e => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          )}

          {privateKey && (
            <div className="flex flex-col gap-2">
              <div className="flex flex-row justify-between items-center">
                <label className={labelClass}>Private Key (PKCS#8)</label>
                <button onClick={() => downloadText(privateKey, 'private_key.pem')} className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 px-2 py-1 transition-colors">
                  Download
                </button>
              </div>
              <textarea
                readOnly
                value={privateKey}
                rows={12}
                className={textareaClass}
                onClick={e => (e.target as HTMLTextAreaElement).select()}
              />
              <p className="text-xs text-yellow-400">
                Keep your private key secret. Do not share it or commit it to version control.
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}
