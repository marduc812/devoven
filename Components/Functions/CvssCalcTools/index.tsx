'use client';
import { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CvssMetrics,
  DEFAULT_METRICS,
  METRIC_LABELS,
  calculateCvss,
  AttackVector,
  AttackComplexity,
  PrivilegesRequired,
  UserInteraction,
  Scope,
  CIAImpact,
} from './logic';

type MetricKey = keyof CvssMetrics;

function scoreColor(score: number): string {
  if (score === 0) return 'text-gray-400';
  if (score < 4) return 'text-sky-400';
  if (score < 7) return 'text-yellow-400';
  if (score < 9) return 'text-orange-400';
  return 'text-rose-400';
}

function severityBg(severity: string): string {
  switch (severity) {
    case 'None': return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
    case 'Low': return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    case 'Medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
    case 'High': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
    case 'Critical': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    default: return 'bg-gray-500/20 text-gray-300';
  }
}

export function CvssCalculator() {
  const [metrics, setMetrics] = useState<CvssMetrics>(DEFAULT_METRICS);
  const [copied, setCopied] = useState(false);

  const result = calculateCvss(metrics);

  const setMetric = <K extends MetricKey>(key: K, value: CvssMetrics[K]) => {
    setMetrics(prev => ({ ...prev, [key]: value }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.vectorString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const metricKeys = Object.keys(METRIC_LABELS) as MetricKey[];

  return (
    <Panel
      title="CVSS v3.1 Base Score Calculator"
      description="Calculate the [1 CVSS v3.1 2] base score and severity rating using the FIRST specification formula. Select each base metric to generate the score, severity, and vector string."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6 w-full">
          {/* Score display */}
          <div className="flex items-center gap-6 bg-gray-50 border border-gray-200 rounded-2xl p-5">
            <div className="text-center flex-shrink-0">
              <div className={`text-5xl font-bold font-mono ${scoreColor(result.score)}`}>
                {result.score.toFixed(1)}
              </div>
              <div className="text-gray-500 text-xs">/ 10.0</div>
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <span className={`inline-flex self-start items-center px-3 py-1 rounded-full text-sm font-semibold border ${severityBg(result.severity)}`}>
                {result.severity}
              </span>
              <div className="w-full bg-gray-50 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    result.score === 0 ? 'bg-gray-500' :
                    result.score < 4 ? 'bg-sky-500' :
                    result.score < 7 ? 'bg-yellow-500' :
                    result.score < 9 ? 'bg-orange-500' :
                    'bg-rose-500'
                  }`}
                  style={{ width: `${result.score * 10}%` }}
                />
              </div>
              <div className="flex items-center gap-2 justify-between">
                <code className="text-emerald-300 text-xs font-mono truncate">{result.vectorString}</code>
                <button onClick={handleCopy} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex-shrink-0">
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Metric selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metricKeys.map(key => {
              const def = METRIC_LABELS[key];
              const current = metrics[key] as string;
              return (
                <div key={key} className="border border-gray-200 bg-gray-50 p-3 flex flex-col gap-2">
                  <label className="text-gray-300 text-xs font-semibold">{def.label}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {def.options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setMetric(key, opt.value as CvssMetrics[typeof key])}
                        title={opt.description}
                        className={`px-2.5 py-1 text-xs border transition-colors ${
                          current === opt.value
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs">
                    {def.options.find(o => o.value === current)?.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Score breakdown */}
          <div className="border border-gray-200 bg-gray-50 p-4 flex flex-col gap-3">
            <h3 className="text-gray-400 text-xs uppercase tracking-wide">Score Breakdown</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-gray-300 text-sm font-mono">{result.iss.toFixed(4)}</div>
                <div className="text-gray-600 text-xs">ISS (Impact Sub-Score)</div>
              </div>
              <div>
                <div className="text-gray-300 text-sm font-mono">{result.impact.toFixed(4)}</div>
                <div className="text-gray-600 text-xs">Impact Score</div>
              </div>
              <div>
                <div className="text-gray-300 text-sm font-mono">{result.exploitability.toFixed(4)}</div>
                <div className="text-gray-600 text-xs">Exploitability Score</div>
              </div>
            </div>
          </div>

          {/* Severity legend */}
          <div className="flex flex-wrap gap-2">
            {['None (0.0)', 'Low (0.1–3.9)', 'Medium (4.0–6.9)', 'High (7.0–8.9)', 'Critical (9.0–10.0)'].map((label, i) => {
              const colors = ['bg-gray-500/20 text-gray-400', 'bg-sky-500/20 text-sky-400', 'bg-yellow-500/20 text-yellow-400', 'bg-orange-500/20 text-orange-400', 'bg-rose-500/20 text-rose-400'];
              return (
                <span key={i} className={`text-xs px-2 py-0.5 rounded ${colors[i]}`}>{label}</span>
              );
            })}
          </div>
        </div>
      }
    />
  );
}
