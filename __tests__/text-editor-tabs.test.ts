import {
  MAX_TABS,
  DEFAULT_NAME,
  createTab,
  canAddTab,
  addTab,
  patchTab,
  patchFind,
  findTab,
  isReusable,
  nextUntitledName,
  planOpen,
  closeTab,
  anyDirty,
  type Tab,
} from '@/Components/Functions/TextEditorTools/tabs';

const fill = (count: number, init: Partial<Tab> = {}) =>
  Array.from({ length: count }, () => createTab(init));

describe('createTab', () => {
  it('starts empty, untitled and clean', () => {
    const tab = createTab();
    expect(tab.value).toBe('');
    expect(tab.fileName).toBe(DEFAULT_NAME);
    expect(tab.handle).toBeNull();
    expect(tab.isDirty).toBe(false);
  });

  it('gives every tab a distinct id', () => {
    const ids = fill(10).map((tab) => tab.id);
    expect(new Set(ids).size).toBe(10);
  });

  it('accepts overrides', () => {
    expect(createTab({ value: 'hi', fileName: 'notes.md' })).toMatchObject({
      value: 'hi',
      fileName: 'notes.md',
    });
  });
});

describe('addTab', () => {
  it('appends below the limit', () => {
    expect(addTab(fill(2), createTab())).toHaveLength(3);
  });

  it('refuses to go past the limit and leaves the list untouched', () => {
    const tabs = fill(MAX_TABS);
    expect(addTab(tabs, createTab())).toBe(tabs);
  });

  it('agrees with canAddTab at the boundary', () => {
    expect(canAddTab(fill(MAX_TABS - 1))).toBe(true);
    expect(canAddTab(fill(MAX_TABS))).toBe(false);
  });
});

describe('patchTab', () => {
  it('changes only the named tab', () => {
    const tabs = fill(3);
    const patched = patchTab(tabs, tabs[1].id, { value: 'edited', isDirty: true });

    expect(findTab(patched, tabs[1].id)).toMatchObject({ value: 'edited', isDirty: true });
    expect(findTab(patched, tabs[0].id)?.value).toBe('');
    expect(findTab(patched, tabs[2].id)?.value).toBe('');
  });

  it('leaves untouched tabs referentially equal so they can be cached', () => {
    const tabs = fill(3);
    const patched = patchTab(tabs, tabs[1].id, { value: 'edited' });
    expect(patched[0]).toBe(tabs[0]);
    expect(patched[2]).toBe(tabs[2]);
  });

  it('ignores an unknown id', () => {
    const tabs = fill(2);
    expect(patchTab(tabs, 'nope', { value: 'x' })).toEqual(tabs);
  });
});

describe('patchFind', () => {
  it('merges into find state without dropping the rest', () => {
    const tabs = fill(1);
    const patched = patchFind(tabs, tabs[0].id, { query: 'foo', open: true });

    expect(patched[0].find).toMatchObject({ query: 'foo', open: true, replacement: '', matchIndex: 0 });
  });

  it('keeps each tab searching for its own thing', () => {
    const tabs = fill(2);
    const patched = patchFind(tabs, tabs[0].id, { query: 'foo' });
    expect(patched[1].find.query).toBe('');
  });
});

describe('nextUntitledName', () => {
  it('uses the plain name when it is free', () => {
    expect(nextUntitledName([])).toBe(DEFAULT_NAME);
    expect(nextUntitledName(fill(1, { fileName: 'notes.txt' }))).toBe(DEFAULT_NAME);
  });

  it('numbers from 2 once the plain name is taken', () => {
    expect(nextUntitledName(fill(1))).toBe('untitled-2.txt');
  });

  it('skips over names already in use', () => {
    const tabs = [
      createTab(),
      createTab({ fileName: 'untitled-2.txt' }),
      createTab({ fileName: 'untitled-3.txt' }),
    ];
    expect(nextUntitledName(tabs)).toBe('untitled-4.txt');
  });

  it('fills a gap left by a closed tab', () => {
    const tabs = [createTab(), createTab({ fileName: 'untitled-3.txt' })];
    expect(nextUntitledName(tabs)).toBe('untitled-2.txt');
  });
});

