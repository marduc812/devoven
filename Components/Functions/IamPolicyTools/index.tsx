'use client';

import React, { useState, useEffect } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { analyzeIamPolicy, generateMinimalPolicy, EXAMPLE_POLICIES } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/15 border-red-500/40 text-red-300',
  high: 'bg-orange-500/15 border-orange-500/40 text-orange-300',
  medium: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300',
  info: 'bg-blue-500/15 border-blue-500/40 text-blue-300',
};

export function IamPolicyAnalyzer() {
  const [policyJson, setPolicyJson] = useState('');
  const [genDescription, setGenDescription] = useState('');
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate'>('analyze');

  useEffect(function() {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setPolicyJson(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: policyJson })

  const analysis = policyJson.trim() ? analyzeIamPolicy(policyJson) : null;
  const generatedPolicy = genDescription.trim() ? generateMinimalPolicy(genDescription) : '';

  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';
  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-xs resize-none';
  const inputClass = 'bg-white backdrop-blur-sm text-gray-900 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 text-sm';
  const tabBtn = (tab: string) =>
    'px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer border ' +
    (activeTab === tab
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
      : 'text-gray-500 hover:text-gray-900 border-gray-200 hover:border-gray-400');

  const content = (
    <div className="flex flex-col gap-5">
      {/* Tabs */}
      <div className="flex gap-2">
        <button className={tabBtn('analyze')} onClick={function() { setActiveTab('analyze'); }}>Analyze Policy</button>
        <button className={tabBtn('generate')} onClick={function() { setActiveTab('generate'); }}>Generate Policy</button>
      </div>

      {activeTab === 'analyze' && (
        <>
          {/* Input */}
          <div className="flex flex-col gap-2">
            <label className={labelClass}>IAM Policy JSON</label>
            <FileTextArea>
              <textarea
                className={textareaClass}
                rows={10}
                value={policyJson}
                onChange={function(e) { setPolicyJson(e.target.value); }}
                placeholder={'{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Action": "s3:GetObject",\n      "Resource": "arn:aws:s3:::my-bucket/*"\n    }\n  ]\n}'}
              />
            </FileTextArea>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_POLICIES.map(function(ex) {
                return (
                  <button
                    key={ex.name}
                    onClick={function() { setPolicyJson(JSON.stringify(ex.policy, null, 2)); }}
                    className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-400 text-xs hover:text-gray-900 hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    {ex.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {analysis && !analysis.valid && (
            <div className="bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-400 text-sm">
              {analysis.error}
            </div>
          )}

          {/* Results */}
          {analysis && analysis.valid && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Statements', value: String(analysis.statementCount) },
                  { label: 'Allow', value: String(analysis.allowStatements) },
                  { label: 'Deny', value: String(analysis.denyStatements) },
                ].map(function(s) {
                  return (
                    <div key={s.label} className="flex flex-col bg-gray-50 px-3 py-2 border border-gray-200 text-center">
                      <span className="text-gray-500 text-xs">{s.label}</span>
                      <span className="text-gray-900 font-semibold text-sm">{s.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Warnings */}
              {analysis.warnings.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Warnings ({analysis.warnings.length})</label>
                  {analysis.warnings.map(function(w, i) {
                    return (
                      <div key={i} className={'px-4 py-3 border text-xs ' + (SEVERITY_COLORS[w.severity] || '')}>
                        <span className="font-semibold uppercase mr-2">{w.severity}:</span>
                        {w.message}
                        {w.statementSid && <span className="ml-2 text-gray-400">(Sid: {w.statementSid})</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {analysis.warnings.length === 0 && (
                <div className="bg-green-500/10 border border-green-500/30 px-4 py-3 text-green-400 text-sm">
                  No obvious security issues found.
                </div>
              )}

              {/* Allowed actions by service */}
              {analysis.allowedActionGroups.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Allowed Actions by Service</label>
                  <div className="flex flex-col gap-2">
                    {analysis.allowedActionGroups.map(function(g) {
                      return (
                        <div key={g.service} className="border border-gray-200 bg-gray-50 px-4 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-emerald-300 font-mono text-sm font-semibold">{g.service}</span>
                            {g.isWildcard && <span className="text-red-400 text-xs border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 rounded">wildcard</span>}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {g.actions.slice(0, 20).map(function(a) {
                              return (
                                <span key={a} className="text-xs font-mono bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-700">
                                  {a}
                                </span>
                              );
                            })}
                            {g.actions.length > 20 && <span className="text-xs text-gray-500">+{g.actions.length - 20} more</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Denied actions */}
              {analysis.deniedActionGroups.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Denied Actions by Service</label>
                  <div className="flex flex-col gap-2">
                    {analysis.deniedActionGroups.map(function(g) {
                      return (
                        <div key={g.service} className="border border-gray-200 bg-gray-50 px-4 py-3">
                          <span className="text-orange-300 font-mono text-sm font-semibold">{g.service}</span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {g.actions.map(function(a) {
                              return (
                                <span key={a} className="text-xs font-mono bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-400">
                                  {a}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resources */}
              {analysis.resourceSummary.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Resources</label>
                  <div className="flex flex-col gap-1">
                    {analysis.resourceSummary.map(function(r) {
                      return (
                        <div key={r} className="font-mono text-xs bg-gray-50 px-3 py-1.5 border border-gray-200 text-gray-700 break-all">
                          {r}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {!policyJson.trim() && (
            <div className="text-gray-600 text-sm">
              Paste an AWS IAM policy JSON above to analyze it, or click an example.
            </div>
          )}
        </>
      )}

      {activeTab === 'generate' && (
        <>
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Describe What You Need</label>
            <input
              className={inputClass}
              value={genDescription}
              onChange={function(e) { setGenDescription(e.target.value); }}
              placeholder='e.g. "read S3 bucket my-data" or "write CloudWatch logs" or "invoke Lambda"'
            />
            <div className="flex flex-wrap gap-2">
              {[
                'read S3 bucket my-bucket',
                'write to S3',
                'EC2 read only',
                'CloudWatch logs',
                'DynamoDB read',
                'invoke Lambda',
                'send to SQS',
                'publish SNS',
                'pull from ECR',
              ].map(function(ex) {
                return (
                  <button
                    key={ex}
                    onClick={function() { setGenDescription(ex); }}
                    className="px-2 py-1 bg-gray-50 border border-gray-200 text-gray-400 text-xs hover:text-gray-900 hover:border-gray-400 transition-colors cursor-pointer"
                  >
                    {ex}
                  </button>
                );
              })}
            </div>
          </div>

          {generatedPolicy && (
            <div className="flex flex-col gap-2">
              <label className={labelClass}>Generated Policy</label>
              <pre className="bg-gray-100 p-4 border border-gray-200 text-gray-900 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {generatedPolicy}
              </pre>
              <div className="text-gray-500 text-xs">
                This is a starting point — review and customize resource ARNs and actions for your exact use case.
              </div>
            </div>
          )}

          {!genDescription.trim() && (
            <div className="text-gray-600 text-sm">
              Describe what access you need in plain English to generate a minimal IAM policy.
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <Panel
      title="IAM Policy Analyzer"
      description="Analyze AWS IAM policy JSON for [1 wildcard actions 2], [1 overly permissive patterns 2], and security warnings. Groups actions by service, highlights dangerous permissions. Also generates minimal policies from plain-English descriptions."
      backColor="lime"
      extraElements={content}
    />
  );
}
