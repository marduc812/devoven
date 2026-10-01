'use client';

import { useMemo, useState } from 'react';
import { Version } from 'csp_evaluator/dist/csp';
import { Severity } from 'csp_evaluator/dist/finding';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { StatusBadge, type BadgeTone } from '@/Components/MainView/MainPanel/ResultUI';
import { analyzeCsp, EXAMPLE_POLICY, STRICT_POLICY, findingLabel, isCompatibilityFinding } from './logic';

const SEVERITY_TONES: Record<Severity, BadgeTone> = {
  [Severity.HIGH]: 'fail',
  [Severity.SYNTAX]: 'fail',
  [Severity.MEDIUM]: 'warn',
  [Severity.HIGH_MAYBE]: 'fail',
  [Severity.STRICT_CSP]: 'info',
  [Severity.MEDIUM_MAYBE]: 'warn',
  [Severity.INFO]: 'info',
  [Severity.NONE]: 'neutral',
};

export function CspAnalyzer() {
  const [input, setInput] = useState('');
  const [version, setVersion] = useState<Version>(Version.CSP3);
  const [strict, setStrict] = useState(true);
  const [copyStatus, setCopyStatus] = useState('');
  const result = useMemo(() => {
    if (!input.trim()) return { policies: [], error: '' };
    try { return { policies: analyzeCsp(input, version, strict), error: '' }; }
    catch (error) { return { policies: [], error: error instanceof Error ? error.message : 'Unable to analyze policy.' }; }
  }, [input, version, strict]);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ version, policies: result.policies }, null, 2));
      setCopyStatus('Report copied.');
    } catch { setCopyStatus('Could not copy. Check clipboard permissions.'); }
  }

  return <Panel title="CSP Analyzer" description="Analyze a [1 Content-Security-Policy 2] for unsafe sources, syntax issues, missing protections, and known XSS bypasses. Your policy is processed in your browser." backColor="lime" extraElements={
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2">
        <label htmlFor="csp-policy" className="text-sm font-semibold text-gray-900">CSP policy or response headers</label>
        <textarea id="csp-policy" rows={7} value={input} onChange={event => { setInput(event.target.value); setCopyStatus(''); }} placeholder="Content-Security-Policy: default-src 'self'; object-src 'none'" className="w-full border border-gray-300 bg-white p-3 font-mono text-sm text-gray-900 focus:outline-none focus:border-gray-900" spellCheck={false} />
        <div className="flex flex-wrap gap-3 items-center text-sm">
          <button className="border border-gray-300 px-3 py-2" onClick={() => setInput(EXAMPLE_POLICY)}>Load weak example</button>
          <button className="border border-gray-300 px-3 py-2" onClick={() => setInput(STRICT_POLICY)}>Load nonce example</button>
          <button className="border border-gray-300 px-3 py-2" onClick={() => { setInput(''); setCopyStatus(''); }}>Clear</button>
          <label htmlFor="csp-version">CSP version</label>
          <select id="csp-version" value={version} onChange={event => setVersion(Number(event.target.value) as Version)} className="border border-gray-300 bg-white p-2">
            <option value={3}>CSP3</option><option value={2}>CSP2</option><option value={1}>CSP1</option>
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={strict} onChange={event => setStrict(event.target.checked)} />Strict CSP recommendations</label>
        </div>
      </div>
      {result.error && <p role="alert" className="text-red-700">{result.error}</p>}
      <div aria-live="polite" className="flex flex-col gap-6">
        {result.policies.map((policy, index) => <section key={index} className="border border-gray-200 p-4 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Policy {index + 1} · {policy.reportOnly ? 'Report-only (not enforced)' : 'Enforced header / policy'} · {policy.findings.length} findings</h2>
          {policy.reportOnly && <p className="text-amber-800 text-sm">Report-only policies report violations but do not block resources or attacks.</p>}
          <pre className="whitespace-pre-wrap break-all bg-gray-50 p-3 text-xs">{policy.policy}</pre>
          {policy.findings.length === 0 && <p className="text-sm text-gray-700">No findings from the selected checks. This does not guarantee protection against every bypass.</p>}
          <ul className="flex flex-col gap-3">
            {policy.findings.map((finding, findingIndex) => <li key={findingIndex} className="border border-gray-200 bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusBadge tone={isCompatibilityFinding(finding) ? 'neutral' : SEVERITY_TONES[finding.severity]}>{findingLabel(finding)}</StatusBadge>
                <code className="text-sm font-semibold text-gray-900">{finding.directive}</code>
              </div>
              {finding.value && <code className="mt-3 block w-fit max-w-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-800 break-all">{finding.value}</code>}
              <p className="text-sm leading-relaxed text-gray-700 mt-2">{finding.description}</p>
            </li>)}
          </ul>
          <details><summary className="cursor-pointer text-sm font-semibold">Effective directives in CSP{version}</summary>
            <pre className="whitespace-pre-wrap break-all bg-gray-50 p-3 mt-2 text-xs">{Object.entries(policy.effectiveDirectives).map(([name, values]) => `${name} ${(values ?? []).join(' ')}`).join(';\n')}</pre>
          </details>
        </section>)}
      </div>
      {result.policies.length > 0 && <div className="flex gap-3 items-center"><button className="border border-gray-300 px-3 py-2 text-sm" onClick={copyReport}>Copy JSON report</button><span role="status" className="text-sm">{copyStatus}</span></div>}
    </div>
  } />;
}
