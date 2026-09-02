'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  SectionTitle,
  StatTile,
  StatusBadge,
} from '@/Components/MainView/MainPanel/ResultUI';
import { generateMagicSquare } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const ORDERS = [3, 4, 5, 6, 7, 8, 9];

export function MagicSquareGenerator() {
  const [order, setOrder] = useState(3);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = parseInt(p.get('from') ?? '', 10);
    if (ORDERS.includes(from)) setOrder(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: order })

  const { result, error } = useMemo(() => {
    try {
      return { result: generateMagicSquare(order), error: '' };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
  }, [order]);

  /** Tab-separated so the grid pastes cleanly into a spreadsheet. */
  const gridText = result ? result.grid.map(row => row.join('\t')).join('\n') : '';

  return (
    <Panel
      title="Magic Square Generator"
      description="Generate magic squares of order [1 3 to 9 2]. Every row, column and both diagonals sum to the magic constant [1 n(n²+1)/2 2]. Uses the Siamese method for odd orders, a diagonal swap for doubly-even, and the LUX method for singly-even."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Order selector */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Order
            </span>
            {ORDERS.map(n => (
              <button
                key={n}
                onClick={() => setOrder(n)}
                className={`px-3 py-2 text-xs font-bold font-mono transition-colors duration-150 cursor-pointer border ${
                  order === n
                    ? 'bg-gray-900 border-gray-900 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
              >
                {n}×{n}
              </button>
            ))}
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <StatTile
                  label="Magic constant"
                  value={result.magicConstant}
                  hint={`${order}(${order * order}+1)/2`}
                />
                <StatTile label="Cells" value={order * order} hint={`values 1 – ${order * order}`} />
                <StatTile
                  label="Valid"
                  value={
                    <StatusBadge tone={result.isValid ? 'pass' : 'fail'}>
                      {result.isValid ? 'yes' : 'no'}
                    </StatusBadge>
                  }
                  hint="all lines match"
                />
                <StatTile label="Method" value={<span className="text-xs">{result.method}</span>} />
              </div>

              {/* Grid with sums in the gutters */}
              <div className="flex flex-col gap-3">
                <SectionTitle note="row sums on the right, column sums below, diagonal sums in the corners">
                  Square
                </SectionTitle>

                <div className="overflow-x-auto">
                  <table className="border-collapse w-fit">
                    <tbody>
                      {result.grid.map((row, r) => (
                        <tr key={r}>
                          {row.map((value, c) => {
                            const onMain = r === c;
                            const onAnti = c === order - 1 - r;
                            return (
                              <td key={c} className="p-0">
                                <div
                                  title={`Row ${r + 1}, column ${c + 1}`}
                                  className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-300 font-mono text-sm ${
                                    onMain && onAnti
                                      ? 'bg-indigo-100 text-indigo-900 font-bold'
                                      : onMain
                                        ? 'bg-emerald-50 text-emerald-800'
                                        : onAnti
                                          ? 'bg-amber-50 text-amber-800'
                                          : 'bg-white text-gray-900'
                                  }`}
                                >
                                  {value}
                                </div>
                              </td>
                            );
                          })}
                          {/* Row sum gutter */}
                          <td className="p-0">
                            <div
                              className={`w-14 h-11 sm:h-12 flex items-center justify-center font-mono text-xs border-l-2 ml-1 ${
                                result.rowSums[r] === result.magicConstant
                                  ? 'border-emerald-300 text-emerald-700'
                                  : 'border-rose-300 text-rose-700 font-bold'
                              }`}
                            >
                              {result.rowSums[r]}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Column sum gutter */}
                      <tr>
                        {result.colSums.map((sum, c) => (
                          <td key={c} className="p-0">
                            <div
                              className={`w-11 sm:w-12 h-10 flex items-center justify-center font-mono text-xs border-t-2 mt-1 ${
                                sum === result.magicConstant
                                  ? 'border-emerald-300 text-emerald-700'
                                  : 'border-rose-300 text-rose-700 font-bold'
                              }`}
                            >
                              {sum}
                            </div>
                          </td>
                        ))}
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-xs text-emerald-800">
                    ↘ main diagonal
                    <span className="font-bold">{result.diagSum1}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 border border-amber-200 bg-amber-50 px-2 py-1 font-mono text-xs text-amber-800">
                    ↗ anti diagonal
                    <span className="font-bold">{result.diagSum2}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 border border-gray-200 px-2 py-1 font-mono text-xs text-gray-600">
                    target
                    <span className="font-bold text-gray-900">{result.magicConstant}</span>
                  </span>
                </div>
              </div>

              {/* Copyable grid */}
              <div className="flex flex-col gap-3">
                <SectionTitle note={<CopyButton text={gridText} label="grid" />}>
                  Grid as text
                </SectionTitle>
                <pre className="border border-gray-200 bg-gray-50 px-3 py-3 overflow-x-auto font-mono text-xs text-gray-700">
                  {gridText}
                </pre>
              </div>
            </>
          )}
        </div>
      }
    />
  );
}
