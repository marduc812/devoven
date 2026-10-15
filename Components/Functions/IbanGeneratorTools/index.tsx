'use client';

import { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { CopyButton, ErrorNote, SectionTitle, StatTile, StatusBadge, inputClass } from '@/Components/MainView/MainPanel/ResultUI';
import { IBAN_COUNTRIES, exportIbans, formatIban, generateIbans, getCountry, ibanLength, type ExportFormat } from './logic';

const buttonClass = 'border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:border-gray-900 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer';
const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-gray-500';
const colors = [
  'bg-indigo-50 border-indigo-200 text-indigo-700',
  'bg-emerald-50 border-emerald-200 text-emerald-700',
  'bg-amber-50 border-amber-200 text-amber-700',
];
const labels = ['Country code', 'Check digits', 'BBAN'];

function HighlightedIban({ iban, compact = false }: { iban: string; compact?: boolean }) {
  const parts = [iban.slice(0, 2), iban.slice(2, 4), formatIban(iban.slice(4))];
  return (
    <div className={`flex flex-wrap items-baseline gap-1 font-mono ${compact ? 'text-sm' : 'text-xl sm:text-2xl font-bold'}`} aria-label={formatIban(iban)}>
      {parts.map((part, index) => (
        <span key={index} title={labels[index]} className={`border px-1.5 py-1 ${colors[index]} ${index === 2 ? 'break-all' : 'shrink-0'}`}>
          {part}
        </span>
      ))}
    </div>
  );
}

export function IbanGeneratorTools() {
  const [countryCode, setCountryCode] = useState('DE');
  const [quantity, setQuantity] = useState('1');
  const [result, setResult] = useState<{ countryCode: string; ibans: string[] } | null>(null);
  const [error, setError] = useState('');
  const country = getCountry(countryCode);
  const resultCountry = result ? getCountry(result.countryCode) : null;
  const first = result?.ibans[0];
  const settingsChanged = result && (result.countryCode !== countryCode || result.ibans.length !== Number(quantity));

  function generate(event: React.FormEvent) {
    event.preventDefault();
    try {
      setResult({ countryCode, ibans: generateIbans(countryCode, Number(quantity)) });
      setError('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not generate IBANs.');
    }
  }

  function download(format: ExportFormat) {
    if (!result) return;
    const mime = { txt: 'text/plain', csv: 'text/csv', json: 'application/json' }[format];
    const url = URL.createObjectURL(new Blob([exportIbans(result.ibans, format)], { type: `${mime};charset=utf-8` }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ibans-${result.countryCode.toLowerCase()}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <Panel
      title="IBAN Generator"
      description="Generate test IBANs for 42 countries with correct [1 MOD-97 check digits 2]. Inspect each part of the number, copy individual values, or export a batch. Generation runs in your browser."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          <form onSubmit={generate} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-2 flex-1 min-w-0 sm:min-w-[240px]">
                <label className={labelClass} htmlFor="iban-country">Account country</label>
                <select id="iban-country" value={countryCode} onChange={event => setCountryCode(event.target.value)} className={inputClass}>
                  {IBAN_COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.name} ({country.code})</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-2 w-28">
                <label className={labelClass} htmlFor="iban-quantity">Quantity</label>
                <input id="iban-quantity" type="number" min={1} max={100} step={1} required value={quantity} onChange={event => setQuantity(event.target.value)} className={inputClass} />
              </div>
              <button type="submit" className="bg-gray-900 text-white px-5 py-3 text-sm font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer">Generate {Number(quantity) > 1 ? 'IBANs' : 'IBAN'}</button>
            </div>
            <p className="text-xs text-gray-500">{country.name} uses {ibanLength(country)} characters. BBAN format: <span className="font-mono">{country.pattern}</span>.</p>
            <p className="text-xs text-gray-500 leading-relaxed">For format testing and demos. Bank codes and accounts are synthetic. Domestic checks and account existence are not verified. Do not use generated values for payments.</p>
            {error && <div role="alert"><ErrorNote>{error}</ErrorNote></div>}
          </form>

          {!first && <div className="border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-sm text-gray-500">Choose a country and generate an IBAN to see its number breakdown.</div>}

          {result && first && resultCountry && (
            <section className="flex flex-col gap-4" aria-label="Generated IBANs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SectionTitle>{resultCountry.name}, {result.ibans.length} {result.ibans.length === 1 ? 'IBAN' : 'IBANs'}</SectionTitle>
                <StatusBadge tone="pass">MOD-97 passes</StatusBadge>
              </div>
              {settingsChanged && <p role="status" className="text-xs text-amber-700">Settings changed. Generate again to replace these results.</p>}
              <div className="border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center gap-3">
                  <span className={labelClass}>{result.ibans.length > 1 ? 'First IBAN breakdown' : 'Generated IBAN'}</span>
                  <CopyButton text={first} label="IBAN" appearance="icon" />
                </div>
                <HighlightedIban iban={first} />
                <div className="flex flex-wrap gap-3 text-[11px] text-gray-500">
                  {labels.map((label, index) => <span key={label} className="flex items-center gap-1.5"><span className={`inline-block w-3 h-3 border ${colors[index]}`} />{label}</span>)}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatTile label="Country code" value={first.slice(0, 2)} hint={resultCountry.name} />
                <StatTile label="Check digits" value={first.slice(2, 4)} hint="International MOD-97" />
                <StatTile label="Length" value={first.length} hint={`${first.length - 4} BBAN characters`} />
                <StatTile label="BBAN pattern" value={resultCountry.pattern} hint="n: digit, a: letter, c: either" />
              </div>
              <p className="text-xs text-gray-500">BBAN structure: {resultCountry.structure}. Lengths count characters.</p>
              <div className="flex flex-wrap items-center gap-3 border-y border-gray-200 py-3">
                <CopyButton text={result.ibans.join('\n')} label="all IBANs" verb="Copy all" appearance="button" />
                {(['txt', 'csv', 'json'] as const).map(format => <button key={format} onClick={() => download(format)} className={buttonClass}>Download {format.toUpperCase()}</button>)}
              </div>
              {result.ibans.length > 1 && (
                <ol className="border border-gray-200 divide-y divide-gray-200 max-h-[480px] overflow-y-auto" aria-label="IBAN batch">
                  {result.ibans.map((iban, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 p-3">
                      <div className="flex items-baseline gap-3 min-w-0"><span className="text-xs font-mono text-gray-400">{index + 1}.</span><HighlightedIban iban={iban} compact /></div>
                      <CopyButton text={iban} label={`IBAN ${index + 1}`} appearance="icon" />
                    </li>
                  ))}
                </ol>
              )}
              <details className="border border-gray-200 p-4 text-xs text-gray-500">
                <summary className="cursor-pointer font-bold text-gray-700">How the check digits work</summary>
                <p className="mt-3 leading-relaxed">Generate a BBAN matching the country pattern. Append the country code and 00, convert letters to numbers with A = 10 through Z = 35, then calculate 98 minus the remainder modulo 97. These two digits follow the country code. Moving the first four characters of the finished IBAN to the end gives a MOD-97 remainder of 1.</p>
                <p className="mt-2 leading-relaxed">Passing this check confirms the international checksum, not a bank or account. Domestic check positions contain random digits too.</p>
              </details>
            </section>
          )}
        </div>
      }
    />
  );
}
