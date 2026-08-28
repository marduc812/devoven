'use client';
import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  BarChart,
  HeroResult,
  PresetRow,
  SectionTitle,
  StatTile,
  StatusBadge,
  inputClass,
} from '@/Components/MainView/MainPanel/ResultUI';
import { analyzeAnagrams, type RackTile, type ScoredWord } from './logic';

const PRESETS = [
  { label: 'least', value: 'least' },
  { label: 'later', value: 'later' },
  { label: 'time', value: 'time' },
  { label: 'stop', value: 'stop' },
  { label: 'listen', value: 'listen' },
];

/** A Scrabble tile: the letter big, its value tucked into the corner. */
const Tile = ({ tile }: { tile: RackTile }) => (
  <div className="relative border border-gray-300 bg-gray-50 w-11 h-11 flex items-center justify-center">
    <span className="font-mono text-lg font-black text-gray-900 uppercase">{tile.letter}</span>
    <span className="absolute bottom-0.5 right-1 font-mono text-[9px] text-gray-500">
      {tile.value}
    </span>
    {tile.count > 1 && (
      <span className="absolute top-0.5 left-1 font-mono text-[9px] text-indigo-700 font-bold">
        ×{tile.count}
      </span>
    )}
  </div>
);

const WordChips = ({ words, highlight }: { words: ScoredWord[]; highlight?: string }) => (
  <div className="flex flex-wrap gap-1.5">
    {words.map(w => (
      <span
        key={w.word}
        className={`inline-flex items-baseline gap-1.5 border px-2 py-1 font-mono text-xs ${
          w.word === highlight
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-bold'
            : 'border-gray-200 text-gray-900'
        }`}
      >
        <span className="uppercase tracking-wide">{w.word}</span>
        <span className="text-[10px] text-gray-400">{w.score}</span>
      </span>
    ))}
  </div>
);

export function AnagramWordFinder() {
  const [input, setInput] = useState('least');

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  const report = useMemo(() => (input.trim() ? analyzeAnagrams(input) : null), [input]);
  return (
    <Panel
      title="Anagram Word Finder"
      description="Enter a set of letters to find every word in the built-in list they can spell — [1 exact anagrams 2] using all the letters, and shorter words using a subset — each with its Scrabble score."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <label
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500"
              htmlFor="anagram-input"
            >
              Letters
            </label>
            <input
              id="anagram-input"
              className={inputClass}
              placeholder="least"
              value={input}
              onChange={e => setInput(e.target.value)}
            />
            <PresetRow presets={PRESETS} onPick={setInput} />
          </div>

          {report && report.letters.length === 0 && (
            <p className="text-sm text-gray-500">
              No letters to work with — only A–Z count, everything else is ignored.
            </p>
          )}

          {report && report.letters.length > 0 && (
            <>
              <HeroResult
                label={
                  report.exact.length > 0
                    ? `Exact anagram — ${report.exact.length} found`
                    : report.best
                      ? 'No exact anagram — best word found'
                      : 'Nothing found'
                }
                value={
                  report.exact.length > 0
                    ? report.exact[0].word.toUpperCase()
                    : report.best
                      ? report.best.word.toUpperCase()
                      : '—'
                }
                tone={report.exact.length > 0 ? 'pass' : report.best ? 'info' : 'neutral'}
                copyText={report.exact[0]?.word ?? report.best?.word ?? ''}
                note={
                  report.best ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="neutral">
                        {report.exact.length > 0
                          ? `${report.exact[0].score} points`
                          : `${report.best.score} points, ${report.best.word.length} of ${report.letters.length} letters`}
                      </StatusBadge>
                      {report.longest && (
                        <StatusBadge tone="info">
                          Longest: {report.longest.word.toUpperCase()}
                        </StatusBadge>
                      )}
                    </span>
                  ) : (
                    `None of the ${report.dictionarySize} words in the list fit these letters`
                  )
                }
              />

              <div className="flex flex-col gap-2">
                <SectionTitle note={`${report.rackScore} points on the rack`}>
                  Your letters
                </SectionTitle>
                <div className="flex flex-wrap gap-1.5">
                  {report.rack.map(t => (
                    <Tile key={t.letter} tile={t} />
                  ))}
                </div>
                {report.ignored.length > 0 && (
                  <p className="text-[11px] text-gray-400">
                    Ignored (not A–Z): <span className="font-mono">{report.ignored.join(' ')}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <StatTile label="Letters" value={report.letters.length} />
                <StatTile
                  label="Words found"
                  value={report.totalFound}
                  hint={`of ${report.dictionarySize} in the list`}
                />
                <StatTile
                  label="Exact anagrams"
                  value={report.exact.length}
                  hint="Use every letter"
                />
                <StatTile
                  label="Best score"
                  value={report.best ? report.best.score : 0}
                  hint={report.best ? report.best.word.toUpperCase() : undefined}
                />
              </div>

              {report.exact.length > 0 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="Every letter used, highest scoring first">
                    Exact anagrams
                  </SectionTitle>
                  <WordChips words={report.exact} highlight={report.exact[0].word} />
                </div>
              )}

              {report.exact.length === 0 &&
                !report.dictionaryLengths.includes(report.letters.length) && (
                  <p className="text-[11px] text-gray-500">
                    The built-in list holds no {report.letters.length}-letter words at all — it runs
                    to {report.dictionaryLengths.join(', ')} letters — so an exact anagram of this
                    input is impossible here whatever the letters are. The subsets below are the
                    whole answer.
                  </p>
                )}

              {report.byLength.length > 1 && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="How many words each length yields">
                    Words by length
                  </SectionTitle>
                  <BarChart
                    bars={report.byLength
                      .slice()
                      .sort((a, b) => a.length - b.length)
                      .map(g => ({
                        label: String(g.length),
                        value: g.words.length,
                        title: `${g.words.length} words of ${g.length} letters`,
                      }))}
                    height={110}
                  />
                </div>
              )}

              {report.byLength.map(group => (
                <div key={group.length} className="flex flex-col gap-2">
                  <SectionTitle
                    note={`${group.words.length} word${group.words.length === 1 ? '' : 's'}`}
                  >
                    {group.length}-letter words
                  </SectionTitle>
                  <WordChips words={group.words} />
                </div>
              ))}

              {report.totalFound === 0 && (
                <p className="text-sm text-gray-500">
                  No words matched. The dictionary is a built-in list of {report.dictionarySize}{' '}
                  common English words, so obscure or inflected forms will not be in it.
                </p>
              )}
            </>
          )}
        </div>
      }
    />
  );
}
