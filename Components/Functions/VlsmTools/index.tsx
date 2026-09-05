'use client';

import React, { useState, useEffect } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { calculateVlsm } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const DEFAULT_NETWORK = '192.168.1.0/24';
const DEFAULT_HOSTS = '50\n30\n10\n2';

export function VlsmCalculator() {
  const [network, setNetwork] = useState(DEFAULT_NETWORK);
  const [hostsInput, setHostsInput] = useState(DEFAULT_HOSTS);

  useEffect(function() {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setNetwork(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: network })

  const result = network.trim() && hostsInput.trim()
    ? calculateVlsm(network, hostsInput)
    : null;

  const inputClass = 'bg-white backdrop-blur-sm text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-900 focus:outline-none transition-colors duration-200 font-mono text-sm';
  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-900 focus:outline-none transition-colors duration-200 font-mono text-sm resize-none';
  const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-sky-700';
  const rowLabelClass = 'text-gray-500';
  const rowValueClass = 'text-gray-900 font-mono';

  const content = (
    <div className="flex flex-col gap-5">
      {/* Inputs */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Base Network (CIDR)</label>
          <input
            className={inputClass}
            value={network}
            onChange={function(e) { setNetwork(e.target.value); }}
            placeholder="e.g. 192.168.1.0/24"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>Required Hosts (one per line)</label>
          <FileTextArea>
            <textarea
              className={textareaClass}
              rows={5}
              value={hostsInput}
              onChange={function(e) { setHostsInput(e.target.value); }}
              placeholder={'50\n30\n10\n2\nor:\nOffice: 50\nLab: 10'}
            />
          </FileTextArea>
          <span className="text-gray-500 text-xs">Enter number of usable hosts per subnet. Labels are optional (e.g. &quot;Office: 50&quot;).</span>
        </div>
      </div>

      {/* Quick examples */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: '/24 example', net: '10.0.0.0/24', hosts: '100\n50\n20\n5' },
          { label: '/16 example', net: '172.16.0.0/16', hosts: '1000\n500\n200\n50' },
          { label: '/22 example', net: '192.168.0.0/22', hosts: 'HQ: 200\nBranch A: 100\nBranch B: 50\nVoIP: 10' },
        ].map(function(ex) {
          return (
            <button
              key={ex.label}
              onClick={function() { setNetwork(ex.net); setHostsInput(ex.hosts); }}
              className="px-2 py-1 border border-gray-200 text-gray-600 text-xs hover:text-gray-900 hover:border-gray-900 transition-colors duration-150 cursor-pointer"
            >
              {ex.label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {result && result.error && (
        <div className="bg-red-50 border border-red-300 px-4 py-3 text-red-800 text-sm">
          {result.error}
        </div>
      )}

      {/* Results */}
      {result && !result.error && result.subnets.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total Addresses', value: result.totalAddresses.toLocaleString() },
              { label: 'Used', value: result.usedAddresses.toLocaleString() },
              { label: 'Remaining', value: result.remainingAddresses.toLocaleString() },
            ].map(function(s) {
              return (
                <div key={s.label} className="flex flex-col gap-1 px-3 py-2 border border-gray-200 text-center">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{s.label}</span>
                  <span className="text-gray-900 font-mono text-sm font-bold">{s.value}</span>
                </div>
              );
            })}
          </div>

          {/* Subnet table */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>VLSM Subnet Allocation</label>
            <div className="flex flex-col gap-3">
              {result.subnets.map(function(subnet, i) {
                const wasted = subnet.allocatedHosts - subnet.requiredHosts;
                const fillPercent = Math.round((subnet.requiredHosts / subnet.allocatedHosts) * 100);
                return (
                  <div key={i} className="border border-gray-200 px-4 py-4 flex flex-col gap-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-gray-900 text-sm font-bold">{subnet.label}</span>
                      <span className="text-sky-700 text-sm font-mono font-bold">{subnet.networkAddress}</span>
                    </div>

                    {/* Host capacity */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-gray-900">
                          <span className="font-mono font-bold">{subnet.requiredHosts}</span>
                          <span className="text-gray-500"> of </span>
                          <span className="font-mono font-bold">{subnet.allocatedHosts}</span>
                          <span className="text-gray-500"> usable hosts</span>
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono">
                          {wasted === 0 ? 'exact fit' : wasted + ' spare'}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100" aria-hidden="true">
                        <div className="h-full bg-sky-600" style={{ width: fillPercent + '%' }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                      <span className={rowLabelClass}>Subnet Mask</span>
                      <span className={rowValueClass}>{subnet.subnetMask}</span>
                      <span className={rowLabelClass}>Network</span>
                      <span className={rowValueClass}>{subnet.networkAddress.split('/')[0]}</span>
                      <span className={rowLabelClass}>Broadcast</span>
                      <span className={rowValueClass}>{subnet.broadcastAddress}</span>
                      <span className={rowLabelClass}>Usable Range</span>
                      <span className={rowValueClass}>{subnet.addressRange}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!network.trim() && (
        <div className="text-gray-500 text-sm">
          Enter a base network in CIDR notation and the required hosts per subnet to allocate subnets using VLSM.
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="VLSM Calculator"
      description="Variable Length Subnet Masking (VLSM) — divide a network into subnets of different sizes based on host requirements. Enter a base CIDR (e.g. [1 192.168.1.0/24 2]) and a list of required hosts. Subnets are allocated largest-first for efficient address usage."
      backColor="sky"
      extraElements={content}
    />
  );
}
