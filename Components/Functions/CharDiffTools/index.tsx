'use client';

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { FileDropZone, LoadFileButton } from '@/Components/View/FileInput';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { charDiff, wordDiff, diffStats, renderDiffToText, type DiffSegment } from './logic';
import styles from './styles.module.css';

function HighlightedDiff({ segments }: { segments: DiffSegment[] }) {
  return segments.map((segment, index) => {
    if (segment.type === 'added') return <ins key={index} className={styles.added} aria-label={`Added: ${segment.text}`}>{segment.text}</ins>;
    if (segment.type === 'removed') return <del key={index} className={styles.removed} aria-label={`Removed: ${segment.text}`}>{segment.text}</del>;
    return <React.Fragment key={index}>{segment.text}</React.Fragment>;
  });
}

export const CharDiff = () => {
  const [original, setOriginal] = useState('');
  const [revised, setRevised] = useState('');
  const [mode, setMode] = useState<'char' | 'word'>('word');
  const [view, setView] = useState<'inline' | 'split'>('split');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOriginal(params.get('from') || '');
    setRevised(params.get('to') || '');
    if (params.get('mode') === 'char') setMode('char');
    if (params.get('view') === 'inline') setView('inline');
  }, []);

  useShareLink({ from: original, to: revised, mode, view });

  const comparison = useMemo(() => {
    if (!original && !revised) return null;
    // Both algorithms contribute to the statistics, so validate both limits.
    if (original.length > 2000 || revised.length > 2000) {
      return { error: 'Use up to 2,000 characters per text. Shorten the text to compare it.' };
    }
    if ([original, revised].some(text => (text.match(/\S+|\s+/g) || []).length > 500)) {
      return { error: 'This text has too many words or spaces. Use up to 500 word and whitespace tokens per text.' };
    }
    try {
      const chars = charDiff(original, revised);
      const words = wordDiff(original, revised);
      return { chars, words, stats: diffStats(chars, words) };
    } catch {
      return { error: 'Could not compare these texts. Try a shorter section.' };
    }
  }, [original, revised]);

  const result = comparison?.stats ? comparison : null;
  const segments = result ? (mode === 'char' ? result.chars : result.words) : [];
  const hasInput = Boolean(original || revised);
  const identical = hasInput && original === revised;

  const copyDiff = async () => {
    try {
      await navigator.clipboard.writeText(renderDiffToText(segments));
      toast.success('Copied diff with [+added+] and [-removed-] markers');
    } catch {
      toast.error('Could not copy the diff. Select the result and copy it manually.');
    }
  };

  return (
    <Panel
      title="Text diff highlighter"
      description="Compare two texts by word or character. Read additions and removals in a highlighted diff as you type."
      backColor="rose"
      extraElements={
        <div className={styles.tool}>
          <div className={styles.toolbar}>
            <p className={styles.hint}>Paste text or load a file into each editor.</p>
            <div className={styles.actions}>
              <button type="button" onClick={() => {
                setOriginal('The quick brown fox jumps over the lazy dog.\nCompare text right in your browser.');
                setRevised('The quick red fox jumps over the sleepy dog.\nCompare and highlight text right in your browser.');
              }}>Try an example</button>
              <button type="button" disabled={!hasInput} onClick={() => { setOriginal(revised); setRevised(original); }}>Swap texts</button>
              <button type="button" disabled={!hasInput} onClick={() => { setOriginal(''); setRevised(''); }}>Clear</button>
            </div>
          </div>

          <div className={styles.editors}>
            {([
              { id: 'diff-original', label: 'Original text', value: original, setValue: setOriginal },
              { id: 'diff-revised', label: 'Revised text', value: revised, setValue: setRevised },
            ]).map(editor => (
              <div key={editor.id} className={styles.editor}>
                <div className={styles.editorHeader}>
                  <label htmlFor={editor.id}>{editor.label}</label>
                  <LoadFileButton onText={editor.setValue} title={`Load ${editor.label.toLowerCase()} from a file`} />
                </div>
                <FileDropZone onText={editor.setValue}>
                  <textarea id={editor.id} rows={8} value={editor.value} onChange={event => editor.setValue(event.target.value)} spellCheck={false} placeholder={`Paste ${editor.label.toLowerCase()} here, or drop a text file`} aria-describedby={`${editor.id}-count`} />
                </FileDropZone>
                <p id={`${editor.id}-count`} className={styles.editorFooter}>{editor.value.length.toLocaleString()} / 2,000 characters</p>
              </div>
            ))}
          </div>

          <section aria-labelledby="diff-result-title" className={styles.result}>
            <div className={styles.resultHeader}>
              <h2 id="diff-result-title">Comparison result</h2>
              <div className={styles.controls}>
                <div className={styles.toggle} role="group" aria-label="Comparison level">
                  <button type="button" aria-pressed={mode === 'word'} onClick={() => setMode('word')}>Words</button>
                  <button type="button" aria-pressed={mode === 'char'} onClick={() => setMode('char')}>Characters</button>
                </div>
                <div className={styles.toggle} role="group" aria-label="Result layout">
                  <button type="button" aria-pressed={view === 'inline'} onClick={() => setView('inline')}>Inline</button>
                  <button type="button" aria-pressed={view === 'split'} onClick={() => setView('split')}>Side by side</button>
                </div>
                <button type="button" className={styles.copy} disabled={!result} onClick={copyDiff}>Copy diff</button>
              </div>
            </div>

            {result && (
              <dl className={styles.stats}>
                <div><dt>Similarity</dt><dd>{result.stats.similarity}%</dd></div>
                <div><dt>Characters added</dt><dd className={styles.positive}>+{result.stats.charsAdded}</dd></div>
                <div><dt>Characters removed</dt><dd className={styles.negative}>−{result.stats.charsRemoved}</dd></div>
                <div><dt>Words changed</dt><dd><span className={styles.positive}>+{result.stats.wordsAdded}</span><span className={styles.negative}>−{result.stats.wordsRemoved}</span></dd></div>
              </dl>
            )}

            {!comparison ? (
              <div className={styles.empty}><h3>Your comparison will appear here</h3><p>Add your original and revised text above, or try the example.</p></div>
            ) : 'error' in comparison ? (
              <p role="alert" className={styles.error}>{comparison.error}</p>
            ) : (
              <>
                <div className={styles.legend}>
                  <span className={styles.added}>+ Added</span><span className={styles.removed}>− Removed</span>
                  <span>{identical ? 'The texts are identical.' : mode === 'char' ? 'Character-level changes' : 'Word-level changes'}</span>
                </div>
                {view === 'inline' ? (
                  <div className={styles.diff} tabIndex={0} aria-label="Inline comparison"><HighlightedDiff segments={segments} /></div>
                ) : (
                  <div className={styles.split}>
                    <div><h3>Original</h3><div className={styles.diff} tabIndex={0} aria-label="Original with removals">{original ? <HighlightedDiff segments={segments.filter(segment => segment.type !== 'added')} /> : <span className={styles.hint}>No original text</span>}</div></div>
                    <div><h3>Revised</h3><div className={styles.diff} tabIndex={0} aria-label="Revised with additions">{revised ? <HighlightedDiff segments={segments.filter(segment => segment.type !== 'removed')} /> : <span className={styles.hint}>No revised text</span>}</div></div>
                  </div>
                )}
              </>
            )}
          </section>
          <p className={styles.hint}>Text stays in your browser. Copy diff uses [+added+] and [-removed-] markers for plain text.</p>
        </div>
      }
    />
  );
};
