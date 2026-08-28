'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Panel from '@/Components/MainView/MainPanel/Panel';
import EditorSurface from './EditorSurface';
import FindBar from './FindBar';
import LinesMenu, { type DedupeSettings } from './LinesMenu';
import TabBar from './TabBar';
import { clampEditorHeight } from './editorHeight';
import {
  expandReplacement,
  replaceAll as replaceAllIn,
  type FindOptions,
  type Match,
} from './logic';
import {
  collectText,
  fileCount,
  findAcross,
  firstError,
  flatIndexOf,
  locate,
  matchesFor,
  searchOne,
  step as stepFlat,
  totalCount,
  type FileMatches,
  type Located,
} from './crossFileSearch';
import {
  MAX_TABS,
  addTab,
  canAddTab,
  closeTab,
  createTab,
  findTab,
  isReusable,
  nextUntitledName,
  patchFind,
  patchTab,
  planOpen,
  anyDirty,
  EMPTY_VIEW,
  type Tab,
  type TabFind,
  type TabView,
} from './tabs';
import {
  FileTooLargeError,
  LARGE_FILE_BYTES,
  NotTextFileError,
  collectDrop,
  openFile,
  readDropped,
  saveFileAs,
  saveToHandle,
  supportsFileSystemAccess,
  type DroppedFile,
  type OpenedFile,
} from './fileIO';

const HIGHLIGHT_CAP = 2000;
const SEARCH_DEBOUNCE_MS = 120;
const LINE_HEIGHT_PX = 24; // must match `leading-6` on the editor surface

const buttonClass =
  'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white';

const DEFAULT_DEDUPE: DedupeSettings = { caseInsensitive: false, trim: false, adjacentOnly: false };

const LIMIT_MESSAGE = `Tab limit reached (${MAX_TABS}). Close a tab first.`;

// Counting separators beats slicing and splitting: on a multi-megabyte buffer the
// naive version allocates a copy of everything before the match.
function lineOfOffset(text: string, offset: number): number {
  let line = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text.charCodeAt(i) === 10) line++;
  }
  return line;
}

function scrollTopForMatch(text: string, match: Match, viewportHeight: number): number {
  return Math.max(0, lineOfOffset(text, match.start) * LINE_HEIGHT_PX - viewportHeight / 3);
}

// The two failures a user can act on say which file and why; anything else is a
// browser refusing to hand the file over, which no wording can help with.
function describeOpenError(error: unknown): string {
  return error instanceof FileTooLargeError || error instanceof NotTextFileError
    ? error.message
    : 'Could not open that file.';
}

