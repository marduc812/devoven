'use client'

import { useState, useEffect } from 'react'
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter'
import {
  generatePipeline,
  CiPlatform,
  ProjectType,
  CICD_GEN_EXAMPLE,
  PLATFORM_LABELS,
  PROJECT_TYPE_LABELS,
} from './logic'
import { useShareLink } from '@/Components/Functions/ShareLink'

const PLATFORMS: CiPlatform[] = ['github-actions', 'gitlab-ci', 'circleci']
const PROJECT_TYPES: ProjectType[] = ['node', 'python', 'go', 'rust', 'docker', 'generic']

export const CicdPipelineGenerator = () => {
  const [fromValue, setFromValue] = useState(CICD_GEN_EXAMPLE)
  const [toValue, setToValue] = useState('')
  const [platform, setPlatform] = useState<CiPlatform>('github-actions')
  const [projectType, setProjectType] = useState<ProjectType>('node')

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    )
    const from = searchParams.get('from')
    if (from) setFromValue(decodeURIComponent(from))
    const p = searchParams.get('platform') as CiPlatform | null
    if (p && PLATFORMS.indexOf(p) !== -1) setPlatform(p)
    const pt = searchParams.get('project') as ProjectType | null
    if (pt && PROJECT_TYPES.indexOf(pt) !== -1) setProjectType(pt)
  }, [])

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ platform, project: projectType })

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('')
      return
    }
    try {
      setToValue(generatePipeline(fromValue, platform, projectType))
    } catch (e: any) {
      setToValue('# Error: ' + e.message)
    }
  }, [fromValue, platform, projectType])

  return (
    <AdvancedConverter
      backColor="lime"
      title="CI/CD Pipeline Generator"
      description="Generate CI/CD pipeline configuration for [1GitHub Actions2], [1GitLab CI2], or [1CircleCI2]. Supports Node.js, Python, Go, Rust, and Docker projects with caching, testing, build, and deploy steps."
      fromTitle="Pipeline options (key=value)"
      toTitle="Pipeline YAML"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      extraElements={
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 shrink-0">Platform</label>
            <select
              className="bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
              value={platform}
              onChange={function(e) { setPlatform(e.target.value as CiPlatform) }}
            >
              {PLATFORMS.map(function(p) {
                return <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              })}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 shrink-0">Project type</label>
            <select
              className="bg-white text-gray-900 p-2 border border-gray-200 focus:border-gray-400 focus:outline-none text-sm"
              value={projectType}
              onChange={function(e) { setProjectType(e.target.value as ProjectType) }}
            >
              {PROJECT_TYPES.map(function(pt) {
                return <option key={pt} value={pt}>{PROJECT_TYPE_LABELS[pt]}</option>
              })}
            </select>
          </div>
        </div>
      }
    />
  )
}
