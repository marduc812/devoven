'use client'

import { useState, useEffect } from 'react'
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter'
import { convertRegex, allFlavors, getFlavorLabel, RegexFlavor } from './logic'

export const RegexFlavorConverter = () => {
  const [fromValue, setFromValue] = useState('')
  const [toValue, setToValue] = useState('')
  const [fromFlavor, setFromFlavor] = useState<RegexFlavor>('javascript')
  const [toFlavor, setToFlavor] = useState<RegexFlavor>('python')
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
    const result = convertRegex(fromValue, fromFlavor, toFlavor)
    setToValue(result.converted)
    setNotes(result.notes)
  }, [fromValue, fromFlavor, toFlavor])

  const flavors = allFlavors()
  const selectClass = 'bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm'
  const labelClass = 'text-xs text-gray-400 mb-1 block'

  return (
    <div className="flex flex-col gap-4">
      <AdvancedConverter
        backColor="rose"
        title="Regex Flavor Converter"
        description="Convert regex patterns between [1JavaScript2], [1Python (re)2], [1PCRE2], and [1POSIX ERE2] flavors."
        fromTitle="Source Pattern"
        toTitle="Converted Pattern"
        fromValue={fromValue}
        toValue={toValue}
        setFromValue={setFromValue}
        extraElements={
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className={labelClass}>From Flavor</label>
              <select
                className={selectClass + ' w-full'}
                value={fromFlavor}
                onChange={function(e) { setFromFlavor(e.target.value as RegexFlavor) }}
              >
                {flavors.map(function(f) {
                  return <option key={f} value={f}>{getFlavorLabel(f)}</option>
                })}
              </select>
            </div>
            <div className="flex-1">
              <label className={labelClass}>To Flavor</label>
              <select
                className={selectClass + ' w-full'}
                value={toFlavor}
                onChange={function(e) { setToFlavor(e.target.value as RegexFlavor) }}
              >
                {flavors.map(function(f) {
                  return <option key={f} value={f}>{getFlavorLabel(f)}</option>
                })}
              </select>
            </div>
          </div>
        }
      />
      {notes.length > 0 && (
        <div className="mx-4 mb-2 border border-rose-500/20 bg-rose-500/5 p-4">
          <p className="text-xs text-rose-400 font-semibold mb-2 uppercase tracking-wide">Compatibility Notes</p>
          <ul className="space-y-1">
            {notes.map(function(note, i) {
              return (
                <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5 flex-shrink-0">→</span>
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
