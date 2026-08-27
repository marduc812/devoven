'use client'

import { useState, useEffect } from 'react'
import Panel from '@/Components/MainView/MainPanel/Panel'
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter'
import {
  BitwiseOp,
  bitwiseOp,
  Permissions,
  PermSet,
  permissionsToOctal,
  permissionsToSymbolic,
  octalToPermissions,
  chmodCommand,
  calcStats,
  generateGitignore,
  listGitignoreTemplates,
  analyzePassword,
  PasswordAnalysis,
  curlToFetch,
  getWordFrequency,
  estimateReadingTime,
  fleschReadingEase,
  fleschLabel,
} from './logic'

// ── Bitwise Calculator ────────────────────────────────────────────────────────

export const BitwiseCalculator = () => {
  const [aVal, setAVal] = useState('0')
  const [bVal, setBVal] = useState('0')
  const [op, setOp] = useState<BitwiseOp>('AND')
  const [result, setResult] = useState<{decimal: string; hex: string; binary: string} | null>(null)
  const [error, setError] = useState('')

  const unaryOps: BitwiseOp[] = ['NOT']
  const isUnary = unaryOps.includes(op)

  useEffect(() => {
    try {
      const r = bitwiseOp(aVal || '0', isUnary ? '' : (bVal || '0'), op)
      setResult(r)
      setError('')
    } catch (e: any) {
      setResult(null)
      setError(e.message)
    }
  }, [aVal, bVal, op, isUnary])

  const operations: {label: string; value: BitwiseOp}[] = [
    {label: 'AND', value: 'AND'},
    {label: 'OR', value: 'OR'},
    {label: 'XOR', value: 'XOR'},
    {label: 'NOT A', value: 'NOT'},
    {label: 'NAND', value: 'NAND'},
    {label: 'NOR', value: 'NOR'},
    {label: 'Left Shift (A << B)', value: 'LSHIFT'},
    {label: 'Right Shift (A >>> B)', value: 'RSHIFT'},
  ]

  const inputClass = "bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 font-mono text-sm w-full"
  const labelClass = "text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block"

  return (
    <Panel
      backColor="lime"
      title="Bitwise Calculator"
      description="Perform bitwise operations on numbers. Accepts decimal, [10x prefix hex2], or [10b prefix binary2] values."
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className={labelClass}>Input A (dec / 0x hex / 0b binary)</label>
              <input
                type="text"
                className={inputClass}
                value={aVal}
                onChange={e => setAVal(e.target.value)}
                placeholder="e.g. 255 or 0xFF or 0b11111111"
              />
            </div>
            <div className="flex-1">
              <label className={`${labelClass} ${isUnary ? 'opacity-40' : ''}`}>Input B</label>
              <input
                type="text"
                className={`${inputClass} ${isUnary ? 'opacity-40 cursor-not-allowed' : ''}`}
                value={bVal}
                onChange={e => setBVal(e.target.value)}
                disabled={isUnary}
                placeholder={isUnary ? 'Not used for unary op' : 'e.g. 0b1010'}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Operation</label>
            <select
              className="bg-white text-gray-900 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 text-sm w-full"
              value={op}
              onChange={e => setOp(e.target.value as BitwiseOp)}
            >
              {operations.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-600 text-sm font-mono">{error}</p>
          )}

          {result && !error && (
            <div className="border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 w-28">Base</th>
                    <th className="text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-2 text-gray-500 text-xs">Decimal</td>
                    <td className="px-4 py-2 text-gray-900 font-mono">{result.decimal}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 text-gray-500 text-xs">Hex</td>
                    <td className="px-4 py-2 text-gray-900 font-mono">{result.hex}</td>
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-2 text-gray-500 text-xs">Binary</td>
                    <td className="px-4 py-2 text-gray-900 font-mono break-all">{result.binary}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      }
    />
  )
}

// ── chmod Calculator ──────────────────────────────────────────────────────────

