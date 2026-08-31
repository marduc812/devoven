'use client'

import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import Panel from '@/Components/MainView/MainPanel/Panel'
import {
  btnClass,
  btnSecondaryClass,
  hintClass,
  inputClass,
  labelClass,
  paneClass,
  sectionClass,
  segOff,
  segOn,
} from '@/Components/MainView/MainPanel/formControls'
import {
  calcK8sResources,
  nodeFits,
  parseK8sResourceInput,
  resourcesYaml,
  K8sResourceInput,
  QOS_EXPLANATIONS,
} from './logic'

const EMPTY: K8sResourceInput = { cpuRequest: '', cpuLimit: '', memRequest: '', memLimit: '' }

const FIELDS: Array<{ id: keyof K8sResourceInput; label: string; placeholder: string }> = [
  { id: 'cpuRequest', label: 'CPU request', placeholder: '250m' },
  { id: 'cpuLimit', label: 'CPU limit', placeholder: '1' },
  { id: 'memRequest', label: 'Memory request', placeholder: '512Mi' },
  { id: 'memLimit', label: 'Memory limit', placeholder: '1Gi' },
]

const PRESETS: Array<{ label: string; values: K8sResourceInput }> = [
  { label: 'Sidecar', values: { cpuRequest: '50m', cpuLimit: '200m', memRequest: '64Mi', memLimit: '128Mi' } },
  { label: 'Web app', values: { cpuRequest: '250m', cpuLimit: '1', memRequest: '512Mi', memLimit: '1Gi' } },
  { label: 'Worker', values: { cpuRequest: '500m', cpuLimit: '2', memRequest: '1Gi', memLimit: '2Gi' } },
  { label: 'Guaranteed', values: { cpuRequest: '1', cpuLimit: '1', memRequest: '2Gi', memLimit: '2Gi' } },
]

// QoS is the headline result, so each class gets its own colour. All three
// triples have .dark overrides in globals.css.
const QOS_STYLE: Record<string, string> = {
  Guaranteed: 'bg-emerald-100 border-emerald-200 text-emerald-700',
  Burstable: 'bg-amber-100 border-amber-200 text-amber-700',
  BestEffort: 'bg-red-100 border-red-200 text-red-700',
}

