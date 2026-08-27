'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  ipv4ToInt,
  intToIpv4,
  ipv4ToBinary,
  binaryToIpv4,
  parseCidr,
  expandIpv6,
  compressIpv6,
  parseUrl,
  type ParsedUrl,
} from './logic';

// ─── Helper: read ?from= from query string ────────────────────────────────────

function useQueryFrom(): string {
  const [from, setFrom] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    setFrom(params.get('from') ?? '');
  }, []);
  return from;
}

// ─── 1. IPv4 ↔ Integer ───────────────────────────────────────────────────────

export const Ipv4ToInteger = () => {
  const [ipInput, setIpInput] = useState('');
  const [ipResult, setIpResult] = useState('');
  const [intInput, setIntInput] = useState('');
  const [intResult, setIntResult] = useState('');

  const convertIpToInt = () => {
    try {
      setIpResult(ipv4ToInt(ipInput).toString());
    } catch (e: unknown) {
      setIpResult(e instanceof Error ? e.message : 'Invalid input');
    }
  };

  const convertIntToIp = () => {
    try {
      const n = parseInt(intInput, 10);
      setIntResult(intToIpv4(n));
    } catch (e: unknown) {
      setIntResult(e instanceof Error ? e.message : 'Invalid input');
    }
  };

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';
  const readonlyClass =
    'bg-gray-50 text-gray-900 p-3 w-full border border-gray-200 font-mono text-sm';
  const btnClass =
    'mt-2 px-4 py-2 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer';

  return (
    <Panel
      title="IPv4 ↔ Integer Converter"
      description="Convert between IPv4 addresses and their 32-bit integer representation. [1 192.168.1.1 2] ↔ [1 3232235777 2]"
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">IPv4 → Integer</label>
            <input
              className={inputClass}
              placeholder="e.g. 192.168.1.1"
              value={ipInput}
              onChange={e => setIpInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && convertIpToInt()}
            />
            <button className={btnClass} onClick={convertIpToInt}>Convert</button>
            <div className={`${readonlyClass} mt-2`}>{ipResult || <span className="text-gray-400">Result will appear here</span>}</div>
          </div>
          <div className="w-full h-px bg-gray-200" />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Integer → IPv4</label>
            <input
              className={inputClass}
              placeholder="e.g. 3232235777"
              value={intInput}
              onChange={e => setIntInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && convertIntToIp()}
            />
            <button className={btnClass} onClick={convertIntToIp}>Convert</button>
            <div className={`${readonlyClass} mt-2`}>{intResult || <span className="text-gray-400">Result will appear here</span>}</div>
          </div>
        </div>
      }
    />
  );
};

// ─── 2. IPv4 ↔ Binary ────────────────────────────────────────────────────────

export const Ipv4ToBinary = () => {
  const queryFrom = useQueryFrom();
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [direction, setDirection] = useState<'ipv4-to-binary' | 'binary-to-ipv4'>('ipv4-to-binary');

  useEffect(() => {
    if (queryFrom) setFromValue(queryFrom);
  }, [queryFrom]);

  useEffect(() => {
    if (!fromValue) { setToValue(''); return; }
    try {
      setToValue(
        direction === 'ipv4-to-binary'
          ? ipv4ToBinary(fromValue)
          : binaryToIpv4(fromValue),
      );
    } catch {
      setToValue('Invalid input');
    }
  }, [fromValue, direction]);

  const selectEl = (
    <select
      className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
      value={direction}
      onChange={e => {
        setDirection(e.target.value as typeof direction);
        setFromValue('');
        setToValue('');
      }}
    >
      <option value="ipv4-to-binary">IPv4 → Binary</option>
      <option value="binary-to-ipv4">Binary → IPv4</option>
    </select>
  );

  const fromTitle = direction === 'ipv4-to-binary' ? 'IPv4 Address' : 'Binary (dot-separated octets)';
  const toTitle = direction === 'ipv4-to-binary' ? 'Binary' : 'IPv4 Address';

  return (
    <AdvancedConverter
      title="IPv4 ↔ Binary Converter"
      description="Convert IPv4 addresses to binary notation and back. [1 192.168.1.1 2] becomes [1 11000000.10101000.00000001.00000001 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle={fromTitle}
      toTitle={toTitle}
      extraElements={selectEl}
      backColor="sky"
    />
  );
};

// ─── 3. CIDR Calculator ───────────────────────────────────────────────────────

