'use client';

import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Match } from './logic';
import type { TabView } from './tabs';
import { HEIGHT_STEP, clampEditorHeight } from './editorHeight';

// The textarea and the highlight layer must lay text out identically or the
// highlights drift. Every metric that affects layout lives in this one string.
const NO_MATCHES: Match[] = [];

const TEXT_METRICS = 'font-mono text-sm leading-6 p-3 tracking-normal [tab-size:8]';

type Props = {
  value: string;
  /** The buffer the match offsets belong to. Hide them while the live text differs. */
  highlightText: string;
  onChange: (value: string) => void;
  matches: Match[];
  currentMatchIndex: number;
  showLineNumbers: boolean;
  wrap: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /**
   * Scroll and caret to restore once. This component is keyed by tab, so it
   * remounts on every switch and "once" means "each time a tab is shown".
   */
  initialView?: TabView;
  /** Surface height in pixels, or null for the default 60vh. */
  height: number | null;
  /** Reports a dragged or keyed height; null resets to the default. */
  onHeightChange: (height: number | null) => void;
};

type Segment = { text: string; match: boolean; current: boolean };

// Inline marks share the visible text's layout. They add no padding or borders.
function buildSegments(text: string, matches: Match[], currentMatchIndex: number): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  matches.forEach((match, i) => {
    if (match.start > cursor) {
      segments.push({ text: text.slice(cursor, match.start), match: false, current: false });
    }
    segments.push({
      text: text.slice(match.start, match.end),
      match: true,
      current: i === currentMatchIndex,
    });
    cursor = Math.max(cursor, match.end);
  });

  segments.push({ text: text.slice(cursor), match: false, current: false });
  return segments;
}

