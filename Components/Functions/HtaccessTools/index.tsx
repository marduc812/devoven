'use client'

import { useState, useEffect, useMemo } from 'react'
import Panel from '@/Components/MainView/MainPanel/Panel'
import {
  btnClass,
  btnSecondaryClass,
  checkboxClass,
  checkboxLabelClass,
  hintClass,
  inputClass,
  labelClass,
  paneClass,
  sectionClass,
  segOff,
  segOn,
  selectClass,
} from '@/Components/MainView/MainPanel/formControls'
import {
  buildHtaccess,
  parseHtaccessInput,
  HtaccessOptions,
  HTACCESS_DEFAULTS,
} from './logic'

type ToggleKey = 'https_redirect' | 'directory_listing' | 'cors' | 'cache'

const TOGGLES: Array<{ id: ToggleKey; label: string; hint: string; on: string; off: string }> = [
  {
    id: 'https_redirect',
    label: 'Force HTTPS',
    hint: 'Redirects every plain-HTTP request to the https:// equivalent.',
    on: 'yes',
    off: 'no',
  },
  {
    id: 'directory_listing',
    label: 'Disable directory listing',
    hint: 'Emits Options -Indexes, so a folder with no index file returns 403 instead of a file list.',
    on: 'no',
    off: 'yes',
  },
  {
    id: 'cors',
    label: 'Enable CORS',
    hint: 'Allow-Origin *, plus the usual methods and headers. Loosen or tighten before shipping.',
    on: 'yes',
    off: 'no',
  },
  {
    id: 'cache',
    label: 'Cache headers',
    hint: 'mod_expires rules: a year for images and fonts, a month for CSS and JS.',
    on: 'yes',
    off: 'no',
  },
]

// The generator drops both www rules when they are set at once, so the form
// models them as one three-way choice instead of two independent flags.
type WwwMode = 'none' | 'www' | 'non-www'

const WWW_MODES: Array<{ id: WwwMode; label: string }> = [
  { id: 'none', label: 'Leave alone' },
  { id: 'www', label: 'Force www' },
  { id: 'non-www', label: 'Force non-www' },
]

function wwwModeOf(opts: HtaccessOptions): WwwMode {
  if (opts.www_redirect === 'yes' && opts.no_www_redirect !== 'yes') return 'www'
  if (opts.no_www_redirect === 'yes' && opts.www_redirect !== 'yes') return 'non-www'
  return 'none'
}

function applyWwwMode(opts: HtaccessOptions, mode: WwwMode): HtaccessOptions {
  return {
    ...opts,
    www_redirect: mode === 'www' ? 'yes' : 'no',
    no_www_redirect: mode === 'non-www' ? 'yes' : 'no',
  }
}

const URL_PARAM_KEYS: Array<keyof HtaccessOptions> = [
  'https_redirect', 'www_redirect', 'no_www_redirect', 'directory_listing', 'cors',
  'cache', 'block_ips', 'error_404', 'error_500', 'rewrite_base',
  'custom_redirect_from', 'custom_redirect_to', 'redirect_type',
]

