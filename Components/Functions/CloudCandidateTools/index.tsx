'use client';

import { useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { buildAzureContainerUrl, generateAzureContainerCandidates } from './logic';

export function CloudCandidateTools() {
  const [seed, setSeed] = useState('contoso.com');
  const [account, setAccount] = useState('contosostorage');
  const [error, setError] = useState('');
  const candidates = useMemo(() => {
    try {
      setError('');
      return generateAzureContainerCandidates(seed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid input');
      return [];
    }
  }, [seed]);

  const rows = candidates.map((name) => {
    try {
      return { name, url: buildAzureContainerUrl(account, name) };
    } catch {
      return { name, url: '' };
    }
  });

  const downloadLinks = () => {
    const links = rows.map(({ url }) => url).filter(Boolean);
    if (links.length === 0) return;

    const blob = new Blob([links.join('\n')], { type: 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'azure-blob-candidate-links.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <Panel
      title="Azure Blob Candidate Generator"
      description="Generate a small local list of plausible Azure Blob container names from a project or company name. This tool does not send requests or check whether any resource exists."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <label className="text-sm text-gray-700">
            Company, project, or domain
            <input className="mt-1 w-full border border-gray-200 p-3 font-mono text-sm" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="example.com" />
          </label>
          <label className="text-sm text-gray-700">
            Azure storage account (for URL preview)
            <input className="mt-1 w-full border border-gray-200 p-3 font-mono text-sm" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="storageaccount" />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-xs text-gray-500">{candidates.length} candidates generated locally. No network traffic is made.</p>
          <button
            className="w-fit border border-gray-900 bg-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            onClick={downloadLinks}
            disabled={rows.every(({ url }) => !url)}
          >
            Download links (.txt)
          </button>
          <div className="max-h-96 overflow-auto border border-gray-200 bg-white">
            {rows.map(({ name, url }) => (
              <div key={name} className="flex flex-col gap-1 border-b border-gray-100 p-3 font-mono text-xs sm:flex-row sm:justify-between">
                <span>{name}</span>
                {url && <a className="break-all text-blue-700 underline" href={url} target="_blank" rel="noreferrer">{url}</a>}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">Only check resources you own or are authorized to assess. Candidate names are guesses and do not indicate that a container exists or is public.</p>
        </div>
      }
    />
  );
}
