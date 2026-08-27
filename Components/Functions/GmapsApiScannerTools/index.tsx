'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';

type CheckResult = {
  name: string;
  status: 'vulnerable' | 'restricted' | 'error';
  detail: string;
};

const statusStyles: Record<CheckResult['status'], { badge: string; label: string }> = {
  vulnerable: {
    badge: 'border border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950 dark:text-red-400',
    label: 'Vulnerable',
  },
  restricted: {
    badge: 'border border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-400',
    label: 'Restricted',
  },
  error: {
    badge: 'border border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400',
    label: 'Error',
  },
};

const inputClass = 'w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 placeholder-gray-400 dark:placeholder-gray-600';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1';

export const GmapsApiScanner = () => {
  const [apiKey, setApiKey] = useState('');
  const [results, setResults] = useState<CheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runScan = async () => {
    if (!apiKey.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch('/api/gmaps-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Scan failed');
        return;
      }

      setResults(data);
    } catch {
      setError('Failed to connect to the scan API');
    } finally {
      setLoading(false);
    }
  };

  const vulnerableCount = results?.filter((r) => r.status === 'vulnerable').length ?? 0;
  const restrictedCount = results?.filter((r) => r.status === 'restricted').length ?? 0;

  const content = (
    <div className="flex flex-col gap-5">
      <div>
        <label className={labelClass}>Google API Key</label>
        <div className="flex gap-2">
          <input
            type="text"
            className={inputClass}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            autoComplete="off"
            spellCheck={false}
            onKeyDown={(e) => e.key === 'Enter' && runScan()}
          />
          <button
            onClick={runScan}
            disabled={loading || !apiKey.trim()}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold uppercase tracking-wider hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? 'Scanning…' : 'Scan'}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 px-4 py-3 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
          Checking {19} Google APIs… This may take a few seconds.
        </div>
      )}

      {results && (
        <>
          <div className="flex gap-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{vulnerableCount} Vulnerable</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{restrictedCount} Restricted</span>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">API</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hidden sm:table-cell">Detail</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => {
                  const style = statusStyles[r.status];
                  return (
                    <tr key={r.name} className={i > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100 font-medium">{r.name}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${style.badge}`}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs font-mono truncate max-w-xs hidden sm:table-cell">
                        {r.detail}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!results && !loading && !error && (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
          Enter a Google API key to scan which APIs it has access to.
        </p>
      )}
    </div>
  );

  return (
    <Panel
      title="Google Maps API Scanner"
      description="Check if a Google API key is [1 misconfigured 2] or has [1 unrestricted access 2] to billable Google Maps APIs. Tests 19 APIs including Maps, Places, Roads, and more. Unlike most tools here this one is [1 not client-side 2] and needs an internet connection: the key is sent to our server, which queries Google on your behalf. Keys are [1 never logged or stored 2]. Based on the gmapsapiscanner project."
      extraElements={content}
      backColor="lime"
    />
  );
};
