'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  VCARD_FIELDS,
  VcardFields,
  buildVcard,
  isEmptyVcard,
  parseKeyValueInput,
  vcardFilename,
  vcardToFields,
} from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

// Byte-mode QR at error correction M tops out around 2.3 KB; stay well inside it.
const QR_BYTE_LIMIT = 2000;

const inputClass =
  'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none text-sm';
const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1';
const btnClass =
  'bg-gray-900 hover:bg-gray-700 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const btnSecondaryClass =
  'border border-gray-300 hover:border-gray-900 text-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';

export function VcardGenerator() {
  const [fields, setFields] = useState<VcardFields>({});
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);

  // Every field is its own URL param (?firstName=Alice&email=…);
  // ?from= still accepts the old key=value payload so shared links keep working.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seeded: VcardFields = params.get('from') ? parseKeyValueInput(params.get('from') as string) : {};
    for (const field of VCARD_FIELDS) {
      const value = params.get(field.id);
      if (value !== null) seeded[field.id] = value;
    }
    if (Object.keys(seeded).length > 0) setFields(seeded);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink(Object.fromEntries(VCARD_FIELDS.map((field) => [field.id, fields[field.id]])))

  const vcard = useMemo(() => buildVcard(fields), [fields]);
  const empty = isEmptyVcard(fields);
  const qrTooLong = new TextEncoder().encode(vcard).length > QR_BYTE_LIMIT;

  const setField = (id: keyof VcardFields, value: string) =>
    setFields(prev => ({ ...prev, [id]: value }));

  const downloadVcf = () => {
    const blob = new Blob([vcard + '\r\n'], { type: 'text/vcard;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = vcardFilename(fields) + '.vcf';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadQr = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = vcardFilename(fields) + '-qr.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const importVcard = () => {
    const imported = vcardToFields(importText);
    if (Object.keys(imported).length === 0) {
      setImportError('No vCard fields found. Paste the contents of a .vcf file, starting with BEGIN:VCARD.');
      return;
    }
    setFields(imported);
    setImportError('');
    setImportText('');
  };

  return (
    <Panel
      title="vCard Generator"
      description="Fill in the contact details to build a [1 vCard 3.0 (.vcf) 2] file and a scannable QR code. Download the card, or point a phone camera at the code to save the contact. Every field can be pre-filled from the URL, e.g. [1 ?firstName=Alice&email=alice@example.com 2]."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {VCARD_FIELDS.map(field => (
              <div key={field.id} className={field.id === 'note' ? 'md:col-span-2' : undefined}>
                <label className={labelClass} htmlFor={`vcard-${field.id}`}>{field.label}</label>
                <input
                  id={`vcard-${field.id}`}
                  className={inputClass}
                  type={field.type ?? 'text'}
                  autoComplete="off"
                  placeholder={field.placeholder}
                  value={fields[field.id] ?? ''}
                  onChange={e => setField(field.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* QR code */}
            <div className="flex flex-col gap-3">
              <p className={labelClass}>QR Code</p>
              <div
                ref={qrRef}
                className="border border-gray-200 bg-white p-6 flex items-center justify-center min-h-[308px]"
              >
                {empty ? (
                  <p className="text-gray-400 text-sm text-center">Fill in a field to see the QR code</p>
                ) : qrTooLong ? (
                  <p className="text-gray-400 text-sm text-center">
                    Too much data for one QR code. Shorten the note or the address.
                  </p>
                ) : (
                  <QRCodeCanvas value={vcard} size={256} level="M" marginSize={2} />
                )}
              </div>
              <button className={btnSecondaryClass} onClick={downloadQr} disabled={empty || qrTooLong}>
                Download QR PNG
              </button>
            </div>

            {/* vCard source */}
            <div className="flex flex-col gap-3">
              <p className={labelClass}>vCard (.vcf)</p>
              <textarea
                className="bg-gray-50 text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 cursor-default resize-y font-mono text-xs min-h-[308px]"
                placeholder="BEGIN:VCARD…"
                value={vcard}
                readOnly
              />
              <button className={btnClass} onClick={downloadVcf} disabled={empty}>
                Download .vcf
              </button>
            </div>
          </div>

          {/* Import */}
          <div className="border-t border-gray-200 pt-6 flex flex-col gap-3">
            <p className={labelClass}>Load an existing vCard</p>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none resize-y font-mono text-xs"
              rows={4}
              placeholder="Paste the contents of a .vcf file here to fill the form above…"
              value={importText}
              onChange={e => { setImportText(e.target.value); setImportError(''); }}
            />
            {importError && <p className="text-red-500 text-sm">{importError}</p>}
            <div>
              <button className={btnSecondaryClass} onClick={importVcard} disabled={!importText.trim()}>
                Load into form
              </button>
            </div>
          </div>
        </div>
      }
    />
  );
}
