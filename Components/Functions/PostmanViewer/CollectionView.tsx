'use client';

import React, { useMemo, useState } from 'react';
import { IoFolderOutline } from 'react-icons/io5';
import { StatTile, StatusBadge, inputClass } from '@/Components/MainView/MainPanel/ResultUI';
import { filterGroups, toOverviewText } from './logic';
import RequestRow from './RequestRow';
import type { CollectionView as CollectionViewModel, RequestGroup } from './types';

/** Parent folders stay quiet so the folder the requests actually live in reads first. */
const FolderTrail = ({ folders }: { folders: string[] }) => (
  <span className="flex items-center gap-1.5 min-w-0 text-sm font-bold text-gray-900">
    <IoFolderOutline className="flex-shrink-0 text-gray-400" aria-hidden />
    <span className="break-words min-w-0">
      {folders.map((folder, index) => (
        <React.Fragment key={`${folder}-${index}`}>
          {index > 0 && <span className="text-gray-400 font-normal"> / </span>}
          <span className={index === folders.length - 1 ? '' : 'text-gray-400 font-normal'}>{folder}</span>
        </React.Fragment>
      ))}
    </span>
  </span>
);

const GroupSection = ({ group, reveal }: { group: RequestGroup; reveal: boolean }) => (
  <div className="border border-gray-200">
    <div className="flex flex-wrap items-start justify-between gap-2 bg-gray-50 border-b border-gray-200 px-3 py-2">
      <span className="flex flex-col gap-0.5 min-w-0">
        {group.folders.length > 0 ? (
          <>
            <FolderTrail folders={group.folders} />
            <span className="font-mono text-[11px] text-gray-500 break-all">{group.origin}</span>
          </>
        ) : (
          <span className="font-mono text-sm font-bold text-gray-900 break-all">{group.origin}</span>
        )}
      </span>
      <span className="flex items-center gap-2 flex-shrink-0">
        {!group.resolved && <StatusBadge tone="warn">unresolved</StatusBadge>}
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          {group.requests.length} {group.requests.length === 1 ? 'request' : 'requests'}
        </span>
      </span>
    </div>
    <div>
      {group.requests.map(request => (
        <RequestRow key={request.id} request={request} reveal={reveal} />
      ))}
    </div>
  </div>
);

const CopyOverviewButton = ({ view }: { view: CollectionViewModel }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(toOverviewText(view)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      },
      () => {}
    );
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="px-3 py-2 border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
    >
      {copied ? 'Copied' : 'Copy overview'}
    </button>
  );
};

const CollectionView = ({ view, hasEnvironment }: { view: CollectionViewModel; hasEnvironment: boolean }) => {
  const [query, setQuery] = useState('');
  const [reveal, setReveal] = useState(false);

  const groups = useMemo(() => filterGroups(view.groups, query), [view.groups, query]);
  const shownRequests = groups.reduce((total, group) => total + group.requests.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatTile label="Requests" value={view.stats.requests} />
        <StatTile label="Hosts" value={view.stats.hosts} />
        <StatTile label="Folders" value={view.stats.folders} />
        <StatTile label="Schema" value={view.schemaVersion || 'unknown'} hint={view.name} />
      </div>

      {view.stats.missingVariables.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 px-3 py-2 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
            {view.stats.missingVariables.length} variable
            {view.stats.missingVariables.length === 1 ? '' : 's'} unresolved
          </span>
          <span className="font-mono text-xs text-gray-700 break-all">
            {view.stats.missingVariables.join(', ')}
          </span>
          <span className="text-[11px] text-gray-500">
            {hasEnvironment
              ? 'The loaded environment does not define these.'
              : 'Load the matching environment export to fill these in.'}
          </span>
        </div>
      )}

      {view.stats.circularVariables.length > 0 && (
        <div className="border border-rose-200 bg-rose-50 px-3 py-2 flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700">
            Circular variables
          </span>
          <span className="font-mono text-xs text-gray-700 break-all">
            {view.stats.circularVariables.join(' → ')}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          className={`${inputClass} flex-1 min-w-[12rem]`}
          placeholder="Filter by method, path, name or folder…"
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <CopyOverviewButton view={view} />
        {view.hasSecrets && (
          <button
            type="button"
            onClick={() => setReveal(value => !value)}
            className="px-3 py-2 border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
          >
            {reveal ? 'Hide secrets' : 'Reveal secrets'}
          </button>
        )}
      </div>

      {query && (
        <p className="text-[11px] text-gray-400">
          {shownRequests} of {view.stats.requests} requests match.
        </p>
      )}

      {groups.length === 0 ? (
        <p className="text-sm text-gray-500">No requests match that filter.</p>
      ) : (
        groups.map(group => <GroupSection key={group.id} group={group} reveal={reveal} />)
      )}
    </div>
  );
};

export default CollectionView;
