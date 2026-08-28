'use client'

import { useState, useEffect } from 'react'
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter'
import { formatK8sResult, calcK8sResources, parseK8sResourceInput, K8S_RESOURCE_EXAMPLE } from './logic'

export const K8sResourceCalculator = () => {
  const [fromValue, setFromValue] = useState(K8S_RESOURCE_EXAMPLE)
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
      const input = parseK8sResourceInput(fromValue)
      const result = calcK8sResources(input)
      setToValue(formatK8sResult(result))
    } catch (e: any) {
      setToValue('# Error: ' + e.message)
    }
  }, [fromValue])

  return (
    <AdvancedConverter
      backColor="lime"
      title="Kubernetes Resource Calculator"
      description="Calculate Kubernetes CPU and memory resources. Enter [1cpu_request2], [1cpu_limit2], [1mem_request2], [1mem_limit2] in key=value format. Supports [1250m2], [10.5 cores2], [1512Mi2], [11Gi2]."
      fromTitle="Resource spec (key=value)"
      toTitle="Parsed resources + QoS class"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      extraElements={<></>}
    />
  )
}
