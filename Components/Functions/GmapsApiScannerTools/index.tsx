'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';

type CheckResult = {
  name: string;
  status: 'vulnerable' | 'restricted' | 'rejected' | 'error';
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
  rejected: {
    badge: 'border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400',
    label: 'Rejected',
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
  const rejectedCount = results?.filter((r) => r.status === 'rejected').length ?? 0;

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
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{rejectedCount} Rejected</span>
            </div>
          </div>

          {/* A bare 403 used to be printed as a green Restricted, which reads as
              "this key is safe". It is not the same claim. */}
          {rejectedCount > 0 && (
            <div className="border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-amber-800 dark:text-amber-300 text-sm">
              <span className="font-bold uppercase tracking-wider text-xs">Rejected is not the same as safe.</span>{' '}
              Google refused these calls without saying why. A key locked to an HTTP
              referrer, a key whose API is switched off, and a key that is simply over
              quota all look identical from here. This scan sends no Referer header, so
              referrer restrictions are never tested, and anyone holding a leaked key can
              forge that header anyway.
            </div>
          )}

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
      description="Check if a Google API key is [1 misconfigured 2] or has [1 unrestricted access 2] to billable Google Maps APIs. Tests 19 APIs including Maps, Places, Roads, and more. Unlike most tools here, this one needs the server: the key is sent to DevOven, which queries Google on your behalf. It is never logged or stored. Based on the gmapsapiscanner project."
      extraElements={content}
      backColor="lime"
    />
  );
};
