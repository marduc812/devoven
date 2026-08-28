'use client';
import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { estimateBundle, formatBytes, BundleResult } from './logic';

const impactColor: Record<string, string> = {
  small: 'text-emerald-400',
  medium: 'text-yellow-400',
  large: 'text-orange-400',
  'very-large': 'text-rose-400',
};

function renderOutput(result: BundleResult | null, input: string): string {
  if (!result || !input.trim()) return '';

  const lines: string[] = [];
  lines.push(`=== Bundle Size Estimate ===`);
  lines.push(`Total (minified + gzipped): ${formatBytes(result.totalBytes)}`);
  lines.push(`Impact: ${result.impactLabel}`);
  lines.push(`Packages found: ${result.found} / ${result.found + result.notFound}`);
  lines.push('');
  lines.push('--- Packages ---');
  for (const pkg of result.packages) {
    if (pkg.info) {
      const ts = pkg.info.treeShakeable ? '[tree-shakeable]' : '[not tree-shakeable]';
      lines.push(`${pkg.info.name.padEnd(35)} ${formatBytes(pkg.info.minGzip).padEnd(10)} ${ts}`);
    } else {
      lines.push(`${pkg.name.padEnd(35)} (not in database)`);
    }
  }
  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('--- Warnings ---');
    for (const w of result.warnings) {
      lines.push(`! ${w}`);
    }
  }
  return lines.join('\n');
}

export function BundleSizeEstimator() {
  const [fromValue, setFromValue] = useState('');
  const [result, setResult] = useState<BundleResult | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') ?? '';
      if (from) setFromValue(decodeURIComponent(from));
    }
  }, []);

  useEffect(() => {
    if (fromValue.trim()) {
      setResult(estimateBundle(fromValue));
    } else {
      setResult(null);
    }
  }, [fromValue]);

  const toValue = renderOutput(result, fromValue);

  const extraElements = result ? (
    <div className="flex flex-col gap-3">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-gray-200 bg-gray-50 p-3 text-center">
          <div className="text-gray-500 text-xs mb-1">Total Size</div>
          <div className="font-mono text-emerald-300 font-semibold">{formatBytes(result.totalBytes)}</div>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-3 text-center">
          <div className="text-gray-500 text-xs mb-1">Impact</div>
          <div className={`font-mono text-sm font-semibold ${impactColor[result.impact]}`}>{result.impact}</div>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-3 text-center">
          <div className="text-gray-500 text-xs mb-1">Found</div>
          <div className="font-mono text-emerald-300">{result.found}</div>
        </div>
        <div className="border border-gray-200 bg-gray-50 p-3 text-center">
          <div className="text-gray-500 text-xs mb-1">Not Found</div>
          <div className="font-mono text-gray-400">{result.notFound}</div>
        </div>
      </div>

      {/* Package bars */}
      {result.packages.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {result.packages.map((pkg, i) => {
            if (!pkg.info || pkg.info.minGzip === 0) return null;
            const pct = result.totalBytes > 0 ? (pkg.info.minGzip / result.totalBytes) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="font-mono text-xs text-gray-400 w-40 truncate flex-shrink-0">{pkg.info.name}</span>
                <div className="flex-1 bg-gray-50 rounded-full h-2">
                  <div
                    className="bg-emerald-500/60 h-2 rounded-full"
                    style={{ width: `${Math.max(pct, 1)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-gray-400 w-16 text-right flex-shrink-0">{formatBytes(pkg.info.minGzip)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {result.warnings.map((w, i) => (
            <div key={i} className="bg-yellow-500/10 border border-yellow-500/30 p-3 text-yellow-300 text-xs">
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  ) : <></>;

  return (
    <AdvancedConverter
      title="Bundle Size Estimator"
      description="Estimate the [1 minified + gzipped 2] bundle size of npm packages. Enter one package name per line. Includes 100+ popular packages with tree-shakeable flags and optimization warnings."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Package Names (one per line)"
      toTitle="Size Estimate"
      backColor="lime"
      extraElements={extraElements}
    />
  );
}
