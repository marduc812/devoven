'use client';
import { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { computeReadabilityScores, interpretFleschEase, interpretGrade, ReadabilityScores } from './logic';

const labelClass = 'block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1';

function ScoreCard({ name, score, interpretation, note }: { name: string; score: string; interpretation: string; note?: string }) {
  return (
    <div className="border border-gray-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">{name}</p>
      <p className="text-2xl font-black text-gray-900 font-mono leading-none mb-1">{score}</p>
      <p className="text-xs text-gray-600">{interpretation}</p>
      {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
    </div>
  );
}

export function ReadabilityGrade() {
  const [input, setInput] = useState('');
  const [scores, setScores] = useState<ReadabilityScores | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setScores(null); return; }
    const s = computeReadabilityScores(input);
    setScores(s.wordCount > 0 && s.sentenceCount > 0 ? s : null);
  }, [input]);

  const fmt = (n: number) => isNaN(n) ? '—' : n.toFixed(1);

  return (
    <Panel
      title="Readability Grade Level"
      description="Compute six readability metrics at once: [1 Flesch Reading Ease 2], [1 Flesch-Kincaid Grade 2], [1 Gunning Fog 2], [1 SMOG Index 2], [1 Coleman-Liau 2], and [1 Automated Readability Index 2]."
      backColor="rose"
      extraElements={
        <div className="flex flex-col gap-5">
          <div>
            <label className={labelClass}>Input Text</label>
            <textarea
              className="bg-white text-gray-900 border border-gray-300 focus:border-gray-900 focus:outline-none px-3 py-2 text-sm w-full resize-y"
              rows={6}
              placeholder="Paste any text to analyze readability..."
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {scores && (
            <>
              {/* Stats row */}
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['Words', 'Sentences', 'Syllables', 'Complex Words', 'Avg Words/Sent', 'Avg Syl/Word'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-2 text-gray-900 font-mono text-sm">{scores.wordCount}</td>
                      <td className="px-3 py-2 text-gray-900 font-mono text-sm">{scores.sentenceCount}</td>
                      <td className="px-3 py-2 text-gray-900 font-mono text-sm">{scores.syllableCount}</td>
                      <td className="px-3 py-2 text-gray-900 font-mono text-sm">{scores.complexWordCount}</td>
                      <td className="px-3 py-2 text-gray-900 font-mono text-sm">{scores.avgWordsPerSentence}</td>
                      <td className="px-3 py-2 text-gray-900 font-mono text-sm">{scores.avgSyllablesPerWord}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Score cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <ScoreCard
                  name="Flesch Reading Ease"
                  score={`${fmt(scores.fleschReadingEase)}/100`}
                  interpretation={interpretFleschEase(scores.fleschReadingEase)}
                  note="Higher = easier to read"
                />
                <ScoreCard
                  name="Flesch-Kincaid Grade"
                  score={`G ${fmt(scores.fleschKincaidGrade)}`}
                  interpretation={interpretGrade(scores.fleschKincaidGrade)}
                />
                <ScoreCard
                  name="Gunning Fog"
                  score={`G ${fmt(scores.gunningFog)}`}
                  interpretation={interpretGrade(scores.gunningFog)}
                />
                <ScoreCard
                  name="SMOG Index"
                  score={`G ${fmt(scores.smogIndex)}`}
                  interpretation={interpretGrade(scores.smogIndex)}
                  note="Needs 30+ sentences for accuracy"
                />
                <ScoreCard
                  name="Coleman-Liau"
                  score={`G ${fmt(scores.colemanLiau)}`}
                  interpretation={interpretGrade(scores.colemanLiau)}
                />
                <ScoreCard
                  name="Auto Readability"
                  score={`G ${fmt(scores.automatedReadabilityIndex)}`}
                  interpretation={interpretGrade(scores.automatedReadabilityIndex)}
                />
              </div>
            </>
          )}

          {!input.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Paste text above to compute readability scores</p>
          )}
        </div>
      }
    />
  );
}