describe('isReusable', () => {
  it('accepts a pristine untitled buffer', () => {
    expect(isReusable(createTab())).toBe(true);
    expect(isReusable(createTab({ fileName: 'untitled-4.txt' }))).toBe(true);
  });

  it('rejects anything with content, a name, a file, or unsaved edits', () => {
    expect(isReusable(createTab({ value: 'x' }))).toBe(false);
    expect(isReusable(createTab({ fileName: 'notes.md' }))).toBe(false);
    expect(isReusable(createTab({ isDirty: true }))).toBe(false);
    expect(isReusable(createTab({ handle: { name: 'a.txt' } as never }))).toBe(false);
  });
});

describe('closeTab', () => {
  it('replaces the last tab with a fresh empty one rather than leaving none', () => {
    const tabs = fill(1, { value: 'text', fileName: 'notes.md', isDirty: true });
    const result = closeTab(tabs, tabs[0].id, tabs[0].id);

    expect(result.tabs).toHaveLength(1);
    expect(result.tabs[0].id).not.toBe(tabs[0].id);
    expect(result.tabs[0]).toMatchObject({ value: '', fileName: DEFAULT_NAME, isDirty: false });
    expect(result.activeId).toBe(result.tabs[0].id);
  });

  it('moves focus to the left neighbour when the active tab closes', () => {
    const tabs = fill(3);
    expect(closeTab(tabs, tabs[1].id, tabs[1].id).activeId).toBe(tabs[0].id);
  });

  it('falls back to the new first tab when the leftmost closes', () => {
    const tabs = fill(3);
    const result = closeTab(tabs, tabs[0].id, tabs[0].id);
    expect(result.activeId).toBe(tabs[1].id);
    expect(result.tabs).toHaveLength(2);
  });

  it('leaves the active tab alone when a background tab closes', () => {
    const tabs = fill(3);
    const result = closeTab(tabs, tabs[2].id, tabs[0].id);
    expect(result.activeId).toBe(tabs[0].id);
    expect(result.tabs.map((tab) => tab.id)).toEqual([tabs[0].id, tabs[1].id]);
  });

  it('ignores an unknown id', () => {
    const tabs = fill(2);
    const result = closeTab(tabs, 'nope', tabs[0].id);
    expect(result.tabs).toBe(tabs);
    expect(result.activeId).toBe(tabs[0].id);
  });
});

describe('anyDirty', () => {
  it('is true when any single tab has unsaved changes', () => {
    expect(anyDirty(fill(3))).toBe(false);
    expect(anyDirty([...fill(2), createTab({ isDirty: true })])).toBe(true);
  });
});

describe('planOpen', () => {
  it('takes over an untouched blank tab instead of opening beside it', () => {
    const tabs = fill(1);
    expect(planOpen(tabs, tabs[0].id, 1)).toEqual({ reuseActive: true, accepted: 1, rejected: 0 });
  });

  it('opens a new tab when the current one holds something', () => {
    const tabs = [createTab({ value: 'work in progress', isDirty: true })];
    expect(planOpen(tabs, tabs[0].id, 1)).toEqual({ reuseActive: false, accepted: 1, rejected: 0 });
  });

  it('fills the blank tab first, then spends the free slots', () => {
    const tabs = fill(1);
    expect(planOpen(tabs, tabs[0].id, 5)).toEqual({ reuseActive: true, accepted: 5, rejected: 0 });
  });

  it('accepts what fits and reports the rest', () => {
    const tabs = fill(3, { value: 'x' });
    expect(planOpen(tabs, tabs[0].id, 4)).toEqual({ reuseActive: false, accepted: 2, rejected: 2 });
  });

  it('accepts nothing once every tab is taken', () => {
    const tabs = fill(MAX_TABS, { value: 'x' });
    expect(planOpen(tabs, tabs[0].id, 2)).toEqual({ reuseActive: false, accepted: 0, rejected: 2 });
  });

  it('still uses the blank active tab when the strip is otherwise full', () => {
    const tabs = [createTab(), ...fill(MAX_TABS - 1, { value: 'x' })];
    expect(planOpen(tabs, tabs[0].id, 3)).toEqual({ reuseActive: true, accepted: 1, rejected: 2 });
  });

  it('never claims to reuse a tab when nothing is coming in', () => {
    const tabs = fill(1);
    expect(planOpen(tabs, tabs[0].id, 0)).toEqual({ reuseActive: false, accepted: 0, rejected: 0 });
  });

  it('treats a missing active tab as nothing to reuse', () => {
    const tabs = fill(2, { value: 'x' });
    expect(planOpen(tabs, 'gone', 1)).toEqual({ reuseActive: false, accepted: 1, rejected: 0 });
  });
});
