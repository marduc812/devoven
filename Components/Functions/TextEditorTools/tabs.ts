// Tab bookkeeping for the Online Text Editor.
//
// Everything here is a pure function over a Tab[] so the arithmetic that decides
// which tab is open, which one closes, and what a new one is called can be tested
// without a DOM. React state lives in TextEditor.tsx; none of it lives here.

import type { FindOptions } from './logic';
import type { FileHandle } from './fileIO';

export const MAX_TABS = 5;

export const DEFAULT_NAME = 'untitled.txt';

/** Scroll and caret, captured when a tab is switched away from and restored on return. */
export type TabView = { scrollTop: number; selectionStart: number; selectionEnd: number };

/** Find state is per tab: each file remembers what it was searching for. */
export type TabFind = {
  open: boolean;
  showReplace: boolean;
  query: string;
  replacement: string;
  options: FindOptions;
  matchIndex: number;
};

export type Tab = {
  id: string;
  value: string;
  fileName: string;
  handle: FileHandle | null;
  isDirty: boolean;
  view: TabView;
  find: TabFind;
};

export const EMPTY_VIEW: TabView = { scrollTop: 0, selectionStart: 0, selectionEnd: 0 };

export const EMPTY_FIND: TabFind = {
  open: false,
  showReplace: false,
  query: '',
  replacement: '',
  options: {},
  matchIndex: 0,
};

// A counter rather than a random id: the first tab is built during render, which
// also happens on the server, and a random id there would not survive hydration.
let sequence = 0;

export function createTab(init: Partial<Tab> = {}): Tab {
  sequence += 1;
  return {
    id: `tab-${sequence}`,
    value: '',
    fileName: DEFAULT_NAME,
    handle: null,
    isDirty: false,
    view: EMPTY_VIEW,
    find: EMPTY_FIND,
    ...init,
  };
}

export function canAddTab(tabs: Tab[]): boolean {
  return tabs.length < MAX_TABS;
}

export function addTab(tabs: Tab[], tab: Tab): Tab[] {
  return canAddTab(tabs) ? [...tabs, tab] : tabs;
}

export function patchTab(tabs: Tab[], id: string, patch: Partial<Tab>): Tab[] {
  return tabs.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab));
}

export function patchFind(tabs: Tab[], id: string, patch: Partial<TabFind>): Tab[] {
  return tabs.map((tab) => (tab.id === id ? { ...tab, find: { ...tab.find, ...patch } } : tab));
}

export function findTab(tabs: Tab[], id: string): Tab | undefined {
  return tabs.find((tab) => tab.id === id);
}

/**
 * A tab that "New" or "Open" can take over instead of adding another one: an
 * untouched, unnamed, empty buffer. Stops the common land-on-the-page-then-open-a-file
 * path from stranding a blank tab.
 */
export function isReusable(tab: Tab): boolean {
  return !tab.isDirty && tab.value === '' && tab.handle === null && isUntitled(tab.fileName);
}

function isUntitled(name: string): boolean {
  return name === DEFAULT_NAME || /^untitled-\d+\.txt$/.test(name);
}

export type OpenPlan = {
  /** The first incoming file takes over the current tab instead of adding one. */
  reuseActive: boolean;
  accepted: number;
  rejected: number;
};

/**
 * How many of `count` incoming files there is room for, and whether the first one
 * lands in the tab already on screen. Dropping four files onto a blank editor
 * fills the blank tab and opens three more; dropping onto a full one opens none.
 */
export function planOpen(tabs: Tab[], activeId: string, count: number): OpenPlan {
  const active = findTab(tabs, activeId);
  const reusable = active ? isReusable(active) : false;
  const room = Math.max(0, MAX_TABS - tabs.length) + (reusable ? 1 : 0);
  const accepted = Math.max(0, Math.min(count, room));

  return { reuseActive: reusable && accepted > 0, accepted, rejected: Math.max(0, count - accepted) };
}

/** `untitled.txt`, then `untitled-2.txt`, `untitled-3.txt`, … skipping names already open. */
export function nextUntitledName(tabs: Tab[]): string {
  const taken = new Set(tabs.map((tab) => tab.fileName));
  if (!taken.has(DEFAULT_NAME)) return DEFAULT_NAME;

  for (let n = 2; ; n++) {
    const candidate = `untitled-${n}.txt`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Closing never leaves the editor with nothing to edit: closing the last tab
 * replaces it with a fresh empty one. Otherwise focus falls to the left neighbour,
 * and closing a background tab leaves the active one where it is.
 */
export function closeTab(tabs: Tab[], id: string, activeId: string): { tabs: Tab[]; activeId: string } {
  const index = tabs.findIndex((tab) => tab.id === id);
  if (index === -1) return { tabs, activeId };

  if (tabs.length === 1) {
    const replacement = createTab();
    return { tabs: [replacement], activeId: replacement.id };
  }

  const remaining = tabs.filter((tab) => tab.id !== id);
  if (id !== activeId) return { tabs: remaining, activeId };

  return { tabs: remaining, activeId: remaining[Math.max(0, index - 1)].id };
}

export function anyDirty(tabs: Tab[]): boolean {
  return tabs.some((tab) => tab.isDirty);
}
