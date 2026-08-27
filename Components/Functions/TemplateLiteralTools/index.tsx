'use client'

import { useState, useEffect } from 'react'
import Panel from '@/Components/MainView/MainPanel/Panel'
import { evaluateTemplate } from './logic'

export const TemplateLiteralEvaluator = () => {
  const [template, setTemplate] = useState('')
  const [varDefs, setVarDefs] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const from = searchParams.get('from') || ''
    if (from) setTemplate(decodeURIComponent(from))
  }, [])

  const result = template.trim() ? evaluateTemplate(template, varDefs) : null

  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:outline-none focus:border-gray-900 resize-y font-mono text-sm'
  const labelClass = 'text-xs text-gray-400 mb-1 block'

  return (
    <Panel
      backColor="lime"
      title="Template Literal Evaluator"
      description="Safely evaluate JavaScript [1template literals2] with variable substitution. No eval — uses a safe expression parser."
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className={labelClass}>Template String (use {'${...}'} for expressions)</label>
            <textarea
              className={inputClass}
              rows={4}
              placeholder={'Hello, ${name}! You are ${age > 17 ? "an adult" : "a minor"}.'}
              value={template}
              onChange={function(e) { setTemplate(e.target.value) }}
            />
          </div>

          <div>
            <label className={labelClass}>Variables (key=value, one per line)</label>
            <textarea
              className={inputClass}
              rows={4}
              placeholder={'name="Alice"\nage=25\ncount=42'}
              value={varDefs}
              onChange={function(e) { setVarDefs(e.target.value) }}
            />
          </div>

          {result && (
            <>
              <div>
                <label className={labelClass}>Resolved Output</label>
                <div className="bg-gray-50 text-gray-900 p-4 border border-gray-200 font-mono text-sm whitespace-pre-wrap break-all">
                  {result.resolved}
                </div>
              </div>

              {result.expressions.length > 0 && (
                <div className="border border-gray-200 overflow-hidden">
                  <div className="bg-white/5 px-4 py-2">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Expression Results</p>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t border-gray-200">
                        <th className="px-4 py-2 text-left text-gray-500 text-xs font-medium">Expression</th>
                        <th className="px-4 py-2 text-left text-gray-500 text-xs font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.expressions.map(function(expr, i) {
                        return (
                          <tr key={i} className="border-t border-gray-200">
                            <td className="px-4 py-2 font-mono text-xs text-indigo-300">{'${' + expr.expression + '}'}</td>
                            <td className="px-4 py-2 font-mono text-sm">
                              {expr.error
                                ? <span className="text-red-400">{expr.error}</span>
                                : <span className="text-emerald-300">{expr.value}</span>
                              }
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {!template.trim() && (
            <p className="text-gray-600 text-sm text-center py-2">Enter a template string above to evaluate it</p>
          )}
        </div>
      }
    />
  )
}
