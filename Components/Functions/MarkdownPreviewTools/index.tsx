'use client';

import { useState, useEffect } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { extractMarkdownStats } from './logic';

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
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!md) { setHtml(''); return; }
    import('marked').then(({ marked }) => {
      setHtml(marked(md) as string);
    });
  }, [md]);

  const stats = extractMarkdownStats(md);

  const textareaClass =
    'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-4 w-full h-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 text-sm font-mono resize-none';

  return (
    <Panel
      title="Markdown Preview"
      description="Live Markdown editor with side-by-side HTML preview. Paste or type your Markdown on the left to see the rendered result on the right."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 justify-end">
            <button
              onClick={() => setShowStats(s => !s)}
              className={`text-xs px-3 py-1 border transition-colors duration-150 ${
                showStats
                  ? 'bg-rose-500/30 text-rose-200 border-rose-500/60'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400'
              }`}
            >
              Stats
            </button>
            {md && (
              <button
                onClick={() => { setMd(''); setHtml(''); }}
                className="text-xs px-3 py-1 bg-gray-50 text-gray-400 border border-gray-200 hover:border-gray-400 transition-colors duration-150"
              >
                Clear
              </button>
            )}
          </div>

          {showStats && md && (
            <pre className="bg-white text-gray-400 text-xs font-mono p-3 border border-gray-200 whitespace-pre">
              {stats}
            </pre>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ minHeight: '500px' }}>
            <div className="flex flex-col gap-2 h-full">
              <span className="text-gray-400 text-xs">Markdown Input</span>
              <FileTextArea accept=".md,.markdown,.txt,text/markdown,text/plain" className="h-full">
                <textarea
                  className={textareaClass}
                  style={{ minHeight: '480px' }}
                  placeholder="Write your markdown here…"
                  value={md}
                  onChange={e => setMd(e.target.value)}
                />
              </FileTextArea>
            </div>
            <div className="flex flex-col gap-2 h-full">
              <span className="text-gray-400 text-xs">Preview</span>
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
