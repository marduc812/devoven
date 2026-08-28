'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { TX_TYPES, calculateFees, type TxType } from './logic';

export const TxFeeCalculator = () => {
  const [selectedType, setSelectedType] = useState<TxType>('eth-transfer');
  const [customSize, setCustomSize] = useState('');

  const txType = TX_TYPES.find(t => t.id === selectedType)!;
  const size = (selectedType === 'custom-eth' || selectedType === 'custom-btc')
    ? parseInt(customSize || '0', 10)
    : txType.gasOrVbytes;

  let result = null;
  try {
    if (size > 0) result = calculateFees(selectedType, size);
    else if (txType.gasOrVbytes > 0) result = calculateFees(selectedType, txType.gasOrVbytes);
  } catch {
    result = null;
  }

  const inputClass = 'bg-white text-gray-900 border border-gray-200 focus:border-gray-400 focus:outline-none px-3 py-2 text-sm font-mono w-full';
  const btnClass = (active: boolean) =>
    `px-2 py-1 text-xs border transition-colors ${
      active
        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
        : 'border-gray-200 bg-gray-50 text-gray-400 hover:text-gray-200 hover:border-gray-400'
    }`;

  const ethTypes = TX_TYPES.filter(t => t.chain === 'ETH');
  const btcTypes = TX_TYPES.filter(t => t.chain === 'BTC');

  return (
    <Panel
      title="Transaction Fee Calculator"
      description="Estimate [1 Ethereum 2] or [1 Bitcoin 2] transaction fees at various network speeds. Select a common transaction type or enter a custom gas limit / vbyte size."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* ETH types */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Ethereum Transactions</span>
            <div className="flex flex-wrap gap-2">
              {ethTypes.map(t => (
                <button key={t.id} className={btnClass(selectedType === t.id)} onClick={() => setSelectedType(t.id)}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* BTC types */}
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Bitcoin Transactions</span>
            <div className="flex flex-wrap gap-2">
              {btcTypes.map(t => (
                <button key={t.id} className={btnClass(selectedType === t.id)} onClick={() => setSelectedType(t.id)}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom size input */}
          {(selectedType === 'custom-eth' || selectedType === 'custom-btc') && (
            <div className="flex flex-col gap-2">
              <label className="text-gray-400 text-xs">
                {selectedType === 'custom-eth' ? 'Gas Limit' : 'Transaction Size (vbytes)'}
              </label>
              <input
                className={inputClass}
                type="number"
                min="1"
                value={customSize}
                onChange={e => setCustomSize(e.target.value)}
                placeholder={selectedType === 'custom-eth' ? '21000' : '226'}
              />
            </div>
          )}

          {/* Description */}
          <div className="border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-gray-400 text-xs">{txType.description}</p>
            {txType.gasOrVbytes > 0 && (
              <p className="text-gray-300 text-xs mt-1 font-mono">
                Size: {txType.gasOrVbytes.toLocaleString()} {txType.chain === 'ETH' ? 'gas' : 'vbytes'}
              </p>
            )}
          </div>

          {/* Fee table */}
          {result && (
            <>
              <div className="w-full h-px bg-gray-200" />
              <div className="flex flex-col gap-2">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  Fee Estimates — {result.txName} ({result.sizeLabel})
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs border-b border-gray-200">
                        <th className="text-left py-2 pr-4">Speed</th>
                        <th className="text-left py-2 pr-4">Rate</th>
                        <th className="text-left py-2">Estimated Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map(row => (
                        <tr key={row.speed} className="border-b border-gray-200">
                          <td className="py-2 pr-4 text-gray-300">{row.speed}</td>
                          <td className="py-2 pr-4 text-gray-400 font-mono text-xs">{row.rate}</td>
                          <td className="py-2 text-emerald-300 font-mono text-xs">{row.fee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Reference */}
          <div className="w-full h-px bg-gray-200" />
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Common Transaction Sizes</span>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-200">
                    <th className="text-left py-1 pr-4">Type</th>
                    <th className="text-left py-1 pr-4">Chain</th>
                    <th className="text-left py-1">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {TX_TYPES.filter(t => t.id !== 'custom-eth' && t.id !== 'custom-btc').map(t => (
                    <tr key={t.id} className="border-b border-gray-200">
                      <td className="py-1 pr-4 text-gray-300">{t.name}</td>
                      <td className="py-1 pr-4 text-gray-400">{t.chain}</td>
                      <td className="py-1 text-gray-400 font-mono">
                        {t.gasOrVbytes.toLocaleString()} {t.chain === 'ETH' ? 'gas' : 'vbytes'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      }
    />
  );
};
