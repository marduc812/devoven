'use client'

import { useState, useEffect } from 'react'
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter'
import { convertPyToJs } from './logic'

export const PyToJs = () => {
  const [fromValue, setFromValue] = useState('')
  const [toValue, setToValue] = useState('')
  const [notes, setNotes] = useState<string[]>([])

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const from = searchParams.get('from') || ''
    if (from) setFromValue(decodeURIComponent(from))
  }, [])

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('')
      setNotes([])
      return
    }
    const result = convertPyToJs(fromValue)
    setToValue(result.output)
    setNotes(result.notes)
  }, [fromValue])

  return (
    <div className="flex flex-col gap-4">
      <BasicConverter
        backColor="cyan"
        title="Python to JS Syntax Converter"
        description="Convert [1Python2] syntax patterns to [1JavaScript2] equivalents. Pattern-based substitution — review the output carefully."
        fromTitle="Python Code"
        toTitle="JavaScript Code"
        fromValue={fromValue}
        toValue={toValue}
        setFromValue={setFromValue}
      />
      {notes.length > 0 && (
        <div className="mx-4 mb-4 border border-indigo-500/20 bg-indigo-500/5 p-4">
          <p className="text-xs text-indigo-400 font-semibold mb-2 uppercase tracking-wide">Conversion Notes</p>
          <ul className="space-y-1">
            {notes.map(function(note, i) {
              return (
                <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="text-indigo-400 mt-0.5 flex-shrink-0">→</span>
                  {note}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
