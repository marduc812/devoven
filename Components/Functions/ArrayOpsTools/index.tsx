'use client'

import { useState, useEffect } from 'react'
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter'
import { applyOperation, ArrayOperation, SortMode, MapOp, JoinMode } from './logic'

export const ArrayOps = () => {
  const [fromValue, setFromValue] = useState('')
  const [toValue, setToValue] = useState('')
  const [operation, setOperation] = useState<ArrayOperation>('sort')
  const [sortMode, setSortMode] = useState<SortMode>('alpha-asc')
  const [mapOp, setMapOp] = useState<MapOp>('uppercase')
  const [mapArg, setMapArg] = useState('')
  const [filterRegex, setFilterRegex] = useState('')
  const [sliceN, setSliceN] = useState(10)
  const [joinMode, setJoinMode] = useState<JoinMode>('newline')
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

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
      setError(null)
      setCount(0)
      return
    }
    const result = applyOperation(fromValue, {
      operation,
      sortMode,
      mapOp,
      mapArg,
      filterRegex,
      sliceN,
      joinMode,
    })
    setToValue(result.joined)
    setError(result.error)
    setCount(result.count)
  }, [fromValue, operation, sortMode, mapOp, mapArg, filterRegex, sliceN, joinMode])

  const selectClass = 'bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm w-full'
  const labelClass = 'text-xs text-gray-400 mb-1 block'
  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm w-full font-mono'

  return (
    <AdvancedConverter
      backColor="lime"
      title="Array / List Operations"
      description="Perform common operations on a list of values (one per line). [1Sort2], [1deduplicate2], [1filter2], [1map2], and more."
      fromTitle="Input List (one item per line)"
      toTitle="Result"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Operation</label>
              <select
                className={selectClass}
                value={operation}
                onChange={function(e) { setOperation(e.target.value as ArrayOperation) }}
              >
                <option value="sort">Sort</option>
                <option value="reverse">Reverse</option>
                <option value="deduplicate">Deduplicate</option>
                <option value="shuffle">Shuffle</option>
                <option value="filter">Filter (regex)</option>
                <option value="map">Map (transform)</option>
                <option value="slice-first">Slice — First N</option>
                <option value="slice-last">Slice — Last N</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>Join Output As</label>
              <select
                className={selectClass}
                value={joinMode}
                onChange={function(e) { setJoinMode(e.target.value as JoinMode) }}
              >
                <option value="newline">Newline (one per line)</option>
                <option value="comma">Comma-separated</option>
                <option value="pipe">Pipe-separated</option>
                <option value="space">Space-separated</option>
                <option value="tab">Tab-separated</option>
              </select>
            </div>
          </div>

          {operation === 'sort' && (
            <div>
              <label className={labelClass}>Sort Mode</label>
              <select className={selectClass} value={sortMode} onChange={function(e) { setSortMode(e.target.value as SortMode) }}>
                <option value="alpha-asc">Alphabetical A→Z</option>
                <option value="alpha-desc">Alphabetical Z→A</option>
                <option value="numeric-asc">Numeric ascending</option>
                <option value="numeric-desc">Numeric descending</option>
                <option value="length-asc">By length (shortest first)</option>
                <option value="length-desc">By length (longest first)</option>
              </select>
            </div>
          )}

          {operation === 'filter' && (
            <div>
              <label className={labelClass}>Filter Regex</label>
              <input
                type="text"
                className={inputClass}
                placeholder="e.g. ^foo or \d+"
                value={filterRegex}
                onChange={function(e) { setFilterRegex(e.target.value) }}
              />
            </div>
          )}

          {operation === 'map' && (
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className={labelClass}>Transform</label>
                <select className={selectClass} value={mapOp} onChange={function(e) { setMapOp(e.target.value as MapOp) }}>
                  <option value="uppercase">Uppercase</option>
                  <option value="lowercase">Lowercase</option>
                  <option value="trim">Trim whitespace</option>
                  <option value="quote-single">Wrap in single quotes</option>
                  <option value="quote-double">Wrap in double quotes</option>
                  <option value="prefix">Add prefix</option>
                  <option value="suffix">Add suffix</option>
                </select>
              </div>
              {(mapOp === 'prefix' || mapOp === 'suffix') && (
                <div className="flex-1">
                  <label className={labelClass}>{mapOp === 'prefix' ? 'Prefix Text' : 'Suffix Text'}</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder={mapOp === 'prefix' ? 'e.g. https://' : 'e.g. .txt'}
                    value={mapArg}
                    onChange={function(e) { setMapArg(e.target.value) }}
                  />
                </div>
              )}
            </div>
          )}

          {(operation === 'slice-first' || operation === 'slice-last') && (
            <div>
              <label className={labelClass}>N (number of items)</label>
              <input
                type="number"
                className={inputClass}
                min={1}
                value={sliceN}
                onChange={function(e) { setSliceN(parseInt(e.target.value, 10) || 1) }}
              />
            </div>
          )}

          {error && (
            <div className="border border-red-500/20 bg-red-500/5 px-4 py-2">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {count > 0 && (
            <p className="text-xs text-gray-500">{count} item{count !== 1 ? 's' : ''} in result</p>
          )}
        </div>
      }
    />
  )
}
