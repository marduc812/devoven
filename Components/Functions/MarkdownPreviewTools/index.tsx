'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { FileDropZone, LoadFileButton } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { formatTextStats } from '@/Components/Functions/Utils';
import { boxButtonClass, boxLabelClass, boxStatsClass } from '@/Components/MainView/MainPanel/formControls';

// Loaded as real content, not as a placeholder: the point of the tool is the
// rendered half, and an empty pane on arrival shows nobody what it does. The
// Clear button empties both.
const SAMPLE = `# Hello, Markdown!

Write your markdown here and see the **live preview** on the right.

## Features

- *Italic* and **bold** text
- [Links](https://example.com)
- \`inline code\`

\`\`\`js
// Code blocks
console.log('Hello, world!');
\`\`\`

> Blockquotes are also supported.
`;

export const MarkdownPreview = () => {
  const [md, setMd] = useState(SAMPLE);
  const [html, setHtml] = useState('');
  const [inputWidth, setInputWidth] = useState(50);
  const [dragging, setDragging] = useState(false);
  const splitRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; width: number; availableWidth: number } | null>(null);

  const resizeInput = (width: number) => setInputWidth(Math.min(80, Math.max(20, width)));

  useEffect(() => {
    if (!md) { setHtml(''); return; }
    let cancelled = false;
    // Kept as a dynamic import so marked and dompurify stay out of the initial bundle.
    import('./logic').then(({ renderMarkdown }) => {
      // Two fast keystrokes start two imports, and without this an older result
      // can resolve last and overwrite a newer one.
      if (!cancelled) setHtml(renderMarkdown(md));
    });
    return () => { cancelled = true; };
  }, [md]);

  // One height for both label rows, and `shrink-0` so the column's flex layout
  // cannot squeeze the editor's row a couple of pixels shorter than the
  // preview's and knock the two halves out of line.
  const labelRowClass = 'flex shrink-0 items-center justify-between gap-3 h-7';

  const textareaClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-4 w-full h-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 text-sm font-mono resize-none';

  return (
    <Panel
      title="Markdown Preview"
      description="Live Markdown editor with side-by-side HTML preview. Paste or type your Markdown on the left to see the rendered result on the right."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-4">
          <div
            ref={splitRef}
            className="grid grid-cols-1 gap-y-4 md:grid-cols-[minmax(0,var(--input-width))_1rem_minmax(0,var(--preview-width))] md:gap-y-0"
            style={{ minHeight: '500px', '--input-width': `${inputWidth}fr`, '--preview-width': `${100 - inputWidth}fr` } as CSSProperties}
          >
            <div className="flex min-w-0 flex-col gap-2 h-full">
              {/* The count sits on the label line and follows what is typed,
                  rather than waiting behind a button. Both columns give that
                  line the same fixed height, so the label, the Clear button on
                  the other side, and the two boxes below all line up. */}
              <div className={labelRowClass}>
                <div className="flex items-baseline gap-x-3 min-w-0">
                  <span className={boxLabelClass}>Markdown Input</span>
                  <span className={boxStatsClass}>{formatTextStats(md)}</span>
                </div>
                <LoadFileButton
                  onText={setMd}
                  accept=".md,.markdown,.txt,text/markdown,text/plain"
                  title="Fill the editor from a Markdown file"
                />
              </div>
              <FileDropZone onText={setMd} className="flex-1 min-h-0">
                <textarea
                  className={textareaClass}
                  style={{ minHeight: '480px' }}
                  placeholder="Write your markdown here…"
                  value={md}
                  onChange={e => setMd(e.target.value)}
                />
              </FileDropZone>
            </div>
            <div
              role="separator"
              aria-label="Resize Markdown input and preview"
              aria-orientation="vertical"
              aria-valuemin={20}
              aria-valuemax={80}
              aria-valuenow={Math.round(inputWidth)}
              aria-valuetext={`Markdown input ${Math.round(inputWidth)}%, preview ${Math.round(100 - inputWidth)}%`}
              tabIndex={0}
              title="Drag to resize. Double-click to reset."
              onPointerDown={event => {
                if (event.button !== 0 || !splitRef.current) return;
                event.preventDefault();
                dragRef.current = {
                  pointerId: event.pointerId,
                  x: event.clientX,
                  width: inputWidth,
                  availableWidth: splitRef.current.getBoundingClientRect().width - event.currentTarget.getBoundingClientRect().width,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
                event.currentTarget.focus();
                setDragging(true);
              }}
              onPointerMove={event => {
                const drag = dragRef.current;
                if (!drag || drag.pointerId !== event.pointerId || drag.availableWidth <= 0) return;
                resizeInput(drag.width + (event.clientX - drag.x) / drag.availableWidth * 100);
              }}
              onPointerUp={event => {
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                dragRef.current = null;
                setDragging(false);
              }}
              onPointerCancel={() => { dragRef.current = null; setDragging(false); }}
              onLostPointerCapture={() => { dragRef.current = null; setDragging(false); }}
              onDoubleClick={() => setInputWidth(50)}
              onKeyDown={event => {
                const step = event.shiftKey ? 10 : 2;
                if (event.key === 'ArrowLeft') resizeInput(inputWidth - step);
                else if (event.key === 'ArrowRight') resizeInput(inputWidth + step);
                else if (event.key === 'Home') resizeInput(20);
                else if (event.key === 'End') resizeInput(80);
                else return;
                event.preventDefault();
              }}
              className={`group hidden cursor-col-resize touch-none select-none items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-rose-400 md:flex ${dragging ? 'bg-rose-50' : 'hover:bg-gray-50'}`}
            >
              <span className={`h-12 w-1 rounded-full ${dragging ? 'bg-rose-400' : 'bg-gray-200 group-hover:bg-gray-400'}`} />
            </div>
            <div className="flex min-w-0 flex-col gap-2 h-full">
              {/* Clear rides the preview label rather than taking a row of its
                  own; the input label row already ends in the file button. */}
              <div className={labelRowClass}>
                <span className={boxLabelClass}>Preview</span>
                {md && (
                  <button
                    type="button"
                    onClick={() => { setMd(''); setHtml(''); }}
                    title="Empty both panes"
                    className={boxButtonClass}
                  >
                    <IoTrashOutline className="text-sm" />
                    Clear
                  </button>
                )}
              </div>
              <div
                className="bg-white text-gray-900 p-4 border border-gray-200 overflow-auto prose prose-sm max-w-none"
                style={{ minHeight: '480px' }}
                dangerouslySetInnerHTML={{ __html: html || '<p class="text-gray-600 text-sm">Preview will appear here...</p>' }}
              />
            </div>
          </div>
        </div>
      }
    />
  );
};
