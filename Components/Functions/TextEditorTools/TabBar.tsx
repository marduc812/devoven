'use client';

import React from 'react';
import { MAX_TABS, canAddTab, type Tab } from './tabs';

type Props = {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
};

const TabBar = ({ tabs, activeId, onSelect, onClose, onNew }: Props) => {
  const full = !canAddTab(tabs);

  return (
    <div
      role="tablist"
      aria-label="Open files"
      className="flex items-stretch gap-1 border border-gray-300 border-b-0 bg-gray-50 px-2 py-2 overflow-x-auto"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          // Two sibling buttons rather than a close button nested inside the tab
          // button, which would not be valid HTML.
          <div
            key={tab.id}
            className={`flex items-center border text-sm font-mono whitespace-nowrap ${
              active ? 'border-gray-900 bg-white text-gray-900' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              title={tab.fileName}
              onClick={() => onSelect(tab.id)}
              className="flex items-center gap-1.5 pl-2 pr-1 py-1 max-w-[12rem]"
            >
              <span className="truncate">{tab.fileName}</span>
              {tab.isDirty && (
                <span aria-label="Unsaved changes" title="Unsaved changes">
                  •
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onClose(tab.id)}
              title={`Close ${tab.fileName}`}
              aria-label={`Close ${tab.fileName}`}
              className="px-1.5 py-1 text-gray-400 hover:text-gray-900"
            >
              ✕
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={onNew}
        disabled={full}
        title={full ? `Tab limit reached (${MAX_TABS}). Close a tab first.` : 'New tab'}
        className="border border-gray-300 bg-white text-gray-900 px-2.5 py-1 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white"
      >
        +
      </button>
    </div>
  );
};

export default TabBar;