const TextEditor = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [firstTab] = useState(() => createTab());
  const [tabs, setTabs] = useState<Tab[]>([firstTab]);
  const [activeId, setActiveId] = useState(firstTab.id);

  const active = findTab(tabs, activeId) ?? tabs[0];
  const find = active.find;

  // A safety net for the fallback above: if anything ever leaves activeId pointing
  // at a tab that is gone, put it back on a real one rather than silently editing
  // a different buffer than the strip highlights.
  useEffect(() => {
    if (!findTab(tabs, activeId)) setActiveId(tabs[0].id);
  }, [tabs, activeId]);

  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  // Global rather than per tab: these describe how the editor behaves, not what a
  // particular file was doing.
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wrap, setWrap] = useState(false);
  // Null until the user drags the handle, and kept here rather than in the surface
  // so a tab switch — which remounts the surface — does not snap it back.
  const [editorHeight, setEditorHeight] = useState<number | null>(null);
  const [dedupe, setDedupe] = useState<DedupeSettings>(DEFAULT_DEDUPE);
  const [searchAllTabs, setSearchAllTabs] = useState(false);

  // Resolved after mount rather than during render: the server has no `window`,
  // and branching on it while rendering would desync server and client markup.
  const [canWriteBack, setCanWriteBack] = useState(false);
  useEffect(() => setCanWriteBack(supportsFileSystemAccess()), []);

  // A height that fitted the old window can be taller than the new one.
  useEffect(() => {
    const onResize = () => setEditorHeight((h) => (h === null ? h : clampEditorHeight(h, window.innerHeight)));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ---------- tab state helpers ---------- */

  const patchActive = useCallback(
    (patch: Partial<Tab>) => setTabs((prev) => patchTab(prev, activeId, patch)),
    [activeId]
  );

  const patchActiveFind = useCallback(
    (patch: Partial<TabFind>) => setTabs((prev) => patchFind(prev, activeId, patch)),
    [activeId]
  );

  const readView = useCallback((): TabView | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;
    return {
      scrollTop: textarea.scrollTop,
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    };
  }, []);

  // Every switch saves where the outgoing tab was looking, so returning to it puts
  // the caret and the scroll back. `prepare` lets a cross-tab search jump seed the
  // destination in the same update that reveals it.
  const switchTo = useCallback(
    (id: string, prepare?: (tab: Tab) => Tab) => {
      if (id === activeId && !prepare) return;
      const outgoing = readView();

      setTabs((prev) => {
        const saved = outgoing ? patchTab(prev, activeId, { view: outgoing }) : prev;
        return prepare ? saved.map((tab) => (tab.id === id ? prepare(tab) : tab)) : saved;
      });
      setActiveId(id);
    },
    [activeId, readView]
  );

  // Clicking a tab should leave you ready to type; a search jump must not steal
  // focus from the find field, so only the tab strip sets this.
  const focusPending = useRef(false);
  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    textareaRef.current?.focus();
  }, [activeId]);

  const onSelectTab = useCallback(
    (id: string) => {
      if (id === activeId) return;
      focusPending.current = true;
      switchTo(id);
    },
    [activeId, switchTo]
  );

  /* ---------- editing ---------- */

  // Replacing text through execCommand keeps the browser's native undo stack
  // intact, so Cmd+Z still works after a Replace All or a line operation.
  // Falling back to setState loses undo history but never loses the edit.
  const applyEdit = useCallback(
    (from: number, to: number, text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // execCommand only applies to the focused element, but stealing focus would
      // kick the user out of the find field mid-replace, so it is handed back.
      const previous = document.activeElement as HTMLElement | null;

      textarea.focus();
      textarea.setSelectionRange(from, to);

      let inserted = false;
      try {
        inserted = document.execCommand('insertText', false, text);
      } catch {
        inserted = false;
      }

      if (!inserted) {
        const next = textarea.value.slice(0, from) + text + textarea.value.slice(to);
        patchActive({ value: next, isDirty: true });
      }

      if (previous && previous !== textarea && document.contains(previous)) previous.focus();
    },
    [patchActive]
  );

  const onChange = useCallback(
    (next: string) => patchActive({ value: next, isDirty: true }),
    [patchActive]
  );

  /* ---------- search ---------- */

  // Query and buffer are both debounced, and both are flushed the moment the tab
  // changes. The flush happens during render rather than in an effect because an
  // effect would let one frame paint the previous tab's highlights, and its line
  // heights, over the new tab's text.
  const [debouncedFor, setDebouncedFor] = useState(activeId);
  if (debouncedFor !== activeId) {
    setDebouncedFor(activeId);
    setDebouncedQuery(find.query);
    setDebouncedValue(active.value);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(find.query);
      setDebouncedValue(active.value);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [active.value, find.query]);

  const searchFiles = useCallback(
    (all: boolean, list: Tab[] = tabs) =>
      (all ? list : list.filter((tab) => tab.id === activeId)).map((tab) => ({
        id: tab.id,
        text: tab.id === activeId ? debouncedValue : tab.value,
      })),
    [tabs, activeId, debouncedValue]
  );

  // Background buffers cannot change while you type, so re-searching all of them on
  // every keystroke is pure waste. Each tab's result is kept until its text, the
  // query, or the options actually change — the text check is a pointer comparison
  // for untouched tabs, so a cache hit is O(1) rather than O(file size).
  const cacheRef = useRef(new Map<string, { text: string; key: string; result: FileMatches }>());

  const searchResults = useMemo<FileMatches[]>(() => {
    if (!find.open || !debouncedQuery) return [];

    const key = `${debouncedQuery} ${JSON.stringify(find.options)}`;
    const cache = cacheRef.current;

    const results = searchFiles(searchAllTabs).map((file) => {
      const hit = cache.get(file.id);
      if (hit && hit.key === key && hit.text === file.text) return hit.result;

      const result = searchOne(file, debouncedQuery, find.options);
      cache.set(file.id, { text: file.text, key, result });
      return result;
    });

    for (const id of cache.keys()) {
      if (!tabs.some((tab) => tab.id === id)) cache.delete(id);
    }
    return results;
  }, [find.open, find.options, debouncedQuery, searchAllTabs, searchFiles, tabs]);

  const activeMatches = useMemo(() => matchesFor(searchResults, activeId), [searchResults, activeId]);
  const matchCount = totalCount(searchResults);
  const matchFileCount = fileCount(searchResults);
  const searchError = firstError(searchResults);

  // -1 means "no match in the visible tab". An all-tabs search can legitimately be
  // in that state while other files have results.
  const safeIndex =
    activeMatches.length === 0 ? -1 : Math.min(Math.max(find.matchIndex, 0), activeMatches.length - 1);

  // Only a window of matches is painted. It slides with the current match so that
  // stepping past the cap doesn't lose the marker on the current one.
  const { highlighted, highlightOffset } = useMemo(() => {
    if (activeMatches.length <= HIGHLIGHT_CAP) return { highlighted: activeMatches, highlightOffset: 0 };
    const centre = Math.max(safeIndex, 0);
    const start = Math.min(
      Math.max(0, centre - Math.floor(HIGHLIGHT_CAP / 2)),
      activeMatches.length - HIGHLIGHT_CAP
    );
    return { highlighted: activeMatches.slice(start, start + HIGHLIGHT_CAP), highlightOffset: start };
  }, [activeMatches, safeIndex]);

  const setQuery = useCallback(
    (query: string) => patchActiveFind({ query, matchIndex: 0 }),
    [patchActiveFind]
  );

  const setOptions = useCallback(
    (options: FindOptions) => patchActiveFind({ options, matchIndex: 0 }),
    [patchActiveFind]
  );

  const scrollToMatch = useCallback((match: Match | undefined) => {
    const textarea = textareaRef.current;
    if (!textarea || !match) return;

    const target = lineOfOffset(textarea.value, match.start) * LINE_HEIGHT_PX;
    const viewport = textarea.clientHeight;

    if (target < textarea.scrollTop || target > textarea.scrollTop + viewport - LINE_HEIGHT_PX * 2) {
      // Assigning scrollTop fires a real scroll event, which syncs the other layers.
      textarea.scrollTop = Math.max(0, target - viewport / 3);
    }
  }, []);

  // Landing on a match in another tab: the destination is given the same search and
  // a scroll position pointing at the match, then revealed. Its EditorSurface mounts
  // already scrolled, so there is no jump-then-scroll flash.
  const jumpTo = useCallback(
    (target: Located) => {
      const viewport = textareaRef.current?.clientHeight ?? 0;

      switchTo(target.id, (tab) => ({
        ...tab,
        view: {
          scrollTop: scrollTopForMatch(tab.value, target.match, viewport),
          selectionStart: target.match.start,
          selectionEnd: target.match.end,
        },
        find: {
          ...tab.find,
          open: true,
          showReplace: find.showReplace,
          query: find.query,
          replacement: find.replacement,
          options: find.options,
          matchIndex: target.matchIndex,
        },
      }));
    },
    [switchTo, find.showReplace, find.query, find.replacement, find.options]
  );

  const step = useCallback(
    (delta: number) => {
      if (matchCount === 0) return;

      const current = safeIndex < 0 ? -1 : flatIndexOf(searchResults, activeId, safeIndex);
      const target = locate(searchResults, stepFlat(searchResults, current, delta));
      if (!target) return;

      if (target.id === activeId) {
        patchActiveFind({ matchIndex: target.matchIndex });
        scrollToMatch(target.match);
      } else {
        jumpTo(target);
      }
    },
    [matchCount, safeIndex, searchResults, activeId, patchActiveFind, scrollToMatch, jumpTo]
  );

  // Turning "All" on is a deliberate "look everywhere", so if this tab has nothing
  // it goes straight to where the matches are. Typing never does that — switching
  // tabs under someone mid-keystroke would be maddening.
  const toggleSearchAllTabs = useCallback(() => {
    const next = !searchAllTabs;
    setSearchAllTabs(next);
    if (!next || activeMatches.length > 0 || !debouncedQuery) return;

    const target = locate(findAcross(searchFiles(true), debouncedQuery, find.options), 0);
    if (target && target.id !== activeId) jumpTo(target);
  }, [searchAllTabs, activeMatches.length, debouncedQuery, searchFiles, find.options, activeId, jumpTo]);

  const onReplace = useCallback(() => {
    const match = activeMatches[safeIndex];
    if (!match) return;

    // Offsets come from the debounced buffer. If the live buffer has moved on since
    // (a keystroke inside the debounce window), the offsets no longer describe the
    // same text and applying them would corrupt the edit.
    const matched = active.value.slice(match.start, match.end);
    if (matched !== debouncedValue.slice(match.start, match.end)) return;

    applyEdit(
      match.start,
      match.end,
      expandReplacement(matched, debouncedQuery, find.replacement, find.options)
    );
  }, [activeMatches, safeIndex, active.value, debouncedValue, debouncedQuery, find.replacement, find.options, applyEdit]);

  const onReplaceAll = useCallback(() => {
    if (!debouncedQuery || searchError) return;
    const { replacement, options } = find;

    const targets = searchAllTabs ? tabs : [active];

    let edits: { tab: Tab; result: { text: string; count: number } }[];
    try {
      edits = targets
        .map((tab) => ({ tab, result: replaceAllIn(tab.value, debouncedQuery, replacement, options) }))
        .filter((edit) => edit.result.count > 0);
    } catch {
      // A pattern that searched fine can still be too slow to replace across every
      // open file. Better a message than a half-finished sweep.
      toast.error('Could not replace — try a more specific pattern.');
      return;
    }

    const count = edits.reduce((sum, edit) => sum + edit.result.count, 0);
    if (count === 0) return;

    const matchWord = count === 1 ? 'match' : 'matches';
    const fileWord = edits.length === 1 ? 'file' : 'files';

    // Only the visible tab's edit can go through execCommand, so replacements in
    // background tabs are outside the browser's undo stack. That is worth a prompt.
    if (
      edits.length > 1 &&
      !window.confirm(
        `Replace ${count} ${matchWord} across ${edits.length} ${fileWord}?\n\n` +
          'Changes in the other tabs cannot be undone with Cmd+Z.'
      )
    ) {
      return;
    }

    const here = edits.find((edit) => edit.tab.id === activeId);
    if (here) applyEdit(0, active.value.length, here.result.text);

    const elsewhere = edits.filter((edit) => edit.tab.id !== activeId);
    if (elsewhere.length > 0) {
      setTabs((prev) =>
        prev.map((tab) => {
          const edit = elsewhere.find((candidate) => candidate.tab.id === tab.id);
          return edit ? { ...tab, value: edit.result.text, isDirty: true } : tab;
        })
      );
    }

    toast.success(
      edits.length > 1
        ? `Replaced ${count} ${matchWord} across ${edits.length} ${fileWord}`
        : `Replaced ${count} ${matchWord}`
    );
  }, [debouncedQuery, searchError, find, searchAllTabs, tabs, active, activeId, applyEdit]);

  // Puts the text of every match on the clipboard, one per line — pulling all the
  // IPs or IDs out of a log without hand-selecting them. It reads the results the
  // find bar is already showing rather than searching again, so it copies exactly
  // what the counter beside it says: every tab when All is on, and always against
  // the snapshot those offsets belong to.
  const copyMatches = useCallback(() => {
    const matches = collectText(searchResults, searchFiles(searchAllTabs));
    if (matches.length === 0) return;

    const matchWord = matches.length === 1 ? 'match' : 'matches';

    navigator.clipboard.writeText(matches.join('\n')).then(
      () =>
        toast.success(
          matchFileCount > 1
            ? `Copied ${matches.length} ${matchWord} from ${matchFileCount} files`
            : `Copied ${matches.length} ${matchWord}`
        ),
      () => toast.error('Could not copy to the clipboard.')
    );
  }, [searchResults, searchFiles, searchAllTabs, matchFileCount]);

  const closeFind = useCallback(() => {
    patchActiveFind({ open: false });
    textareaRef.current?.focus();
  }, [patchActiveFind]);

  /* ---------- line operations ---------- */

  // Line operations act on the selection when there is one, otherwise the whole
  // buffer, and land as a single undoable edit either way.
  const runLineOperation = useCallback(
    (operation: (text: string) => string, describe?: (before: string, after: string) => string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;
      const hasSelection = selectionStart !== selectionEnd;
      const from = hasSelection ? selectionStart : 0;
      const to = hasSelection ? selectionEnd : textarea.value.length;

      const before = textarea.value.slice(from, to);
      const after = operation(before);

      if (after === before) {
        toast('Nothing to change');
        return;
      }

      applyEdit(from, to, after);
      if (describe) toast.success(describe(before, after));
    },
    [applyEdit]
  );

  /* ---------- files ---------- */

  const openInNewTab = useCallback(
    (init: Partial<Tab>) => {
      const tab = createTab(init);
      const outgoing = readView();

      setTabs((prev) => addTab(outgoing ? patchTab(prev, activeId, { view: outgoing }) : prev, tab));
      setActiveId(tab.id);
      focusPending.current = true;
    },
    [activeId, readView]
  );

  const doNew = useCallback(() => {
    if (!canAddTab(tabs)) {
      toast(LIMIT_MESSAGE);
      return;
    }
    openInNewTab({ fileName: nextUntitledName(tabs) });
  }, [tabs, openInNewTab]);

  // Shared by the Open button and by drops: an untouched blank tab is taken over
  // rather than left stranded beside the file that was just loaded, and anything
  // past that becomes a tab of its own, up to the limit.
  const showLoaded = useCallback(
    (files: OpenedFile[]) => {
      if (files.length === 0) return;

      const { reuseActive, accepted, rejected } = planOpen(tabs, activeId, files.length);
      if (accepted === 0) {
        toast(LIMIT_MESSAGE);
        return;
      }

      const taken = files.slice(0, accepted);
      if (taken.some((file) => file.text.length > LARGE_FILE_BYTES)) {
        toast('Large file — editing may feel slow.', { icon: '⚠️' });
      }

      const created = taken.slice(reuseActive ? 1 : 0).map((file) =>
        createTab({ value: file.text, fileName: file.name, handle: file.handle, isDirty: false })
      );

      // Where the current tab is looking still matters when it survives the load;
      // when it is being taken over, its view is reset instead.
      const outgoing = reuseActive ? null : readView();

      setTabs((prev) => {
        let next = outgoing ? patchTab(prev, activeId, { view: outgoing }) : prev;

        if (reuseActive) {
          const first = taken[0];
          next = patchTab(next, activeId, {
            value: first.text,
            fileName: first.name,
            handle: first.handle,
            isDirty: false,
            view: EMPTY_VIEW,
          });
        }

        return created.reduce((list, tab) => addTab(list, tab), next);
      });

      // You end up looking at the first file you asked for, whichever tab it went to.
      if (reuseActive) {
        textareaRef.current?.focus();
      } else {
        focusPending.current = true;
        setActiveId(created[0].id);
      }

      if (rejected > 0) {
        toast(`Opened ${accepted} of ${files.length} files — the limit is ${MAX_TABS} tabs.`);
      }
    },
    [tabs, activeId, readView]
  );

  const doOpen = useCallback(async () => {
    // Checked before the picker rather than after: no point opening a dialog for
    // a file that has nowhere to go.
    if (!isReusable(active) && !canAddTab(tabs)) {
      toast(LIMIT_MESSAGE);
      return;
    }

    try {
      const opened = await openFile();
      if (opened) showLoaded([opened]);
    } catch (error) {
      toast.error(describeOpenError(error));
    }
  }, [active, tabs, showLoaded]);

  /* ---------- drag and drop ---------- */

  const [dropping, setDropping] = useState(false);

  // dragenter and dragleave fire again for every child the pointer crosses, so a
  // plain boolean would blink off the moment the cursor reached the textarea.
  const dragDepth = useRef(0);

  const endDrag = useCallback(() => {
    dragDepth.current = 0;
    setDropping(false);
  }, []);

  // A drag that ends somewhere else — dropped on the page, or cancelled with Escape
  // — sends the container no event of its own, which would strand the overlay.
  useEffect(() => {
    if (!dropping) return;
    window.addEventListener('drop', endDrag);
    window.addEventListener('dragend', endDrag);
    return () => {
      window.removeEventListener('drop', endDrag);
      window.removeEventListener('dragend', endDrag);
    };
  }, [dropping, endDrag]);

  const openDropped = useCallback(
    async (dropped: DroppedFile[]) => {
      if (dropped.length === 0) {
        toast.error('Drop a file — folders cannot be opened here.');
        return;
      }

      const results = await Promise.allSettled(dropped.map((entry) => readDropped(entry)));
      const opened = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
      const failed = results.flatMap((result) =>
        result.status === 'rejected' ? [describeOpenError(result.reason)] : []
      );

      // One toast however many failed: a folder of images should not bury the page.
      if (failed.length > 0) {
        toast.error(failed.length === 1 ? failed[0] : `${failed[0]} (and ${failed.length - 1} more)`);
      }

      showLoaded(opened);
    },
    [showLoaded]
  );

  // Only file drags are intercepted. Dragging selected text within the editor is
  // a native textarea move, and taking that over would break it.
  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

  const onDragEnter = useCallback((e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDropping(true);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    // Both the default drag-over and the default drop must be cancelled, or the
    // browser navigates to the file — and the textarea would paste its path.
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (!isFileDrag(e)) return;
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) endDrag();
    },
    [endDrag]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      endDrag();
      // Claimed synchronously — the DataTransfer is dead by the first await.
      void collectDrop(e.dataTransfer).then(openDropped, () => toast.error('Could not read what was dropped.'));
    },
    [endDrag, openDropped]
  );

  const dropPlan = planOpen(tabs, activeId, 1);

  const doSaveAs = useCallback(async () => {
    try {
      const saved = await saveFileAs(active.value, active.fileName);
      if (!saved) return;
      patchActive({ fileName: saved.name, handle: saved.handle, isDirty: false });
      toast.success('Saved');
    } catch {
      toast.error('Could not save that file.');
    }
  }, [active.value, active.fileName, patchActive]);

  const doSave = useCallback(async () => {
    if (!active.handle) {
      await doSaveAs();
      return;
    }
    try {
      await saveToHandle(active.handle, active.value);
      patchActive({ isDirty: false });
      toast.success('Saved');
    } catch {
      toast.error('Could not write to that file. Try "Save as".');
    }
  }, [active.handle, active.value, patchActive, doSaveAs]);

  const doCloseTab = useCallback(
    (id: string) => {
      const tab = findTab(tabs, id);
      if (!tab) return;
      if (tab.isDirty && !window.confirm(`Discard unsaved changes to ${tab.fileName}?`)) return;

      // Only worth saving the view of a tab that survives.
      const outgoing = id === activeId ? null : readView();
      const base = outgoing ? patchTab(tabs, activeId, { view: outgoing }) : tabs;
      const result = closeTab(base, id, activeId);

      setTabs(result.tabs);
      setActiveId(result.activeId);
    },
    [tabs, activeId, readView]
  );

  useEffect(() => {
    if (!anyDirty(tabs)) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [tabs]);

  /* ---------- keybindings ---------- */

  // Scoped to the editor container: Cmd+F elsewhere on the page still reaches the
  // browser's own find.
  const onKeyDown = (e: React.KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    const key = e.key.toLowerCase();

    if (key === 'f' || key === 'h') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const patch: Partial<TabFind> = { open: true };

      if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
        const selected = textarea.value.slice(textarea.selectionStart, textarea.selectionEnd);
        if (!selected.includes('\n')) {
          patch.query = selected;
          patch.matchIndex = 0;
        }
      }
      if (key === 'h') patch.showReplace = true;

      patchActiveFind(patch);
    } else if (key === 's') {
      e.preventDefault();
      void doSave();
    }
  };

  /* ---------- render ---------- */

  // Counted rather than split: this runs on every keystroke, and splitting a large
  // buffer allocates the whole thing again just to read `.length`.
  const lineCount = useMemo(() => {
    if (active.value === '') return 0;
    let count = 1;
    for (let i = 0; i < active.value.length; i++) if (active.value.charCodeAt(i) === 10) count++;
    return count;
  }, [active.value]);

  const editor = (
    <div
      onKeyDown={onKeyDown}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="relative"
    >
      {dropping && (
        // pointer-events-none is load-bearing: an overlay that took the pointer
        // would fire dragleave on the container underneath and flicker itself off.
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none border-2 border-dashed border-rose-400 bg-rose-50 opacity-75">
          <span className="text-sm font-medium text-rose-700">
            {dropPlan.accepted === 0
              ? `Tab limit reached (${MAX_TABS}) — close a tab first`
              : dropPlan.reuseActive
                ? 'Drop text files to open — the first fills this empty tab'
                : 'Drop text files to open them in new tabs'}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button type="button" onClick={doNew} disabled={!canAddTab(tabs)} className={buttonClass}>
          New
        </button>
        <button
          type="button"
          onClick={() => void doOpen()}
          disabled={!isReusable(active) && !canAddTab(tabs)}
          className={buttonClass}
        >
          Open
        </button>
        {canWriteBack && (
          <button type="button" onClick={() => void doSave()} className={buttonClass}>
            Save
          </button>
        )}
        <button type="button" onClick={() => void doSaveAs()} className={buttonClass}>
          Save as
        </button>

        <LinesMenu settings={dedupe} setSettings={setDedupe} run={runLineOperation} />

        <button
          type="button"
          onClick={() => patchActiveFind({ open: true, showReplace: true })}
          className={buttonClass}
        >
          Find &amp; replace
        </button>

        <label className="flex items-center gap-1.5 text-sm text-gray-700 ml-auto">
          <input type="checkbox" checked={showLineNumbers} onChange={(e) => setShowLineNumbers(e.target.checked)} />
          Line numbers
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-700">
          <input type="checkbox" checked={wrap} onChange={(e) => setWrap(e.target.checked)} />
          Wrap
        </label>
      </div>

      <TabBar tabs={tabs} activeId={activeId} onSelect={onSelectTab} onClose={doCloseTab} onNew={doNew} />

      {find.open && (
        <FindBar
          query={find.query}
          setQuery={setQuery}
          replacement={find.replacement}
          setReplacement={(replacement) => patchActiveFind({ replacement })}
          options={find.options}
          setOptions={setOptions}
          showReplace={find.showReplace}
          setShowReplace={(showReplace) => patchActiveFind({ showReplace })}
          searchAllTabs={searchAllTabs}
          toggleSearchAllTabs={toggleSearchAllTabs}
          canSearchAllTabs={tabs.length > 1}
          matchCount={matchCount}
          matchFileCount={matchFileCount}
          visibleMatchCount={activeMatches.length}
          currentMatchIndex={safeIndex}
          highlightCap={HIGHLIGHT_CAP}
          error={searchError}
          onNext={() => step(1)}
          onPrevious={() => step(-1)}
          onReplace={onReplace}
          onReplaceAll={onReplaceAll}
          onCopyMatches={copyMatches}
          onClose={closeFind}
        />
      )}

      {/* Keyed by tab: a shared textarea would let Cmd+Z undo one tab's edits into
          another, because the browser's undo stack belongs to the element. */}
      <EditorSurface
        key={activeId}
        value={active.value}
        highlightText={debouncedValue}
        onChange={onChange}
        matches={highlighted}
        currentMatchIndex={safeIndex < 0 ? -1 : safeIndex - highlightOffset}
        showLineNumbers={showLineNumbers}
        wrap={wrap}
        textareaRef={textareaRef}
        initialView={active.view}
        height={editorHeight}
        onHeightChange={setEditorHeight}
      />

      <div className="flex flex-wrap gap-x-4 mt-2 text-xs text-gray-500">
        <span>{lineCount.toLocaleString()} lines</span>
        <span>{active.value.length.toLocaleString()} characters</span>
        <span className="ml-auto">
          Files are read in your browser and never uploaded.
          {!canWriteBack && ' Your browser cannot write back to disk, so "Save as" downloads a copy.'}
        </span>
      </div>
    </div>
  );

  return (
    <Panel
      title="Online Text Editor"
      description={`Edit up to ${MAX_TABS} files at once in your browser, with find and replace, regular expressions, and line tools. Press [1 Cmd/Ctrl+F 2] inside the editor to search, or drop files straight onto it to open them in tabs — nothing is uploaded.`}
      backColor="rose"
      extraElements={editor}
    />
  );
};

export default TextEditor;