const EditorSurface = ({
  value,
  highlightText,
  onChange,
  matches,
  currentMatchIndex,
  showLineNumbers,
  wrap,
  textareaRef,
  initialView,
  height,
  onHeightChange,
}: Props) => {
  const highlightRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [nativeHighlights, setNativeHighlights] = useState<boolean | null>(null);
  const matchRangesRef = useRef<Range[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);
  const gutterContentRef = useRef<HTMLDivElement>(null);
  const [lineHeights, setLineHeights] = useState<number[]>([]);

  // Counting separators is much cheaper than materialising an array of lines,
  // and on a large buffer this runs on every keystroke.
  const lineCount = useMemo(() => {
    let count = 1;
    for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) === 10) count++;
    return count;
  }, [value]);

  const freshMatches = value === highlightText ? matches : NO_MATCHES;
  const segments = useMemo(
    () => buildSegments(value, value === highlightText && nativeHighlights === false ? matches : [], currentMatchIndex),
    [value, highlightText, nativeHighlights, matches, currentMatchIndex]
  );
  const lines = useMemo(() => wrap ? value.split('\n') : [], [wrap, value]);

  useLayoutEffect(() => {
    setNativeHighlights(typeof Highlight !== 'undefined' && typeof CSS !== 'undefined' && !!CSS.highlights);
  }, []);

  const gutterText = useMemo(() => {
    if (!showLineNumbers || wrap) return '';
    const numbers = new Array(lineCount);
    for (let i = 0; i < lineCount; i++) numbers[i] = i + 1;
    return numbers.join('\n');
  }, [showLineNumbers, wrap, lineCount]);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    const content = contentRef.current;
    const viewport = highlightRef.current;
    if (!textarea || !content || !viewport) return;

    // clientWidth excludes a native scrollbar. The mirror must wrap at exactly
    // that width, even on systems that always reserve space for scrollbars.
    viewport.style.width = `${textarea.clientWidth}px`;
    viewport.style.height = `${textarea.clientHeight}px`;
    content.style.transform = `translate(${-textarea.scrollLeft}px, ${-textarea.scrollTop}px)`;
    if (gutterContentRef.current) {
      gutterContentRef.current.style.transform = `translateY(${-textarea.scrollTop}px)`;
    }
  }, [textareaRef]);

  // Index the rendered text nodes once. Native highlights decorate ranges without
  // adding a DOM element per match. The same ranges measure wrapped rows and reveal
  // matches, so navigation uses the actual layout rather than a line-number guess.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || nativeHighlights === null) return;
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    const nodes: { node: Text; start: number; end: number }[] = [];
    let offset = 0;
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const end = offset + (node.textContent?.length ?? 0);
      nodes.push({ node: node as Text, start: offset, end });
      offset = end;
    }
    const point = (position: number) => {
      let low = 0;
      let high = nodes.length - 1;
      while (low < high) {
        const mid = (low + high) >>> 1;
        if (nodes[mid].end <= position) low = mid + 1;
        else high = mid;
      }
      const entry = nodes[low];
      return { node: entry.node, offset: Math.min(position - entry.start, entry.node.length) };
    };
    const rangeFor = (start: number, end: number) => {
      const range = document.createRange();
      const from = point(start);
      const to = point(end);
      range.setStart(from.node, from.offset);
      range.setEnd(to.node, to.offset);
      return range;
    };
    const ranges = freshMatches.map((match) => rangeFor(match.start, match.end));
    matchRangesRef.current = ranges;

    if (nativeHighlights) {
      const all = new Highlight();
      for (const range of ranges) all.add(range);
      CSS.highlights.set('text-editor-matches', all);
    }

    const measure = () => {
      syncScroll();
      if (!wrap || !showLineNumbers || !rangeFor(0, 0).getBoundingClientRect) {
        setLineHeights([]);
        return;
      }
      const tops: number[] = [];
      let start = 0;
      for (const line of lines) {
        // Include the sentinel on an empty final line so it has a measurable row.
        tops.push(rangeFor(start, Math.min(start + 1, value.length + 1)).getBoundingClientRect().top);
        start += line.length + 1;
      }
      const box = content.getBoundingClientRect();
      const bottom = box.bottom - 12 + (tops[0] - box.top - 12);
      setLineHeights(tops.map((top, i) => (tops[i + 1] ?? bottom) - top));
    };
    measure();
    const observer = new ResizeObserver(measure);
    const textarea = textareaRef.current;
    if (textarea) observer.observe(textarea);
    return () => {
      observer.disconnect();
      if (nativeHighlights) {
        CSS.highlights.delete('text-editor-matches');
      }
    };
  }, [value, freshMatches, nativeHighlights, wrap, showLineNumbers, lines, syncScroll, textareaRef]);

  // Mount only. A background tab's buffer can shrink while it is unmounted — a
  // Replace all across every tab does exactly that — so the stored offsets are
  // clamped rather than trusted.
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !initialView) return;

    const limit = textarea.value.length;
    textarea.selectionStart = Math.min(initialView.selectionStart, limit);
    textarea.selectionEnd = Math.min(initialView.selectionEnd, limit);
    textarea.scrollTop = initialView.scrollTop;
    syncScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!nativeHighlights) return;
    const current = new Highlight();
    const range = matchRangesRef.current[currentMatchIndex];
    if (range) current.add(range);
    current.priority = 1;
    CSS.highlights.set('text-editor-current', current);
    return () => { CSS.highlights.delete('text-editor-current'); };
  }, [value, freshMatches, currentMatchIndex, nativeHighlights, wrap, showLineNumbers]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    const range = matchRangesRef.current[currentMatchIndex];
    if (!textarea || !range?.getBoundingClientRect) return;
    const rect = range.getClientRects?.()[0] ?? range.getBoundingClientRect();
    const box = textarea.getBoundingClientRect();
    const left = box.left + 12;
    const top = box.top + 12;
    const right = box.left + textarea.clientWidth - 12;
    const bottom = box.top + textarea.clientHeight - 12;
    if (rect.top < top || rect.bottom > bottom) {
      textarea.scrollTop += rect.top - top - textarea.clientHeight / 3;
    }
    if (rect.left < left || rect.right > right) {
      textarea.scrollLeft += rect.left - left - textarea.clientWidth / 3;
    }
    syncScroll();
  }, [value, freshMatches, currentMatchIndex, nativeHighlights, wrap, syncScroll, textareaRef]);

  // The drag works off the measured box rather than the `height` prop, because
  // until the first drag the height is whatever 60vh resolved to.
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const currentHeight = () => boxRef.current?.getBoundingClientRect().height ?? 0;

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startHeight: currentHeight() };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    onHeightChange(clampEditorHeight(drag.startHeight + (e.clientY - drag.startY), window.innerHeight));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const nudge = (delta: number) => onHeightChange(clampEditorHeight(currentHeight() + delta, window.innerHeight));

  const onHandleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') nudge(HEIGHT_STEP);
    else if (e.key === 'ArrowUp') nudge(-HEIGHT_STEP);
    else if (e.key === 'Home' || e.key === 'Escape') onHeightChange(null);
    else return;
    e.preventDefault();
  };

  const whitespace = wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre';

  return (
    <>
      <div
        ref={boxRef}
        className={`flex border border-gray-300 bg-white overflow-hidden ${height === null ? 'h-[60vh]' : ''}`}
        style={height === null ? undefined : { height }}
      >
        {showLineNumbers && (
          <div
            aria-hidden="true"
            className={`${TEXT_METRICS} flex-shrink-0 overflow-hidden select-none text-right text-gray-400 bg-gray-50 border-r border-gray-200 w-14 px-2`}
          >
            <div ref={gutterContentRef}>
              {wrap && lineHeights.length === lines.length ? (
                lines.map((_, i) => (
                  <div key={i} style={{ height: lineHeights[i] }}>
                    {i + 1}
                  </div>
                ))
              ) : (
                <div className="whitespace-pre">{wrap ? lines.map((_, i) => i + 1).join('\n') : gutterText}</div>
              )}
            </div>
          </div>
        )}

        <div className="relative flex-1 min-w-0 overflow-hidden">
          <div ref={highlightRef} aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              ref={contentRef}
              className={`${TEXT_METRICS} ${whitespace} text-gray-900`}
            >
              {segments.map((segment, i) =>
                segment.match ? (
                  <span
                    key={i}
                    data-current-match={segment.current || undefined}
                    className={segment.current ? 'text-editor-current' : 'text-editor-match'}
                  >
                    {segment.text}
                  </span>
                ) : (
                  <React.Fragment key={i}>{segment.text}</React.Fragment>
                )
              )}
              {/* A final row exists in a textarea even when the buffer ends in a newline. */}
              {'\u200b'}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={syncScroll}
            spellCheck={false}
            wrap={wrap ? 'soft' : 'off'}
            aria-label="Editor content"
            className={`text-editor-input ${TEXT_METRICS} ${whitespace} absolute inset-0 w-full h-full resize-none outline-none overflow-auto border-0`}
          />
        </div>
      </div>

      {/* Drag to resize. The handle sits on the box's bottom border rather than
          inside it, so it never overlaps the caret on the last line. */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize editor"
        aria-valuenow={height ?? undefined}
        tabIndex={0}
        title="Drag to resize — double-click to reset"
        onPointerDown={startDrag}
        onPointerMove={onDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={() => onHeightChange(null)}
        onKeyDown={onHandleKeyDown}
        className={`group flex h-3 cursor-ns-resize touch-none select-none items-center justify-center border border-t-0 border-gray-300 outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
          dragging ? 'bg-gray-100' : 'bg-gray-50 hover:bg-gray-100'
        }`}
      >
        <div className={`h-0.5 w-8 rounded-full ${dragging ? 'bg-gray-400' : 'bg-gray-300 group-hover:bg-gray-400'}`} />
      </div>
    </>
  );
};

export default EditorSurface;
