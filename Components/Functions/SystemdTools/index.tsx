'use client'

import { useState, useEffect } from 'react'
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter'
import { generateSystemdService, SYSTEMD_EXAMPLE } from './logic'

export const SystemdGenerator = () => {
  const [fromValue, setFromValue] = useState(SYSTEMD_EXAMPLE)
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
      setToValue(generateSystemdService(fromValue))
    } catch (e: any) {
      setToValue('# Error: ' + e.message)
    }
  }, [fromValue])

  return (
    <BasicConverter
      backColor="lime"
      title="systemd Service Generator"
      description="Generate a [1.service2] unit file from key=value options. Supports [1exec_start2], [1user2], [1restart policy2], environment variables, and dependencies."
      fromTitle="Options (key=value)"
      toTitle=".service unit file"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  )
}
