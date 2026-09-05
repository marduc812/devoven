'use client';

import React, { useEffect, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { expandUriTemplate, parseVariableLines, extractTemplateVars } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const UriTemplateExpander = () => {
  const [template, setTemplate] = useState('');
  const [varLines, setVarLines] = useState('');
  const [expanded, setExpanded] = useState('');
  const [detectedVars, setDetectedVars] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setTemplate(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: template })

  useEffect(() => {
    const vars = extractTemplateVars(template);
    setDetectedVars(vars);
    if (!template.trim()) {
      setExpanded('');
      return;
    }
    try {
      const variables = parseVariableLines(varLines);
      setExpanded(expandUriTemplate(template, variables));
    } catch {
      setExpanded('(expansion error)');
    }
  }, [template, varLines]);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors duration-150 text-sm font-mono';
  const textareaClass = inputClass + ' resize-none';

  const EXAMPLE_TEMPLATE = 'https://api.example.com/{version}/users{/id}{?fields,format}';
  const EXAMPLE_VARS = 'version=v2\nid=42\nfields=[name,email]\nformat=json';

  return (
    <Panel
      title="URI Template Expander"
      description="Expand RFC 6570 URI templates. Supports [1 {var} 2] (simple), [1 {+var} 2] (reserved), [1 {#var} 2] (fragment), [1 {/var} 2] (path), [1 {?var} 2] (query), [1 {&var} 2] (query continuation), [1 {;var} 2] (path-style), [1 {.var} 2] (label)."
      backColor="sky"
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">URI Template</label>
            <input
              className={inputClass}
              placeholder={EXAMPLE_TEMPLATE}
              value={template}
              onChange={e => setTemplate(e.target.value)}
            />
          </div>

          {detectedVars.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-gray-500 text-xs self-center">Variables detected:</span>
              {detectedVars.map(v => (
                <span key={v} className="inline-flex items-center px-2 py-0.5 text-xs font-mono border bg-sky-500/20 text-sky-300 border-sky-500/40">
                  {v}
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">
              Variable Values <span className="text-gray-500 font-normal normal-case">(one per line: name=value, list: name=[a,b,c])</span>
            </label>
            <FileTextArea>
              <textarea
                className={textareaClass}
                rows={5}
                placeholder={EXAMPLE_VARS}
                value={varLines}
                onChange={e => setVarLines(e.target.value)}
              />
            </FileTextArea>
          </div>

          {expanded && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2">Expanded URI</label>
              <div className="bg-white border border-gray-200 p-3">
                <code className="text-gray-900 text-sm font-mono break-all">{expanded}</code>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">Operator Reference</p>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                ['{var}', 'Simple string expansion — percent-encode reserved chars'],
                ['{+var}', 'Reserved expansion — allow reserved chars (: / ? # etc.)'],
                ['{#var}', 'Fragment expansion — prepends # to result'],
                ['{.var}', 'Label expansion — prepends . (e.g. .json)'],
                ['{/var}', 'Path segment expansion — prepends /'],
                ['{;var}', 'Path-style parameters — prepends ; with name=value'],
                ['{?var}', 'Query string — prepends ? with name=value'],
                ['{&var}', 'Query continuation — prepends & with name=value'],
              ].map(([op, desc]) => (
                <div key={op} className="flex gap-3">
                  <code className="text-sky-300/80 text-xs font-mono w-20 shrink-0">{op}</code>
                  <span className="text-gray-400 text-xs">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
};
