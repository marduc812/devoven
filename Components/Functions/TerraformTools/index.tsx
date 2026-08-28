'use client'

import { useState, useEffect } from 'react'
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter'
import {
  generateTerraformVarBlocks,
  tfvarsToVarFlags,
  varFlagsToTfvars,
  TERRAFORM_EXAMPLE,
} from './logic'

type TerraformMode = 'vars' | 'tfvars-to-flags' | 'flags-to-tfvars'

const MODE_LABELS: Record<TerraformMode, string> = {
  'vars': 'Variable blocks (.tf)',
  'tfvars-to-flags': '.tfvars → -var flags',
  'flags-to-tfvars': '-var flags → .tfvars',
}

const MODE_FROM_TITLES: Record<TerraformMode, string> = {
  'vars': 'Variable definitions (key=type:default:description)',
  'tfvars-to-flags': '.tfvars content',
  'flags-to-tfvars': 'terraform -var flags',
}

const MODE_TO_TITLES: Record<TerraformMode, string> = {
  'vars': 'HCL variable blocks',
  'tfvars-to-flags': 'terraform -var flags',
  'flags-to-tfvars': '.tfvars content',
}

const MODE_EXAMPLES: Record<TerraformMode, string> = {
  'vars': TERRAFORM_EXAMPLE,
  'tfvars-to-flags': 'region = "us-east-1"\ninstance_type = "t3.micro"\nenvironment = "staging"',
  'flags-to-tfvars': '-var "region=us-east-1" -var "instance_type=t3.micro" -var "environment=staging"',
}

export const TerraformGenerator = () => {
  const [mode, setMode] = useState<TerraformMode>('vars')
  const [fromValue, setFromValue] = useState(TERRAFORM_EXAMPLE)
  const [toValue, setToValue] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const from = searchParams.get('from')
    if (from) setFromValue(decodeURIComponent(from))
  }, [])

  useEffect(() => {
    setFromValue(MODE_EXAMPLES[mode])
  }, [mode])

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('')
      return
    }
    try {
      let result = ''
      if (mode === 'vars') {
        result = generateTerraformVarBlocks(fromValue)
      } else if (mode === 'tfvars-to-flags') {
        result = tfvarsToVarFlags(fromValue)
      } else {
        result = varFlagsToTfvars(fromValue)
      }
      setToValue(result)
    } catch (e: any) {
      setToValue('# Error: ' + e.message)
    }
  }, [fromValue, mode])

  const modes = Object.keys(MODE_LABELS) as TerraformMode[]

  return (
    <AdvancedConverter
      backColor="lime"
      title="Terraform Variable Generator"
      description="Generate Terraform [1variable blocks2] from definitions, convert [1.tfvars2] to CLI flags, or convert [1-var flags2] back to .tfvars."
      fromTitle={MODE_FROM_TITLES[mode]}
      toTitle={MODE_TO_TITLES[mode]}
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      extraElements={
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs text-gray-400 shrink-0">Mode</label>
          <div className="flex gap-2 flex-wrap">
            {modes.map(function(m) {
              return (
                <button
                  key={m}
                  onClick={function() { setMode(m) }}
                  className={
                    'px-3 py-1.5 text-xs border transition-colors ' +
                    (mode === m
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                      : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-300')
                  }
                >
                  {MODE_LABELS[m]}
                </button>
              )
            })}
          </div>
        </div>
      }
    />
  )
}
