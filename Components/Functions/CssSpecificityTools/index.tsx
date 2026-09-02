'use client'

import { useState, useEffect } from 'react'
import Panel from '@/Components/MainView/MainPanel/Panel'
import { calcSpecificity } from './logic'
import { useShareLink } from '@/Components/Functions/ShareLink'

export const CssSpecificityCalc = () => {
  const [input, setInput] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const from = searchParams.get('from') || ''
    if (from) setInput(decodeURIComponent(from))
  }, [])

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  const result = calcSpecificity(input)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  return (
    <Panel
      backColor="cyan"
      title="CSS Specificity Calculator"
      description="Calculate the specificity of CSS selectors. Enter one selector per line to compare. Use [1inline2] as a selector to represent inline styles."
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">CSS Selectors (one per line)</label>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:outline-none focus:border-gray-900 resize-y font-mono text-sm"
              rows={5}
              placeholder={"#header .nav a\n.btn:hover\ndiv > p + span"}
              value={input}
              onChange={function(e) { setInput(e.target.value) }}
            />
          </div>

          {result.selectors.length > 0 && (
            <div className="border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-gray-400 font-medium w-8"></th>
                    <th className="px-4 py-2 text-left text-gray-400 font-medium">Selector</th>
                    <th className="px-4 py-2 text-center text-gray-400 font-medium">Specificity</th>
                    <th className="px-4 py-2 text-right text-gray-400 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {result.selectors.map(function(sel, i) {
                    const isWinner = result.winner !== null &&
                      result.winner !== 'tie' &&
                      result.winner.split(', ').includes(letters[i])
                    return (
                      <tr key={i} className={i > 0 ? 'border-t border-gray-200' : ''}>
                        <td className="px-4 py-2 text-gray-500 text-xs font-mono">{letters[i]}</td>
                        <td className="px-4 py-2 font-mono text-sm">
                          <span className={isWinner ? 'text-emerald-400' : 'text-gray-900'}>{sel.selector}</span>
                          {isWinner && <span className="ml-2 text-xs text-emerald-500/80">wins</span>}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <span className="font-mono text-sm text-indigo-300">{sel.label}</span>
                          <div className="flex justify-center gap-1 mt-1">
                            {[
                              { label: 'a', val: sel.tuple.inline, color: 'bg-purple-500' },
                              { label: 'b', val: sel.tuple.ids, color: 'bg-indigo-500' },
                              { label: 'c', val: sel.tuple.classes, color: 'bg-blue-500' },
                              { label: 'd', val: sel.tuple.elements, color: 'bg-sky-500' },
                            ].map(function(part) {
                              return (
                                <span key={part.label} className="text-xs text-gray-500 flex items-center gap-0.5">
                                  <span className={'inline-block w-1.5 h-1.5 rounded-sm ' + part.color} />
                                  {part.label}:{part.val}
                                </span>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-gray-400 text-xs">{sel.score}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {result.selectors.length > 1 && result.winner && (
            <div className={`px-4 py-3 border text-sm ${result.winner === 'tie'
              ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400'
              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'}`}>
              {result.winner === 'tie'
                ? 'All selectors have equal specificity — source order determines cascade.'
                : 'Selector ' + result.winner + ' has the highest specificity.'}
            </div>
          )}

          <div className="border border-gray-200 p-4">
            <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide">Specificity Components</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { label: 'a — Inline', desc: 'style=""', color: 'text-purple-400' },
                { label: 'b — IDs', desc: '#id', color: 'text-indigo-400' },
                { label: 'c — Classes', desc: '.class, [attr], :hover', color: 'text-blue-400' },
                { label: 'd — Elements', desc: 'div, ::before', color: 'text-sky-400' },
              ].map(function(item) {
                return (
                  <div key={item.label} className="border border-gray-200 bg-white/2 p-3">
                    <p className={'font-semibold mb-1 ' + item.color}>{item.label}</p>
                    <p className="text-gray-500 font-mono">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {!input.trim() && (
            <p className="text-gray-600 text-sm text-center py-2">Enter CSS selectors above to calculate specificity</p>
          )}
        </div>
      }
    />
  )
}
