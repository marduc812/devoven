'use client'

import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { IoClipboardOutline, IoTimeOutline } from 'react-icons/io5'

const inputClass = "w-full border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-gray-900 focus:outline-none transition-colors text-sm font-mono placeholder:text-gray-400"

const outputRowClass = "flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2"

type FormatResult = { label: string; value: string }

const UnixTimestampView = () => {
    const [tsInput, setTsInput] = useState('')
    const [tsMode, setTsMode] = useState<'auto' | 's' | 'ms'>('auto')
    const [tsResults, setTsResults] = useState<FormatResult[]>([])
    const [tsError, setTsError] = useState('')

    const [dtInput, setDtInput] = useState('')
    const [dtResults, setDtResults] = useState<FormatResult[]>([])

    const copy = (value: string) => {
        navigator.clipboard.writeText(value)
        toast.success('Copied to clipboard')
    }

    const tsToMs = (raw: string, mode: 'auto' | 's' | 'ms'): number => {
        const n = Number(raw)
        if (mode === 'ms') return n
        if (mode === 's') return n * 1000
        return raw.replace('.', '').length >= 13 ? n : n * 1000
    }

    useEffect(() => {
        if (!tsInput.trim()) { setTsResults([]); setTsError(''); return }
        const raw = tsInput.trim()
        if (!/^-?\d+(\.\d+)?$/.test(raw)) { setTsError('Invalid timestamp'); setTsResults([]); return }
        const ms = tsToMs(raw, tsMode)
        const d = new Date(ms)
        if (isNaN(d.getTime())) { setTsError('Invalid timestamp'); setTsResults([]); return }
        setTsError('')
        setTsResults([
            { label: 'ISO 8601', value: d.toISOString() },
            { label: 'UTC', value: d.toUTCString() },
            { label: 'Local', value: d.toLocaleString() },
            { label: 'Unix (s)', value: Math.floor(ms / 1000).toString() },
            { label: 'Unix (ms)', value: ms.toString() },
        ])
    }, [tsInput, tsMode])

    useEffect(() => {
        if (!dtInput) { setDtResults([]); return }
        const d = new Date(dtInput)
        if (isNaN(d.getTime())) { setDtResults([]); return }
        const ms = d.getTime()
        setDtResults([
            { label: 'Unix (s)', value: Math.floor(ms / 1000).toString() },
            { label: 'Unix (ms)', value: ms.toString() },
        ])
    }, [dtInput])

    const useNow = () => {
        const now = new Date()
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        setDtInput(local)
    }

    const modeBtn = (m: 'auto' | 's' | 'ms', label: string) => (
        <button
            key={m}
            onClick={() => setTsMode(m)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                tsMode === m
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
        >
            {label}
        </button>
    )

    return (
        <div className="flex flex-col gap-6">
            {/* Timestamp → Human */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h2 className="text-sm font-medium text-gray-300">Timestamp → Human</h2>
                    <div className="flex items-center gap-1">
                        {modeBtn('auto', 'Auto')}
                        {modeBtn('s', 'Seconds')}
                        {modeBtn('ms', 'Milliseconds')}
                    </div>
                </div>
                <input
                    type="text"
                    value={tsInput}
                    onChange={(e) => setTsInput(e.target.value)}
                    placeholder="e.g. 1710000000 or 1710000000000"
                    className={inputClass}
                />
                {tsError && <p className="text-xs text-red-400">{tsError}</p>}
                {tsResults.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {tsResults.map(({ label, value }) => (
                            <div key={label} className={outputRowClass}>
                                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                                <span className="text-sm text-white font-mono flex-1 truncate">{value}</span>
                                <button onClick={() => copy(value)} className="text-gray-600 hover:text-white transition-colors flex-shrink-0">
                                    <IoClipboardOutline className="text-base" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-white/8" />

            {/* Human → Timestamp */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-300">Human → Timestamp</h2>
                    <button
                        onClick={useNow}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 rounded-lg px-2.5 py-1 transition-all duration-200"
                    >
                        <IoTimeOutline />
                        Use now
                    </button>
                </div>
                <input
                    type="datetime-local"
                    value={dtInput}
                    onChange={(e) => setDtInput(e.target.value)}
                    className={inputClass}
                />
                {dtResults.length > 0 && (
                    <div className="flex flex-col gap-2">
                        {dtResults.map(({ label, value }) => (
                            <div key={label} className={outputRowClass}>
                                <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
                                <span className="text-sm text-white font-mono flex-1 truncate">{value}</span>
                                <button onClick={() => copy(value)} className="text-gray-600 hover:text-white transition-colors flex-shrink-0">
                                    <IoClipboardOutline className="text-base" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default UnixTimestampView
