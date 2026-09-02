'use client';

import React, { useEffect, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { generateSubnetList, type SubnetListResult } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const SubnetListGenerator = () => {
  const [cidr, setCidr] = useState('');
  const [splitPrefix, setSplitPrefix] = useState('');
  const [result, setResult] = useState<SubnetListResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setCidr(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: cidr })

  const calculate = () => {
    setError('');
    setResult(null);
    try {
      const prefix = parseInt(splitPrefix, 10);
      if (!cidr.trim()) throw new Error('Enter a CIDR block (e.g. 192.168.1.0/24)');
      if (isNaN(prefix)) throw new Error('Enter a valid split prefix length (e.g. 26)');
      setResult(generateSubnetList(cidr.trim(), prefix));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
    }
  };

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-900 focus:outline-none font-mono text-sm';
  const btnClass =
    'mt-2 px-4 py-2 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer';

  return (
    <Panel
      title="Subnet List Generator"
      description="Split a CIDR block into subnets of a given prefix size. Enter [1 192.168.1.0/24 2] and split into [1 /26 2] to see all subnets with network, broadcast, and host ranges."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">CIDR Block</label>
            <input
              className={inputClass}
              placeholder="e.g. 192.168.1.0/24"
              value={cidr}
              onChange={e => setCidr(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calculate()}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Split Into Prefix (e.g. 26)</label>
            <input
              className={inputClass}
              placeholder="e.g. 26"
              value={splitPrefix}
              onChange={e => setSplitPrefix(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && calculate()}
            />
          </div>
          <button className={btnClass} onClick={calculate}>Generate Subnets</button>
          {error && <p className="text-red-600 text-sm font-mono">{error}</p>}
          {result && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-row gap-4 flex-wrap text-sm">
                <span className="text-gray-400">Original: <span className="text-sky-300 font-mono">{result.originalCidr}</span></span>
                <span className="text-gray-400">Split into: <span className="text-sky-300 font-mono">/{result.splitPrefix}</span></span>
                <span className="text-gray-400">Subnets: <span className="text-sky-300 font-mono">{result.subnetCount}</span></span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="py-2 pr-4 text-left text-gray-400 font-normal whitespace-nowrap">#</th>
                      <th className="py-2 pr-4 text-left text-gray-400 font-normal whitespace-nowrap">Network</th>
                      <th className="py-2 pr-4 text-left text-gray-400 font-normal whitespace-nowrap">Broadcast</th>
                      <th className="py-2 pr-4 text-left text-gray-400 font-normal whitespace-nowrap">First Host</th>
                      <th className="py-2 pr-4 text-left text-gray-400 font-normal whitespace-nowrap">Last Host</th>
                      <th className="py-2 text-left text-gray-400 font-normal whitespace-nowrap">Usable Hosts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.subnets.map(s => (
                      <tr key={s.index} className="border-b border-gray-200">
                        <td className="py-2 pr-4 text-gray-500 font-mono">{s.index}</td>
                        <td className="py-2 pr-4 text-sky-300 font-mono">{s.network}</td>
                        <td className="py-2 pr-4 text-gray-900 font-mono">{s.broadcast}</td>
                        <td className="py-2 pr-4 text-gray-900 font-mono">{s.firstHost}</td>
                        <td className="py-2 pr-4 text-gray-900 font-mono">{s.lastHost}</td>
                        <td className="py-2 text-gray-900 font-mono">{s.usableHosts.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};
