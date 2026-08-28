'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { calcSubnet, type SubnetCalcResult } from './logic';

export const SubnetCalc = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<SubnetCalcResult | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    try {
      setResult(calcSubnet(input));
      setError('');
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'Invalid input');
    }
  };

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-900 focus:outline-none font-mono text-sm';
  const btnClass =
    'mt-2 px-4 py-2 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors cursor-pointer';

  const rows: [string, string | number][] = result
    ? [
        ['Network Address', result.network],
        ['Broadcast Address', result.broadcast],
        ['Subnet Mask', result.subnetMask],
        ['Wildcard Mask', result.wildcardMask],
        ['Prefix Length', '/' + result.prefixLength],
        ['First Usable Host', result.firstHost],
        ['Last Usable Host', result.lastHost],
        ['Total Hosts', result.totalHosts.toLocaleString()],
        ['Usable Hosts', result.usableHosts.toLocaleString()],
        ['IP Class', result.ipClass],
        ['Binary Mask', result.binaryMask],
      ]
    : [];

  return (
    <Panel
      title="IP Subnet Calculator"
      description="Calculate IPv4 subnet details from CIDR notation. Enter an address like [1 192.168.1.0/24 2] to see network address, broadcast, subnet mask, usable host range, and more."
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
          <button className={btnClass} onClick={calculate}>
            Calculate
          </button>
          {error && <p className="text-red-600 text-sm font-mono">{error}</p>}
          {result && (
            <table className="w-full text-sm mt-2">
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label} className="border-b border-gray-200">
                    <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{label}</td>
                    <td className="py-2 text-gray-900 font-mono break-all">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      }
    />
  );
};
