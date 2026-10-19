/** @jest-environment jsdom */

import { act, createElement, createRef, type ComponentProps, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import EditorSurface from '@/Components/Functions/TextEditorTools/EditorSurface';
import TextEditor from '@/Components/Functions/TextEditorTools/TextEditor';
import { findMatches } from '@/Components/Functions/TextEditorTools/logic';

jest.mock('../Components/MainView/MainPanel/Panel', () => ({
  __esModule: true,
  default: ({ extraElements }: { extraElements: ReactNode }) => extraElements,
}));
jest.mock('../lib/regex/spawn', () => ({ spawnRegexWorker: jest.fn() }));

type Props = ComponentProps<typeof EditorSurface>;
let container: HTMLDivElement;
let root: Root;
let props: Props;
const originalHighlight = Object.getOwnPropertyDescriptor(globalThis, 'Highlight');
const originalCSS = Object.getOwnPropertyDescriptor(globalThis, 'CSS');
const originalResizeObserver = Object.getOwnPropertyDescriptor(globalThis, 'ResizeObserver');
const originalRangeRect = Object.getOwnPropertyDescriptor(Range.prototype, 'getBoundingClientRect');

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  Object.defineProperty(globalThis, 'Highlight', { configurable: true, value: undefined });
  Object.defineProperty(globalThis, 'ResizeObserver', {
    configurable: true,
    value: class { observe() {} disconnect() {} },
  });
  jest.spyOn(HTMLTextAreaElement.prototype, 'clientWidth', 'get').mockReturnValue(720);
  jest.spyOn(HTMLTextAreaElement.prototype, 'clientHeight', 'get').mockReturnValue(240);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  props = {
    value: '', highlightText: '', matches: [], currentMatchIndex: -1,
    onChange: jest.fn(), showLineNumbers: true, wrap: false,
    textareaRef: createRef<HTMLTextAreaElement>(), height: 240, onHeightChange: jest.fn(),
  };
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  jest.restoreAllMocks();
  jest.useRealTimers();
  for (const [name, descriptor] of [
    ['Highlight', originalHighlight], ['CSS', originalCSS], ['ResizeObserver', originalResizeObserver],
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  if (originalRangeRect) Object.defineProperty(Range.prototype, 'getBoundingClientRect', originalRangeRect);
  else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
});

async function render(patch: Partial<Props>) {
  props = { ...props, ...patch };
  await act(async () => root.render(createElement(EditorSurface, props)));
}
const input = () => container.querySelector('textarea')!;
const viewport = () => input().previousElementSibling as HTMLDivElement;
const content = () => viewport().firstElementChild as HTMLDivElement;

function enableNativeHighlights() {
  class TestHighlight extends Set<AbstractRange> { priority = 0; }
  const highlights = new Map<string, TestHighlight>();
  Object.defineProperty(globalThis, 'Highlight', { configurable: true, value: TestHighlight });
  Object.defineProperty(globalThis, 'CSS', { configurable: true, value: { highlights } });
  return highlights;
}

it.each([false, true])('paints the photo\'s regex on the visible text, including blank lines and a trailing newline, wrap=%s', async (wrap) => {
  const value = 'sx9000082139]\n\nsx9000092086_[sx9000092086]\n\nsx9000115412\n';
  const matches = findMatches(value, 'sx.*\\s?', { regex: true });
  await render({ value, highlightText: value, matches, currentMatchIndex: 0, wrap });
  expect(input().value).toBe(value);
  expect(content().textContent).toBe(value + '\u200b');
  const marks = content().querySelectorAll('span');
  expect(Array.from(marks, (mark) => mark.textContent)).toEqual(
    matches.map((match) => value.slice(match.start, match.end)),
  );
  expect(marks[0].className).toBe('text-editor-current');
  expect(marks[1].className).toBe('text-editor-match');
});

it('shows live text without stale ranges while the worker catches up', async () => {
  const value = 'first target';
  const matches = findMatches(value, 'target');
  await render({ value, highlightText: value, matches, currentMatchIndex: 0 });
  expect(content().querySelector('span')?.textContent).toBe('target');
  await render({ value: 'inserted\nfirst target' });
  expect(content().textContent).toBe('inserted\nfirst target\u200b');
  expect(content().querySelector('span')).toBeNull();
  const next = props.value;
  await render({ highlightText: next, matches: findMatches(next, 'target') });
  expect(content().querySelector('span')?.textContent).toBe('target');
});

it('moves the mirror and gutter with the input without a second scroll clamp', async () => {
  await render({ value: 'wide\ntext\n', highlightText: 'wide\ntext\n' });
  await act(async () => {
    input().scrollTop = 96;
    input().scrollLeft = 800;
    input().dispatchEvent(new Event('scroll', { bubbles: true }));
  });
  expect(viewport().style.width).toBe('720px');
  expect(viewport().style.height).toBe('240px');
  expect(content().style.transform).toBe('translate(-800px, -96px)');
  const gutter = container.querySelector('.text-right')!;
  expect((gutter.firstElementChild as HTMLElement).style.transform).toBe('translateY(-96px)');
});

it('decorates every result past 2,000 without adding a DOM node for each match', async () => {
  const highlights = enableNativeHighlights();
  const value = 'target\n'.repeat(3001);
  const matches = findMatches(value, 'target');
  await render({ value, highlightText: value, matches, currentMatchIndex: 0 });
  const all = highlights.get('text-editor-matches')!;
  expect(all.size).toBe(3001);
  expect(content().querySelectorAll('span')).toHaveLength(0);
  expect(Array.from(all).every((range) => range.toString() === 'target')).toBe(true);

  await render({ currentMatchIndex: 3000 });
  expect(highlights.get('text-editor-matches')).toBe(all);
  const current = highlights.get('text-editor-current')!;
  expect(current.size).toBe(1);
  expect(current.priority).toBeGreaterThan(all.priority);
  expect(Array.from(current)[0]).toBe(Array.from(all)[3000]);

  await render({ matches: [], currentMatchIndex: -1 });
  expect(highlights.get('text-editor-matches')?.size).toBe(0);
  expect(highlights.get('text-editor-current')?.size).toBe(0);
  await act(async () => root.unmount());
  expect(highlights.size).toBe(0);
});

it('keeps native range offsets correct for CRLF, Unicode, tabs, and multiline matches', async () => {
  const highlights = enableNativeHighlights();
  const value = '😀\tbefore\r\ntarget\r\nnext\r\n';
  const matches = findMatches(value, 'target\\s+next', { regex: true });
  await render({ value, highlightText: value, matches, currentMatchIndex: 0 });
  const range = Array.from(highlights.get('text-editor-current')!)[0];
  expect(range.toString()).toBe('target\r\nnext');
  expect(content().textContent).toBe(value + '\u200b');
});

it('reveals the measured wrapped row and horizontal position without taking focus', async () => {
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: 900, bottom: 916, left: 1200, right: 1242, width: 42, height: 16 }),
  });
  const find = document.createElement('input');
  document.body.appendChild(find);
  find.focus();
  const value = 'long content before target';
  await render({
    value, highlightText: value, matches: findMatches(value, 'target'),
    currentMatchIndex: 0, wrap: true, showLineNumbers: false,
  });
  expect(input().scrollTop).toBe(808);
  expect(input().scrollLeft).toBe(948);
  expect(document.activeElement).toBe(find);
  expect(content().style.transform).toBe('translate(-948px, -808px)');
  find.remove();
});

it('passes all worker results through the editor and clears decorations when find closes', async () => {
  jest.useFakeTimers();
  const highlights = enableNativeHighlights();
  await act(async () => root.render(createElement(TextEditor)));
  const value = 'target\n'.repeat(3001);
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(input(), value);
    input().dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => {
    Array.from(container.querySelectorAll('button')).find((button) => button.textContent === 'Find & replace')!.click();
  });
  const query = container.querySelector<HTMLInputElement>('input[aria-label="Find"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(query, 'target');
    query.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => { jest.advanceTimersByTime(200); });
  expect(highlights.get('text-editor-matches')?.size).toBe(3001);
  expect(container.textContent).toContain('1 of 3001');
  await act(async () => { query.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); });
  expect(container.querySelector('input[aria-label="Find"]')).toBeNull();
  expect(highlights.get('text-editor-matches')?.size).toBe(0);
});
