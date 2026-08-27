'use client'

import { useState, useEffect } from 'react'
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter'
import { generateTerraformOutput, TF_VARS_EXAMPLE } from './logic'

export const TerraformVarsGenerator = () => {
  const [fromValue, setFromValue] = useState(TF_VARS_EXAMPLE)
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
    setToValue(generateTerraformOutput(fromValue))
  }, [fromValue])

  return (
    <BasicConverter
      backColor="lime"
      title="Terraform Variable Generator"
      description="Generate [1variables.tf2] and [1terraform.tfvars2] from a JSON object or [1key=value2] lines. Types are inferred automatically: string, number, bool, list(string), map(string), object()."
      fromTitle="JSON object or key=value pairs"
      toTitle="variables.tf + terraform.tfvars"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
    />
  )
}
