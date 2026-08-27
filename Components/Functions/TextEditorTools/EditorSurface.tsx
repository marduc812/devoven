'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Match } from './logic';
import type { TabView } from './tabs';
import { HEIGHT_STEP, clampEditorHeight } from './editorHeight';

// The textarea and the highlight layer must lay text out identically or the
// highlights drift. Every metric that affects layout lives in this one string.
const TEXT_METRICS = 'font-mono text-sm leading-6 p-3 tracking-normal';

type Props = {
  value: string;
  /**
   * The buffer the matches were computed against. Trails `value` by the search
   * debounce, and highlighting stale-by-one-frame text is what keeps typing cheap:
   * the layer only re-slices when the debounced buffer settles, not per keystroke.
   * It is invisible text either way — only the highlight boxes are seen.
   */
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

// One flat pass over the whole buffer. Because the layer is `whitespace-pre`, the
// newlines inside the plain segments lay out exactly as the textarea's do — no
// per-line elements needed, so the node count depends on the number of matches
// rather than the size of the file.
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

// Wrapped mode still needs one box per logical line for the gutter to measure, so
// there the same slicing is done per line.
function buildLineSegments(lines: string[], matches: Match[], currentMatchIndex: number): Segment[][] {
  const result: Segment[][] = [];
  let lineStart = 0;
  let cursor = 0;

  for (const line of lines) {
    const lineEnd = lineStart + line.length;
    const segments: Segment[] = [];
    let pos = lineStart;

    while (cursor < matches.length && matches[cursor].start < lineEnd) {
      const match = matches[cursor];
      const from = Math.max(match.start, lineStart);
      const to = Math.min(match.end, lineEnd);

      if (from > pos) {
        segments.push({ text: line.slice(pos - lineStart, from - lineStart), match: false, current: false });
      }
      segments.push({
        text: line.slice(from - lineStart, to - lineStart),
        match: true,
        current: cursor === currentMatchIndex,
      });
      pos = to;

      // A match spanning a newline carries over to the next line.
      if (match.end > lineEnd) break;
      cursor++;
    }

    segments.push({ text: line.slice(pos - lineStart), match: false, current: false });
    result.push(segments);
    lineStart = lineEnd + 1;
  }

  return result;
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
  const boxRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [lineHeights, setLineHeights] = useState<number[]>([]);

  // Counting separators is much cheaper than materialising an array of lines,
  // and on a large buffer this runs on every keystroke.
  const lineCount = useMemo(() => {
    let count = 1;
    for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) === 10) count++;
    return count;
  }, [value]);

  const hasMatches = matches.length > 0;
  // Wrapped mode needs per-line boxes for the gutter to measure against; unwrapped
  // mode needs nothing at all unless there is something to highlight.
  const renderHighlight = hasMatches || wrap;

  const segments = useMemo(
    () => (renderHighlight && !wrap ? buildSegments(highlightText, matches, currentMatchIndex) : []),
    [renderHighlight, wrap, highlightText, matches, currentMatchIndex]
  );

  const wrappedLines = useMemo(() => (wrap ? highlightText.split('\n') : []), [wrap, highlightText]);

  const wrappedSegments = useMemo(
    () => (wrap && renderHighlight ? buildLineSegments(wrappedLines, matches, currentMatchIndex) : []),
    [wrap, renderHighlight, wrappedLines, matches, currentMatchIndex]
  );

  const gutterText = useMemo(() => {
    if (!showLineNumbers || wrap) return '';
    const numbers = new Array(lineCount);
    for (let i = 0; i < lineCount; i++) numbers[i] = i + 1;
    return numbers.join('\n');
  }, [showLineNumbers, wrap, lineCount]);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = textarea.scrollTop;
      highlightRef.current.scrollLeft = textarea.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
  }, [textareaRef]);

  // In wrapped mode a logical line can occupy several visual rows, so gutter
  // numbers are aligned to measured line-box heights rather than a fixed step.
  useLayoutEffect(() => {
    if (!wrap || !showLineNumbers) {
      setLineHeights([]);
      return;
    }
    const container = highlightRef.current;
    if (!container) return;

    const measure = () => {
      const children = Array.from(container.children) as HTMLElement[];
      setLineHeights(children.map((child) => child.offsetHeight));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [wrap, showLineNumbers, highlightText]);

  useEffect(() => {
    syncScroll();
  }, [value, wrap, syncScroll]);

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
            ref={gutterRef}
            aria-hidden="true"
            className={`${TEXT_METRICS} flex-shrink-0 overflow-hidden select-none text-right text-gray-400 bg-gray-50 border-r border-gray-200 w-14 px-2`}
          >
            {wrap && lineHeights.length === wrappedLines.length ? (
              wrappedLines.map((_, i) => (
                <div key={i} style={{ height: lineHeights[i] }}>
                  {i + 1}
                </div>
              ))
            ) : (
              <div className="whitespace-pre">{wrap ? wrappedLines.map((_, i) => i + 1).join('\n') : gutterText}</div>
            )}
          </div>
        )}

        <div className="relative flex-1 overflow-hidden">
          <div
            ref={highlightRef}
            aria-hidden="true"
            className={`${TEXT_METRICS} ${whitespace} absolute inset-0 overflow-hidden pointer-events-none text-transparent`}
          >
            {wrap
              ? wrappedSegments.map((lineSegments, i) => (
                  <div key={i}>
                    {lineSegments.map((segment, j) =>
                      segment.match ? (
                        <span key={j} className={segment.current ? 'bg-orange-300' : 'bg-yellow-200'}>
                          {segment.text}
                        </span>
                      ) : (
                        <React.Fragment key={j}>{segment.text}</React.Fragment>
                      )
                    )}
                    {/* Keeps an empty line one row tall so the layers stay aligned. */}
                    {lineSegments.every((segment) => segment.text === '') && '​'}
                  </div>
                ))
              : segments.length > 0 && (
                  <>
                    {segments.map((segment, i) =>
                      segment.match ? (
                        <span key={i} className={segment.current ? 'bg-orange-300' : 'bg-yellow-200'}>
                          {segment.text}
                        </span>
                      ) : (
                        <React.Fragment key={i}>{segment.text}</React.Fragment>
                      )
                    )}
                    {/* A buffer ending in a newline gets a final empty line in the
                        textarea, but a trailing newline closes no line box in a div,
                        so the layer would be one row shorter. Scrolling to the bottom
                        would then clamp it a row above the text and every highlight
                        would land on the line below the one it belongs to. */}
                    {'​'}
                  </>
                )}
          </div>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={syncScroll}
            spellCheck={false}
          wrap={wrap ? 'soft' : 'off'}
          aria-label="Editor content"
          className={`${TEXT_METRICS} ${whitespace} absolute inset-0 w-full h-full resize-none bg-transparent text-gray-900 caret-gray-900 outline-none overflow-auto border-0`}
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