export const CidrCalculator = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ReturnType<typeof parseCidr> | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    try {
      setResult(parseCidr(input.trim()));
      setError('');
    } catch (e: unknown) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Invalid input');
    }
  };

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';
  const btnClass =
    'mt-2 px-4 py-2 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer';

  const rows: [string, string | number][] = result
    ? [
        ['Network Address', result.network],
        ['Broadcast Address', result.broadcast],
        ['Subnet Mask', result.subnetMask],
        ['Wildcard Mask', result.wildcardMask],
        ['Prefix Length', `/${result.prefixLength}`],
        ['Total Hosts', result.totalHosts.toLocaleString()],
        ['Usable Hosts', result.usableHosts.toLocaleString()],
        ['First Usable Host', result.firstHost],
        ['Last Usable Host', result.lastHost],
      ]
    : [];

  return (
    <Panel
      title="CIDR Calculator"
      description="Calculate network details from CIDR notation. Enter an address like [1 192.168.1.0/24 2] to see the network, broadcast, mask, and host range."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <input
            className={inputClass}
            placeholder="e.g. 192.168.1.0/24"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && calculate()}
          />
          <button className={btnClass} onClick={calculate}>Calculate</button>
          {error && <p className="text-red-600 text-sm font-mono">{error}</p>}
          {result && (
            <div className="border border-gray-200 overflow-hidden mt-2">
              <table className="w-full text-sm">
                <tbody>
                  {rows.map(([label, value], i) => (
                    <tr key={label} className={i > 0 ? 'border-t border-gray-200' : ''}>
                      <td className="px-4 py-2 text-gray-400 text-xs font-bold uppercase tracking-wider w-48">{label}</td>
                      <td className="px-4 py-2 text-gray-900 font-mono text-sm">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      }
    />
  );
};

// ─── 4. IPv6 Expander / Compressor ───────────────────────────────────────────

export const Ipv6Tool = () => {
  const queryFrom = useQueryFrom();
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [mode, setMode] = useState<'expand' | 'compress'>('expand');

  useEffect(() => {
    if (queryFrom) setFromValue(queryFrom);
  }, [queryFrom]);

  useEffect(() => {
    if (!fromValue) { setToValue(''); return; }
    try {
      setToValue(mode === 'expand' ? expandIpv6(fromValue) : compressIpv6(fromValue));
    } catch {
      setToValue('Invalid IPv6 address');
    }
  }, [fromValue, mode]);

  const selectEl = (
    <select
      className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
      value={mode}
      onChange={e => {
        setMode(e.target.value as typeof mode);
        setFromValue('');
        setToValue('');
      }}
    >
      <option value="expand">Expand</option>
      <option value="compress">Compress</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="IPv6 Expander / Compressor"
      description="Expand or compress IPv6 addresses. [1 ::1 2] expands to [1 0000:0000:0000:0000:0000:0000:0000:0001 2] and back."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="IPv6 Address"
      toTitle="Result"
      extraElements={selectEl}
      backColor="sky"
    />
  );
};

// ─── 5. URL Parser ────────────────────────────────────────────────────────────

export const UrlParser = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ParsedUrl | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setResult(null); setError(''); return; }
    try {
      setResult(parseUrl(input));
      setError('');
    } catch (e: unknown) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Invalid URL');
    }
  }, [input]);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-900 focus:outline-none font-mono text-sm';

  const fields: [string, string][] = result
    ? [
        ['Protocol', result.protocol],
        ['Hostname', result.hostname],
        ['Port', result.port || '(default)'],
        ['Pathname', result.pathname],
        ['Search', result.search || '(none)'],
        ['Hash', result.hash || '(none)'],
        ['Username', result.username || '(none)'],
        ['Password', result.password || '(none)'],
      ]
    : [];

  return (
    <Panel
      title="URL Parser"
      description="Parse any URL into its components. Enter a URL like [1 https://user:pass@example.com:8080/path?q=1#section 2] to see all parts."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <input
            className={inputClass}
            placeholder="e.g. https://example.com/path?q=hello#section"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm font-mono">{error}</p>}
          {result && (
            <>
              <table className="w-full text-sm">
                <tbody>
                  {fields.map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-200">
                      <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{label}</td>
                      <td className="py-2 text-gray-900 font-mono break-all">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.params.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Query Parameters</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-1 pr-4 text-left text-gray-400 font-normal">Key</th>
                        <th className="py-1 text-left text-gray-400 font-normal">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.params.map((p, i) => (
                        <tr key={i} className="border-b border-gray-200">
                          <td className="py-2 pr-4 text-gray-900 font-mono">{p.key}</td>
                          <td className="py-2 text-gray-900 font-mono break-all">{p.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      }
    />
  );
};
