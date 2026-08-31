'use client'

import { useState, useEffect, useMemo } from 'react'
import Panel from '@/Components/MainView/MainPanel/Panel'
import {
  btnClass,
  btnSecondaryClass,
  hintClass,
  inputClass,
  labelClass,
  paneClass,
  sectionClass,
  selectClass,
} from '@/Components/MainView/MainPanel/formControls'
import {
  buildSystemdUnit,
  parseSystemdGenInput,
  systemdFilename,
  RESTART_POLICIES,
  SERVICE_TYPES,
  SERVICE_TYPE_DESCRIPTIONS,
  SYSTEMD_DEFAULTS,
  RestartPolicy,
  ServiceType,
  SystemdGenOptions,
} from './logic'

type TextKey = Exclude<keyof SystemdGenOptions, 'serviceType' | 'restart' | 'restartSec' | 'timeoutStartSec' | 'timeoutStopSec'>
type NumberKey = 'restartSec' | 'timeoutStartSec' | 'timeoutStopSec'

interface Field {
  id: TextKey
  label: string
  placeholder: string
  hint?: string
  wide?: boolean
}

// [Unit] — what the service is and what it starts after.
const UNIT_FIELDS: Field[] = [
  { id: 'description', label: 'Description', placeholder: 'My Node.js Application', wide: true },
  { id: 'documentation', label: 'Documentation', placeholder: 'https://example.com/docs', wide: true },
  { id: 'after', label: 'After', placeholder: 'network.target postgresql.service', hint: 'Ordering only — start after these units.' },
  { id: 'wants', label: 'Wants', placeholder: 'redis.service', hint: 'Soft dependency; the service still starts if these fail.' },
  { id: 'requires', label: 'Requires', placeholder: 'postgresql.service', hint: 'Hard dependency; failure here stops the service.' },
  { id: 'conflicts', label: 'Conflicts', placeholder: 'apache2.service', hint: 'These are stopped when the service starts.' },
]

// [Service] — how it runs.
const SERVICE_FIELDS: Field[] = [
  { id: 'execStart', label: 'ExecStart', placeholder: '/usr/bin/node /var/app/server.js', wide: true, hint: 'Absolute path. systemd does not run it through a shell.' },
  { id: 'execStop', label: 'ExecStop', placeholder: '/usr/bin/myapp --shutdown' },
  { id: 'execReload', label: 'ExecReload', placeholder: '/bin/kill -HUP $MAINPID' },
  { id: 'user', label: 'User', placeholder: 'appuser' },
  { id: 'group', label: 'Group', placeholder: 'appgroup' },
  { id: 'workingDirectory', label: 'Working Directory', placeholder: '/var/app' },
  { id: 'environmentFile', label: 'Environment File', placeholder: '/etc/myapp/env' },
  { id: 'environment', label: 'Environment', placeholder: 'NODE_ENV=production,PORT=3000', wide: true, hint: 'Comma-separated KEY=VALUE pairs; each becomes its own Environment= line.' },
  { id: 'killMode', label: 'Kill Mode', placeholder: 'control-group' },
]

const INSTALL_FIELDS: Field[] = [
  { id: 'wantedBy', label: 'WantedBy', placeholder: 'multi-user.target', hint: 'The target that pulls this service in when enabled.' },
  { id: 'requiredBy', label: 'RequiredBy', placeholder: '' },
]

const NUMBER_FIELDS: Array<{ id: NumberKey; label: string; hint: string }> = [
  { id: 'restartSec', label: 'Restart Sec', hint: 'Delay before a restart.' },
  { id: 'timeoutStartSec', label: 'Timeout Start Sec', hint: '0 omits the directive.' },
  { id: 'timeoutStopSec', label: 'Timeout Stop Sec', hint: '0 omits the directive.' },
]

// Every field is seedable from its own query param, so a configured unit is shareable.
const URL_PARAM_KEYS: Array<keyof SystemdGenOptions> = [
  'description', 'documentation', 'after', 'wants', 'requires', 'conflicts',
  'execStart', 'execStop', 'execReload', 'user', 'group', 'workingDirectory',
  'environment', 'environmentFile', 'killMode', 'pidFile', 'wantedBy', 'requiredBy',
]

