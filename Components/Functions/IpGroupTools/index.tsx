'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { IP_SAMPLE, formatGroupResult, groupIps } from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
const buttonClass = 'px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer';

const PREFIXES = ['off', '30', '29', '28', '27', '26', '25', '24', '20', '16'];

export function GroupIpAddresses() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<'cidr' | 'ranges'>('cidr');
  const [detailed, setDetailed] = useState(false);
  const [floor, setFloor] = useState('off');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    if (params.get('output') === 'ranges') setOutput('ranges');
    if (params.get('detailed') === 'true') setDetailed(true);
    const min = params.get('floor');
    if (min && PREFIXES.includes(min)) setFloor(min);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ output, detailed, floor: floor === 'off' ? null : floor });

  const { text, summary } = useMemo(() => {
    if (!input.trim()) return { text: '', summary: '' };
    try {
      const result = groupIps(input, {
        asRanges: output === 'ranges',
        detailed,
        minPrefix: floor === 'off' ? undefined : Number(floor),
      });
      return {
        text: formatGroupResult(result),
        summary: `${result.inputCount} entries → ${result.blockCount} ${
          output === 'ranges' ? 'ranges' : 'blocks'
        }, ${result.addressCount.toLocaleString()} addresses`,
      };
    } catch (e: unknown) {
      return {
        text: e instanceof Error ? `Error: ${e.message}` : 'Cannot read that list',
        summary: '',
      };
    }
  }, [input, output, detailed, floor]);

  return (
    <AdvancedConverter
      title="Group IP Addresses"
      description="Collapse a list of addresses into the smallest set of CIDR blocks that covers exactly the same addresses and no others. Takes bare addresses, [1 10.0.0.0/24 2], [1 10.0.0.1-10.0.0.9 2] and [1 10.0.0.0 255.255.255.0 2], one per line or comma-separated, and ignores [1 # 2] comments. The floor option widens blocks to a chosen prefix when a shorter rule set matters more than an exact one."
      fromValue={input}
      toValue={text}
      setFromValue={setInput}
      fromTitle="Addresses"
      toTitle={output === 'ranges' ? 'Ranges' : 'CIDR Blocks'}
      backColor="sky"
      extraElements={
        <>
          <div className="flex items-center gap-2">
            <label className={labelClass}>Output</label>
            <select className={selectClass} value={output} onChange={(e) => setOutput(e.target.value as 'cidr' | 'ranges')}>
              <option value="cidr">CIDR blocks</option>
              <option value="ranges">Start-end ranges</option>
            </select>
          </div>
          {output === 'cidr' && (
            <>
              <div className="flex items-center gap-2">
                <label className={labelClass}>Widen to</label>
                <select className={selectClass} value={floor} onChange={(e) => setFloor(e.target.value)}>
                  {PREFIXES.map((p) => (
                    <option key={p} value={p}>{p === 'off' ? 'Exact cover' : `/${p} or wider`}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={detailed} onChange={(e) => setDetailed(e.target.checked)} />
                <span className="text-gray-500 text-xs whitespace-nowrap">Show ranges and sizes</span>
              </label>
            </>
          )}
          <button className={buttonClass} onClick={() => setInput(IP_SAMPLE)}>Load Sample</button>
          {summary && <span className="text-gray-500 text-xs font-mono whitespace-nowrap">{summary}</span>}
          {floor !== 'off' && (
            <span className="text-amber-700 text-xs">Widening covers addresses the list never mentioned.</span>
          )}
        </>
      }
    />
  );
}
