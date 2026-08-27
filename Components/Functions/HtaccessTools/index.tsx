'use client'

import { useState, useEffect } from 'react'
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter'
import { generateHtaccess, HTACCESS_EXAMPLE } from './logic'

export const HtaccessGenerator = () => {
  const [fromValue, setFromValue] = useState(HTACCESS_EXAMPLE)
  const [toValue, setToValue] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const from = searchParams.get('from')
    if (from) setFromValue(decodeURIComponent(from))
  }, [])

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('')
      return
    }
    try {
      setToValue(generateHtaccess(fromValue))
    } catch (e: any) {
      setToValue('# Error: ' + e.message)
    }
  }, [fromValue])

  return (
    <BasicConverter
      backColor="lime"
      title=".htaccess Generator"
      description="Generate Apache [1.htaccess2] rules from key=value options. Supports HTTPS redirect, CORS, cache headers, directory listing, and IP blocking."
      fromTitle="Options (key=value)"
      toTitle=".htaccess output"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  )
}