export const SystemdUnitGenerator = () => {
  const [opts, setOpts] = useState<SystemdGenOptions>(SYSTEMD_DEFAULTS)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // ?from= still accepts the old key=value payload so existing links keep working.
    const from = params.get('from')
    const type = params.get('type') as ServiceType | null
    const seedType = type && SERVICE_TYPES.indexOf(type) !== -1 ? type : SYSTEMD_DEFAULTS.serviceType
    let seeded: SystemdGenOptions = from
      ? parseSystemdGenInput(from, seedType)
      : { ...SYSTEMD_DEFAULTS, serviceType: seedType }

    for (const key of URL_PARAM_KEYS) {
      const value = params.get(key)
      if (value !== null) seeded = { ...seeded, [key]: value }
    }
    const restart = params.get('restart') as RestartPolicy | null
    if (restart && RESTART_POLICIES.indexOf(restart) !== -1) seeded = { ...seeded, restart }

    setOpts(seeded)
  }, [])

  const unit = useMemo(() => buildSystemdUnit(opts), [opts])
  const forkingNeedsPid = opts.serviceType === 'forking' && !opts.pidFile.trim()

  const setField = <K extends keyof SystemdGenOptions>(id: K, value: SystemdGenOptions[K]) =>
    setOpts(prev => ({ ...prev, [id]: value }))

  const download = () => {
    const blob = new Blob([unit + '\n'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = systemdFilename(opts)
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  const renderField = (field: Field) => (
    <div key={field.id} className={field.wide ? 'md:col-span-2' : undefined}>
      <label className={labelClass} htmlFor={`systemd-${field.id}`}>{field.label}</label>
      <input
        id={`systemd-${field.id}`}
        className={inputClass}
        type="text"
        autoComplete="off"
        spellCheck={false}
        placeholder={field.placeholder}
        value={opts[field.id]}
        onChange={e => setField(field.id, e.target.value)}
      />
      {field.hint && <p className={hintClass}>{field.hint}</p>}
    </div>
  )

  return (
    <Panel
      title="Systemd Unit File Generator"
      description="Fill in the directives to build a complete [1 .service 2] unit file. Covers the [1 simple 2], [1 oneshot 2], [1 forking 2] and [1 notify 2] service types, dependency ordering, environment, and restart policy. Any field can be pre-filled from the URL, e.g. [1 ?description=My+App&execStart=/usr/bin/myapp 2]."
      backColor="lime"
      extraElements={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          {/* Form */}
          <div className="flex flex-col gap-8">
            <div>
              <p className={sectionClass}>[Unit]</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {UNIT_FIELDS.map(renderField)}
              </div>
            </div>

            <div>
              <p className={sectionClass}>[Service]</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className={labelClass} htmlFor="systemd-type">Type</label>
                  <select
                    id="systemd-type"
                    className={selectClass}
                    value={opts.serviceType}
                    onChange={e => setField('serviceType', e.target.value as ServiceType)}
                  >
                    {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <p className={hintClass}>{SERVICE_TYPE_DESCRIPTIONS[opts.serviceType]}</p>
                </div>

                <div>
                  <label className={labelClass} htmlFor="systemd-restart">Restart</label>
                  <select
                    id="systemd-restart"
                    className={selectClass}
                    value={opts.restart}
                    onChange={e => setField('restart', e.target.value as RestartPolicy)}
                  >
                    {RESTART_POLICIES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {SERVICE_FIELDS.map(renderField)}

                {/* PIDFile only means anything for forking services. */}
                {opts.serviceType === 'forking' && (
                  <div className="md:col-span-2">
                    <label className={labelClass} htmlFor="systemd-pidFile">PID File</label>
                    <input
                      id="systemd-pidFile"
                      className={inputClass}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="/var/run/myapp.pid"
                      value={opts.pidFile}
                      onChange={e => setField('pidFile', e.target.value)}
                    />
                    <p className={forkingNeedsPid ? 'text-xs text-red-700 mt-1' : hintClass}>
                      {forkingNeedsPid
                        ? 'Forking services need a PIDFile, or systemd cannot track the main process.'
                        : 'systemd reads the main PID from this file.'}
                    </p>
                  </div>
                )}

                {NUMBER_FIELDS.map(field => (
                  <div key={field.id}>
                    <label className={labelClass} htmlFor={`systemd-${field.id}`}>{field.label}</label>
                    <input
                      id={`systemd-${field.id}`}
                      className={inputClass}
                      type="number"
                      min={0}
                      value={opts[field.id]}
                      onChange={e => setField(field.id, Math.max(0, parseInt(e.target.value, 10) || 0))}
                    />
                    <p className={hintClass}>{field.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className={sectionClass}>[Install]</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {INSTALL_FIELDS.map(renderField)}
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-8 lg:self-start">
            <p className={labelClass}>{systemdFilename(opts)}</p>
            <textarea
              className={`${paneClass} min-h-[520px]`}
              value={unit}
              readOnly
              spellCheck={false}
            />
            <div className="flex flex-wrap gap-3">
              <button className={btnClass} onClick={download}>Download unit file</button>
              <button
                className={btnSecondaryClass}
                onClick={() => setOpts(SYSTEMD_DEFAULTS)}
              >
                Reset
              </button>
            </div>
            <p className={hintClass}>
              Save to <span className="font-mono">/etc/systemd/system/{systemdFilename(opts)}</span>, then run{' '}
              <span className="font-mono">systemctl daemon-reload</span> and{' '}
              <span className="font-mono">systemctl enable --now {systemdFilename(opts)}</span>.
            </p>
          </div>
        </div>
      }
    />
  )
}
