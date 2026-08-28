'use client'

import { useState, useEffect } from 'react'
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter'
import { generateK8sYaml, K8sResourceType, K8S_EXAMPLE } from './logic'

const RESOURCE_TYPES: K8sResourceType[] = ['Deployment', 'Service', 'Ingress', 'ConfigMap', 'Secret']

export const K8sYamlGenerator = () => {
  const [fromValue, setFromValue] = useState(K8S_EXAMPLE)
  const [toValue, setToValue] = useState('')
  const [resourceType, setResourceType] = useState<K8sResourceType>('Deployment')

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
      setToValue(generateK8sYaml(fromValue, resourceType))
    } catch (e: any) {
      setToValue('# Error: ' + e.message)
    }
  }, [fromValue, resourceType])

  return (
    <AdvancedConverter
      backColor="lime"
      title="Kubernetes YAML Generator"
      description="Generate Kubernetes resource YAML from key=value options. Supports [1Deployment2], [1Service2], [1Ingress2], [1ConfigMap2], and [1Secret2]."
      fromTitle="Options (key=value)"
      toTitle="YAML output"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      extraElements={
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-400 shrink-0">Resource type</label>
          <select
            className="bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
            value={resourceType}
            onChange={function(e) { setResourceType(e.target.value as K8sResourceType) }}
          >
            {RESOURCE_TYPES.map(function(t) {
              return <option key={t} value={t}>{t}</option>
            })}
          </select>
        </div>
      }
    />
  )
}
