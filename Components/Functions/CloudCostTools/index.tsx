'use client'

import { useState, useEffect } from 'react'
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter'
import { estimateCloudCost, formatCostEstimate, CLOUD_COST_EXAMPLE } from './logic'

export const CloudCostEstimator = () => {
  const [fromValue, setFromValue] = useState(CLOUD_COST_EXAMPLE)
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
      const estimate = estimateCloudCost(fromValue)
      setToValue(formatCostEstimate(estimate))
    } catch (e: any) {
      setToValue('# Error: ' + e.message)
    }
  }, [fromValue])

  return (
    <BasicConverter
      backColor="lime"
      title="Cloud Cost Estimator"
      description="Estimate monthly cloud costs for AWS, GCP, and Azure. Describe your workload in plain text, e.g. [12 vCPU 4GB RAM, 100GB SSD, 1TB transfer/month2]. Pricing based on ~2024 public list prices."
      fromTitle="Workload description"
      toTitle="Cost estimates (USD/month)"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  )
}
