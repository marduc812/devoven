'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!md) { setHtml(''); return; }
    import('marked').then(({ marked }) => {
      setHtml(marked(md) as string);
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: '500px' }}>
            <div className="flex flex-col gap-2 h-full">
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
            <div className="flex flex-col gap-2 h-full">
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
