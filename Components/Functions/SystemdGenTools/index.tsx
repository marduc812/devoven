'use client'

import { useState, useEffect } from 'react'
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter'
import { generateSystemdUnit, ServiceType, SYSTEMD_GEN_EXAMPLE, SERVICE_TYPE_DESCRIPTIONS } from './logic'

const SERVICE_TYPES: ServiceType[] = ['simple', 'oneshot', 'forking', 'notify', 'dbus', 'idle']

export const SystemdUnitGenerator = () => {
  const [fromValue, setFromValue] = useState(SYSTEMD_GEN_EXAMPLE)
  const [toValue, setToValue] = useState('')
  const [serviceType, setServiceType] = useState<ServiceType>('simple')

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const from = searchParams.get('from')
    if (from) setFromValue(decodeURIComponent(from))
    const type = searchParams.get('type') as ServiceType | null
    if (type && SERVICE_TYPES.indexOf(type) !== -1) setServiceType(type)
  }, [])

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('')
      return
    }
    try {
      setToValue(generateSystemdUnit(fromValue, serviceType))
    } catch (e: any) {
      setToValue('# Error: ' + e.message)
    }
  }, [fromValue, serviceType])

  return (
    <AdvancedConverter
      backColor="lime"
      title="Systemd Unit File Generator"
      description="Generate complete systemd [1.service2] unit files. Supports [1simple2], [1oneshot2], [1forking2], [1notify2] service types. Configure [1ExecStart2], [1User2], [1Restart2], [1Environment2], and dependency directives."
      fromTitle="Service options (key=value)"
      toTitle=".service unit file"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      extraElements={
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-400 shrink-0">Service type</label>
            <select
              className="bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
              value={serviceType}
              onChange={function(e) { setServiceType(e.target.value as ServiceType) }}
            >
              {SERVICE_TYPES.map(function(t) {
                return <option key={t} value={t}>{t}</option>
              })}
            </select>
          </div>
          <p className="text-xs text-gray-500">{SERVICE_TYPE_DESCRIPTIONS[serviceType]}</p>
        </div>
      }
    />
  )
}