const fmt = (n: number, digits: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

export const K8sResourceCalculator = () => {
  const [input, setInput] = useState<K8sResourceInput>(PRESETS[1].values)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // ?from= still accepts the old key=value payload so existing links keep working.
    const from = params.get('from')
    let seeded = from ? parseK8sResourceInput(from) : null
    for (const field of FIELDS) {
      const value = params.get(field.id)
      if (value !== null) seeded = { ...(seeded ?? EMPTY), [field.id]: value }
    }
    if (seeded) setInput(seeded)
  }, [])

  const result = useMemo(() => calcK8sResources(input), [input])
  const yaml = useMemo(() => resourcesYaml(input), [input])
  const fits = useMemo(
    () => nodeFits(result.cpuLimitMillicores, result.memLimitMiB),
    [result.cpuLimitMillicores, result.memLimitMiB],
  )
  const anyFit = fits.some(f => f.replicas > 0)

  const setField = (id: keyof K8sResourceInput, value: string) =>
    setInput(prev => ({ ...prev, [id]: value }))

  const matchesPreset = (values: K8sResourceInput) =>
    FIELDS.every(f => values[f.id] === input[f.id])

  const copyYaml = async () => {
    await navigator.clipboard.writeText(yaml)
    toast.success('Copied to clipboard!')
  }

  return (
    <Panel
      title="Kubernetes Resource Calculator"
      description="Enter a container's CPU and memory requests and limits to see them normalised, validated, and classified. Accepts every form Kubernetes does — [1 250m 2], [1 0.5 2], [1 512Mi 2], [1 1Gi 2], [1 500M 2]. Seedable from the URL, e.g. [1 ?cpuRequest=250m&memLimit=1Gi 2]."
      backColor="lime"
      extraElements={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          {/* Input */}
          <div className="flex flex-col gap-8">
            <div>
              <p className={sectionClass}>Container resources</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {FIELDS.map(field => (
                  <div key={field.id}>
                    <label className={labelClass} htmlFor={`k8s-${field.id}`}>{field.label}</label>
                    <input
                      id={`k8s-${field.id}`}
                      className={`${inputClass} font-mono`}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={field.placeholder}
                      value={input[field.id]}
                      onChange={e => setField(field.id, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <p className={hintClass}>Leave a field empty to omit it from the spec.</p>
            </div>

            <div>
              <p className={sectionClass}>Presets</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    className={matchesPreset(preset.values) ? segOn : segOff}
                    onClick={() => setInput(preset.values)}
                  >
                    {preset.label}
                  </button>
                ))}
                <button className={segOff} onClick={() => setInput(EMPTY)}>Clear</button>
              </div>
            </div>

            <div>
              <p className={sectionClass}>Manifest snippet</p>
              <textarea className={`${paneClass} min-h-[180px]`} value={yaml} readOnly spellCheck={false} />
              <div className="flex flex-wrap gap-3 mt-3">
                <button className={btnClass} onClick={copyYaml}>Copy YAML</button>
                <button className={btnSecondaryClass} onClick={() => setInput(PRESETS[1].values)}>Reset</button>
              </div>
              <p className={hintClass}>Goes under a container in <span className="font-mono">spec.containers[]</span>.</p>
            </div>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-8">
            {result.errors.length > 0 && (
              <div className="border border-red-200 bg-red-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-red-700 mb-2">
                  {result.errors.length === 1 ? 'Problem' : 'Problems'}
                </p>
                <ul className="flex flex-col gap-1">
                  {result.errors.map(err => (
                    <li key={err} className="text-sm text-red-700">{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className={sectionClass}>QoS class</p>
              <div className={`border p-4 ${QOS_STYLE[result.qosClass]}`}>
                <p className="text-xl font-black tracking-tight">{result.qosClass}</p>
              </div>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{QOS_EXPLANATIONS[result.qosClass]}</p>
            </div>

            <div>
              <p className={sectionClass}>Normalised</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left font-bold uppercase tracking-wider text-xs text-gray-500 pb-2"></th>
                      <th className="text-right font-bold uppercase tracking-wider text-xs text-gray-500 pb-2">Request</th>
                      <th className="text-right font-bold uppercase tracking-wider text-xs text-gray-500 pb-2">Limit</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600 font-sans">CPU (millicores)</td>
                      <td className="py-2 text-right text-gray-900">{result.cpuRequestMillicores}m</td>
                      <td className="py-2 text-right text-gray-900">{result.cpuLimitMillicores}m</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600 font-sans">CPU (cores)</td>
                      <td className="py-2 text-right text-gray-900">{fmt(result.cpuRequestCores, 3)}</td>
                      <td className="py-2 text-right text-gray-900">{fmt(result.cpuLimitCores, 3)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600 font-sans">Memory (MiB)</td>
                      <td className="py-2 text-right text-gray-900">{fmt(result.memRequestMiB, 2)}</td>
                      <td className="py-2 text-right text-gray-900">{fmt(result.memLimitMiB, 2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-gray-600 font-sans">Memory (GiB)</td>
                      <td className="py-2 text-right text-gray-900">{fmt(result.memRequestGiB, 3)}</td>
                      <td className="py-2 text-right text-gray-900">{fmt(result.memLimitGiB, 3)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className={sectionClass}>Replicas per node</p>
              {anyFit ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left font-bold uppercase tracking-wider text-xs text-gray-500 pb-2">Node</th>
                        <th className="text-right font-bold uppercase tracking-wider text-xs text-gray-500 pb-2">Capacity</th>
                        <th className="text-right font-bold uppercase tracking-wider text-xs text-gray-500 pb-2">Replicas</th>
                        <th className="text-right font-bold uppercase tracking-wider text-xs text-gray-500 pb-2">Bound by</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fits.map(fit => (
                        <tr key={fit.name} className="border-b border-gray-100 last:border-0">
                          <td className="py-2 font-mono text-gray-900">{fit.name}</td>
                          <td className="py-2 text-right text-gray-500 font-mono text-xs">
                            {fit.cpu / 1000} vCPU / {fit.mem / 1024} GiB
                          </td>
                          <td className={`py-2 text-right font-mono ${fit.replicas > 0 ? 'text-gray-900' : 'text-red-700'}`}>
                            {fit.replicas > 0 ? fit.replicas : 'none'}
                          </td>
                          <td className="py-2 text-right text-gray-500 text-xs">
                            {fit.replicas > 0 ? fit.boundBy : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-red-700">
                  No standard node size fits these limits. Split the workload, or use a larger instance type.
                </p>
              )}
              <p className={hintClass}>
                Raw capacity by limit. Real schedulable capacity is lower — the kubelet, the CNI and system
                reservations take a slice of every node.
              </p>
            </div>
          </div>
        </div>
      }
    />
  )
}