const defaultPerms = (): Permissions => ({
  owner: {read: true, write: true, execute: true},
  group: {read: true, write: false, execute: true},
  other: {read: true, write: false, execute: true},
})

export const ChmodCalculator = () => {
  const [perms, setPerms] = useState<Permissions>(defaultPerms())
  const [octalInput, setOctalInput] = useState('')
  const [octalError, setOctalError] = useState('')

  const togglePerm = (role: keyof Permissions, bit: keyof PermSet) => {
    setPerms(prev => ({
      ...prev,
      [role]: {...prev[role], [bit]: !prev[role][bit]},
    }))
    setOctalInput('')
    setOctalError('')
  }

  const handleOctalInput = (val: string) => {
    setOctalInput(val)
    if (val.length === 3) {
      try {
        setPerms(octalToPermissions(val))
        setOctalError('')
      } catch (e: any) {
        setOctalError(e.message)
      }
    }
  }

  const octal = permissionsToOctal(perms)
  const symbolic = permissionsToSymbolic(perms)
  const cmd = chmodCommand(octal)

  const roles: (keyof Permissions)[] = ['owner', 'group', 'other']
  const bits: (keyof PermSet)[] = ['read', 'write', 'execute']
  const bitLabels = {read: 'Read (r)', write: 'Write (w)', execute: 'Execute (x)'}
  const checkboxClass = "w-4 h-4 cursor-pointer accent-gray-900"

  return (
    <Panel
      backColor="lime"
      title="chmod Calculator"
      description="Calculate Unix file permissions. Toggle checkboxes or enter an octal like [17552] to decode."
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500"></th>
                  {bits.map(b => (
                    <th key={b} className="px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-gray-500">{bitLabels[b]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role, i) => (
                  <tr key={role} className={i > 0 ? 'border-t border-gray-200' : ''}>
                    <td className="px-4 py-3 text-gray-900 capitalize font-semibold text-sm">{role}</td>
                    {bits.map(bit => (
                      <td key={bit} className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          className={checkboxClass}
                          checked={perms[role][bit]}
                          onChange={() => togglePerm(role, bit)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">Octal Input (decode permissions)</label>
            <input
              type="text"
              className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 font-mono text-sm w-full"
              placeholder="e.g. 755"
              maxLength={3}
              value={octalInput}
              onChange={e => handleOctalInput(e.target.value)}
            />
            {octalError && <p className="text-red-600 text-xs mt-1">{octalError}</p>}
          </div>

          <div className="border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="px-4 py-2 text-gray-500 text-xs w-32">Octal</td>
                  <td className="px-4 py-2 text-gray-900 font-mono text-lg">{octal}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2 text-gray-500 text-xs">Symbolic</td>
                  <td className="px-4 py-2 text-gray-900 font-mono">{symbolic}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="px-4 py-2 text-gray-500 text-xs">Command</td>
                  <td className="px-4 py-2 text-gray-900 font-mono">{cmd}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      }
    />
  )
}

// ── Statistics Calculator ─────────────────────────────────────────────────────

export const StatisticsCalculator = () => {
  const [input, setInput] = useState('')
  const [stats, setStats] = useState<ReturnType<typeof calcStats> | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!input.trim()) {
      setStats(null)
      setError('')
      return
    }
    try {
      setStats(calcStats(input))
      setError('')
    } catch (e: any) {
      setStats(null)
      setError(e.message)
    }
  }, [input])

  const fmt = (n: number) => isNaN(n) ? 'N/A' : Number.isInteger(n) ? n.toString() : n.toFixed(4)

  return (
    <Panel
      backColor="lime"
      title="Statistics Calculator"
      description="Enter numbers one per line or comma-separated to calculate mean, median, mode, standard deviation, and more."
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">Numbers (one per line or comma-separated)</label>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:outline-none focus:border-gray-900 resize-y font-mono text-sm"
              rows={6}
              placeholder={"1, 2, 3, 4, 5\nor\n1\n2\n3"}
              value={input}
              onChange={e => setInput(e.target.value)}
            />
          </div>

          {error && <p className="text-red-600 text-sm font-mono">{error}</p>}

          {stats && !error && (
            <div className="border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Metric</th>
                    <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Count', stats.count],
                    ['Sum', fmt(stats.sum)],
                    ['Mean', fmt(stats.mean)],
                    ['Median', fmt(stats.median)],
                    ['Mode', stats.mode.length === 0 ? 'None' : stats.mode.map(fmt).join(', ')],
                    ['Std Dev (sample)', fmt(stats.stdDev)],
                    ['Min', fmt(stats.min)],
                    ['Max', fmt(stats.max)],
                    ['Range', fmt(stats.range)],
                  ].map(([label, value], i) => (
                    <tr key={String(label)} className={i > 0 ? 'border-t border-gray-200' : ''}>
                      <td className="px-4 py-2 text-gray-500 text-xs">{label}</td>
                      <td className="px-4 py-2 text-gray-900 font-mono text-right">{String(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      }
    />
  )
}

// ── cURL to Fetch ─────────────────────────────────────────────────────────────
export const CurlToFetch = () => {
  const [fromValue, setFromValue] = useState('')
  const [toValue, setToValue] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const from = searchParams.get('from') ?? ''
    if (from) setFromValue(decodeURIComponent(from))
  }, [])

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('')
      return
    }
    try {
      setToValue(curlToFetch(fromValue))
    } catch (e: any) {
      setToValue(`// Error: ${e.message}`)
    }
  }, [fromValue])

  return (
    <BasicConverter
      backColor="lime"
      title="cURL to Fetch Converter"
      description="Convert a [1curl2] command into a JavaScript [1fetch()2] call. Supports headers, methods, and body."
      fromTitle="cURL Command"
      toTitle="fetch() Code"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  )
}

// ── Text Statistics ───────────────────────────────────────────────────────────

export const TextStatistics = () => {
  const [text, setText] = useState('')

  const freq = getWordFrequency(text)
  const readingTime = estimateReadingTime(text)
  const fleschScore = fleschReadingEase(text)
  const readabilityLabel = fleschLabel(fleschScore)

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  const charCount = text.length
  const charNoSpaces = text.replace(/\s/g, '').length
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length

  return (
    <Panel
      backColor="lime"
      title="Text Statistics"
      description="Analyze text to get word frequency, reading time, readability score, and more."
      extraElements={
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 block">Input Text</label>
            <textarea
              className="bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:outline-none focus:border-gray-900 resize-y font-mono text-sm"
              rows={6}
              placeholder="Paste or type text here..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
          </div>

          {text.trim() && (
            <>
              <div className="border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Metric</th>
                      <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Words', wordCount],
                      ['Characters', charCount],
                      ['Characters (no spaces)', charNoSpaces],
                      ['Sentences', sentenceCount],
                      ['Reading Time', readingTime],
                      ['Readability (Flesch)', `${Math.round(fleschScore)} — ${readabilityLabel}`],
                    ].map(([label, value], i) => (
                      <tr key={String(label)} className={i > 0 ? 'border-t border-gray-200' : ''}>
                        <td className="px-4 py-2 text-gray-500 text-xs">{label}</td>
                        <td className="px-4 py-2 text-gray-900 font-mono text-right">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {freq.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Top 20 words by frequency</p>
                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">#</th>
                          <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Word</th>
                          <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {freq.slice(0, 20).map(({word, count}, i) => (
                          <tr key={word} className={i > 0 ? 'border-t border-gray-200' : ''}>
                            <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-2 text-gray-900 font-mono">{word}</td>
                            <td className="px-4 py-2 text-gray-900 font-mono text-right">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {!text.trim() && (
            <p className="text-gray-400 text-sm text-center py-4">Enter text above to see statistics</p>
          )}
        </div>
      }
    />
  )
}
