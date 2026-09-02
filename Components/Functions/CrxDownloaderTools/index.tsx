'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  extractExtensionId,
  buildCrxUrl,
  DEFAULT_PRODVERSION,
  AcceptFormat,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const INSTALL_STEPS = [
  'Download the .crx file below using a browser that has internet access.',
  'Rename the file from .crx to .zip, then extract it into a folder.',
  'In the offline Chrome, open chrome://extensions and turn on Developer mode.',
  'Click "Load unpacked" and select the extracted folder.',
];

export function CrxDownloader() {
  const [input, setInput] = useState('');
  const [prodversion, setProdversion] = useState(DEFAULT_PRODVERSION);
  const [acceptformat, setAcceptformat] = useState<AcceptFormat>('crx3');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = input.trim() ? extractExtensionId(input) : null;
  const id = result && 'id' in result ? result.id : null;
  const error = result && 'error' in result ? result.error : null;
  const url = id ? buildCrxUrl({ id, prodversion: prodversion.trim() || DEFAULT_PRODVERSION, acceptformat }) : null;

  const copyToClipboard = () => {
    if (!url || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputClass = 'bg-white text-gray-900 border border-gray-200 focus:border-gray-400 focus:outline-none px-3 py-2 text-sm font-mono w-full';
  const labelClass = 'text-gray-500 text-xs uppercase tracking-wider mb-1 block';
  const buttonClass = 'px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors';
  const radioLabel = 'flex items-center gap-2 text-sm text-gray-700 cursor-pointer';

  return (
    <Panel
      title="Chrome Extension CRX Downloader"
      description="Build a direct download link for any Chrome Web Store extension, so you can fetch the [1 .crx 2] file from Firefox, curl, or any other browser and side-load it into a Chrome that has no internet access. Paste a store URL or a bare extension ID."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Chrome Web Store URL or extension ID</label>
            <input
              className={inputClass}
              placeholder="https://chromewebstore.google.com/detail/name/abcdefghijklmnopabcdefghijklmnop"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            {id && (
              <p className="text-emerald-700 text-xs mt-1.5 font-mono break-all">
                <span className="mr-1">✓</span>{id}
              </p>
            )}
            {error && (
              <p className="text-rose-700 text-xs mt-1.5">
                <span className="mr-1">✗</span>{error}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Target Chrome version</label>
              <input
                className={inputClass}
                value={prodversion}
                onChange={e => setProdversion(e.target.value)}
                placeholder={DEFAULT_PRODVERSION}
              />
              <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                The default serves the newest build. Lower it to the offline Chrome&apos;s own
                version if that Chrome is old — the store will then send the last release
                compatible with it.
              </p>
            </div>
            <div>
              <label className={labelClass}>Package format</label>
              <div className="flex flex-col gap-2 pt-1.5">
                <label className={radioLabel}>
                  <input
                    type="radio"
                    checked={acceptformat === 'crx3'}
                    onChange={() => setAcceptformat('crx3')}
                  />
                  <span>CRX3 only</span>
                </label>
                <label className={radioLabel}>
                  <input
                    type="radio"
                    checked={acceptformat === 'crx2,crx3'}
                    onChange={() => setAcceptformat('crx2,crx3')}
                  />
                  <span>Allow CRX2 fallback</span>
                </label>
              </div>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">
                CRX3 covers everything current. Allow CRX2 only if an old extension
                returns nothing.
              </p>
            </div>
          </div>

          {url && (
            <div>
              <label className={labelClass}>Download link</label>
              <div className="bg-gray-100 border border-gray-200 px-4 py-3">
                <code className="text-gray-900 text-xs font-mono break-all">{url}</code>
              </div>
              <div className="flex gap-2 mt-2">
                <a
                  className="px-3 py-1.5 text-sm bg-gray-900 text-white border border-gray-900 hover:bg-gray-700 transition-colors"
                  href={url}
                  download={`${id}.crx`}
                  rel="noopener noreferrer"
                >
                  Download .crx
                </a>
                <button className={buttonClass} onClick={copyToClipboard}>
                  {copied ? 'Copied' : 'Copy link'}
                </button>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-amber-700 text-xs font-semibold mb-1">If nothing downloads</p>
            <p className="text-amber-700 text-xs leading-relaxed">
              The store returns an error when the extension ID does not exist or the
              extension has been removed, and an empty response when the target Chrome
              version above is below the extension&apos;s minimum. Either way no file is
              saved. This page cannot report which it was, because the store does not allow
              it to read the response — check the ID first, then try raising the version.
            </p>
          </div>

          <div>
            <label className={labelClass}>Installing it in the offline Chrome</label>
            <ol className="flex flex-col gap-1.5 mt-1">
              {INSTALL_STEPS.map((step, i) => (
                <li key={i} className="text-gray-700 text-sm flex gap-2">
                  <span className="text-emerald-700 font-mono">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-gray-500 text-xs mt-3 leading-relaxed">
              A .crx file is a ZIP archive with a signature header in front of it, which is
              why renaming works — archive tools read the index at the end of the file and
              ignore the header. Dropping the .crx straight onto the extensions page is
              refused by Chrome on Windows and macOS, so extract it instead. Note that an
              extension loaded this way gets a new ID, will not auto-update, and makes Chrome
              show a developer-mode warning at startup.
            </p>
          </div>
        </div>
      }
    />
  );
}