export const HtaccessGenerator = () => {
  const [opts, setOpts] = useState<HtaccessOptions>({
    ...HTACCESS_DEFAULTS,
    https_redirect: 'yes',
    cors: 'yes',
    cache: 'yes',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // ?from= still accepts the old key=value payload so existing links keep working.
    const from = params.get('from')
    let seeded = from ? parseHtaccessInput(from) : null
    for (const key of URL_PARAM_KEYS) {
      const value = params.get(key)
      if (value !== null) seeded = { ...(seeded ?? HTACCESS_DEFAULTS), [key]: value }
    }
    if (seeded) setOpts(seeded)
  }, [])

  const output = useMemo(() => buildHtaccess(opts), [opts])
  const wwwMode = wwwModeOf(opts)

  const setField = <K extends keyof HtaccessOptions>(id: K, value: HtaccessOptions[K]) =>
    setOpts(prev => ({ ...prev, [id]: value }))

  // A custom redirect only emits a rule once both halves are filled in.
  const halfRedirect =
    (opts.custom_redirect_from.trim() === '') !== (opts.custom_redirect_to.trim() === '')

  const download = () => {
    const blob = new Blob([output + '\n'], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'htaccess.txt'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Panel
      title=".htaccess Generator"
      description="Pick the rules you need and get an Apache [1 .htaccess 2] file: HTTPS and www redirects, CORS, cache headers, directory listing, IP blocks and custom error pages. Every option is seedable from the URL, e.g. [1 ?https_redirect=yes&cors=yes 2]."
      backColor="lime"
      extraElements={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          {/* Form */}
          <div className="flex flex-col gap-8">
            <div>
              <p className={sectionClass}>Rules</p>
              <div className="flex flex-col gap-4">
                {TOGGLES.map(toggle => (
                  <div key={toggle.id}>
                    <label className={checkboxLabelClass}>
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={opts[toggle.id] === toggle.on}
                        onChange={e => setField(toggle.id, e.target.checked ? toggle.on : toggle.off)}
                      />
                      <span className="font-semibold">{toggle.label}</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">{toggle.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className={sectionClass}>Canonical host</p>
              <div className="flex flex-wrap gap-2">
                {WWW_MODES.map(mode => (
                  <button
                    key={mode.id}
                    className={wwwMode === mode.id ? segOn : segOff}
                    onClick={() => setOpts(prev => applyWwwMode(prev, mode.id))}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              <p className={hintClass}>Pick one. Redirecting to www and to non-www at the same time is a loop.</p>
            </div>

            <div>
              <p className={sectionClass}>Custom redirect</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className={labelClass} htmlFor="htaccess-from">From (regex path)</label>
                  <input
                    id="htaccess-from"
                    className={inputClass}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="old-page\.html"
                    value={opts.custom_redirect_from}
                    onChange={e => setField('custom_redirect_from', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="htaccess-to">To</label>
                  <input
                    id="htaccess-to"
                    className={inputClass}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="/new-page"
                    value={opts.custom_redirect_to}
                    onChange={e => setField('custom_redirect_to', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="htaccess-type">Status</label>
                  <select
                    id="htaccess-type"
                    className={selectClass}
                    value={opts.redirect_type === '302' ? '302' : '301'}
                    onChange={e => setField('redirect_type', e.target.value)}
                  >
                    <option value="301">301 Permanent</option>
                    <option value="302">302 Temporary</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="htaccess-base">RewriteBase</label>
                  <input
                    id="htaccess-base"
                    className={inputClass}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="/"
                    value={opts.rewrite_base}
                    onChange={e => setField('rewrite_base', e.target.value)}
                  />
                </div>
              </div>
              {halfRedirect && (
                <p className="text-xs text-red-700 mt-2">
                  Fill in both From and To — a half-filled redirect is skipped.
                </p>
              )}
            </div>

            <div>
              <p className={sectionClass}>Access and errors</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                  <label className={labelClass} htmlFor="htaccess-ips">Blocked IPs</label>
                  <input
                    id="htaccess-ips"
                    className={inputClass}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="192.168.1.1, 10.0.0.0/8"
                    value={opts.block_ips}
                    onChange={e => setField('block_ips', e.target.value)}
                  />
                  <p className={hintClass}>Comma-separated. Addresses or CIDR ranges; Apache 2.4 syntax.</p>
                </div>
                <div>
                  <label className={labelClass} htmlFor="htaccess-404">404 page</label>
                  <input
                    id="htaccess-404"
                    className={inputClass}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="/404.html"
                    value={opts.error_404}
                    onChange={e => setField('error_404', e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="htaccess-500">500 page</label>
                  <input
                    id="htaccess-500"
                    className={inputClass}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="/500.html"
                    value={opts.error_500}
                    onChange={e => setField('error_500', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-8 lg:self-start">
            <p className={labelClass}>.htaccess</p>
            <textarea
              className={`${paneClass} min-h-[520px]`}
              value={output}
              readOnly
              spellCheck={false}
            />
            <div className="flex flex-wrap gap-3">
              <button className={btnClass} onClick={download}>Download</button>
              <button className={btnSecondaryClass} onClick={() => setOpts(HTACCESS_DEFAULTS)}>Reset</button>
            </div>
            <p className={hintClass}>
              Downloads as <span className="font-mono">htaccess.txt</span> — browsers refuse to save
              dotfiles. Rename it to <span className="font-mono">.htaccess</span> in your web root.
            </p>
          </div>
        </div>
      }
    />
  )
}
