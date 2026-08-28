'use client';

import React, { useState, useEffect } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { generateTlsConfig, TLS_PROFILES, TlsProfile } from './logic';

export function TlsConfigGenerator() {
  const [profile, setProfile] = useState<TlsProfile>('intermediate');
  const [server, setServer] = useState<'nginx' | 'apache' | 'haproxy'>('nginx');

  useEffect(function() {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from') as TlsProfile;
    if (from && ['modern', 'intermediate', 'old'].indexOf(from) >= 0) setProfile(from);
  }, []);

  const config = generateTlsConfig(profile);

  const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';
  const codeClass = 'bg-gray-100 p-4 border border-gray-200 text-gray-200 font-mono text-xs whitespace-pre-wrap leading-relaxed overflow-x-auto';
  const btnClass = (active: boolean) =>
    'px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer border ' +
    (active
      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
      : 'text-gray-500 hover:text-gray-300 border-gray-200 hover:border-gray-400');

  const content = (
    <div className="flex flex-col gap-5">
      {/* Profile selection */}
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Security Profile</label>
        <div className="flex flex-col gap-2">
          {TLS_PROFILES.map(function(p) {
            return (
              <button
                key={p.id}
                onClick={function() { setProfile(p.id); }}
                className={
                  'flex flex-col text-left px-4 py-3 border transition-colors cursor-pointer ' +
                  (profile === p.id
                    ? 'bg-sky-500/10 border-sky-500/30'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-400')
                }
              >
                <span className={profile === p.id ? 'text-sky-300 text-sm font-semibold' : 'text-gray-300 text-sm font-semibold'}>
                  {p.name}
                </span>
                <span className="text-gray-500 text-xs mt-0.5">{p.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col bg-gray-50 px-3 py-2 border border-gray-200">
          <span className="text-gray-500 text-xs">Min TLS Version</span>
          <span className="text-gray-900 font-mono text-sm">{config.minTlsVersion}</span>
        </div>
        <div className="flex flex-col bg-gray-50 px-3 py-2 border border-gray-200">
          <span className="text-gray-500 text-xs">Max TLS Version</span>
          <span className="text-gray-900 font-mono text-sm">{config.maxTlsVersion}</span>
        </div>
      </div>

      {/* Cipher suites */}
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Cipher Suites</label>
        <div className="flex flex-wrap gap-1.5">
          {config.cipherSuites.map(function(c) {
            return (
              <span key={c} className="text-xs font-mono bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-300">
                {c}
              </span>
            );
          })}
        </div>
      </div>

      {/* Browser compat */}
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Browser Compatibility</label>
        <div className="flex flex-wrap gap-1.5">
          {config.browserCompatibility.map(function(b) {
            return (
              <span key={b} className="text-xs bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-400">
                {b}
              </span>
            );
          })}
        </div>
      </div>

      {/* Server selection */}
      <div className="flex flex-col gap-2">
        <label className={labelClass}>Server Configuration</label>
        <div className="flex gap-2">
          {(['nginx', 'apache', 'haproxy'] as const).map(function(s) {
            return <button key={s} className={btnClass(server === s)} onClick={function() { setServer(s); }}>{s}</button>;
          })}
        </div>
        <pre className={codeClass}>
          {server === 'nginx' ? config.nginx : server === 'apache' ? config.apache : config.haproxy}
        </pre>
      </div>

      {/* Notes */}
      {config.notes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Notes</label>
          <ul className="flex flex-col gap-1">
            {config.notes.map(function(note, i) {
              const isWarning = note.startsWith('WARNING');
              return (
                <li key={i} className={
                  'text-xs px-3 py-2 border ' +
                  (isWarning
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-gray-50 border-gray-200 text-gray-400')
                }>
                  {note}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="TLS Config Generator"
      description="Generate TLS/SSL configuration for [1 nginx 2], [1 Apache 2], and [1 HAProxy 2] based on Mozilla's SSL Config Generator. Choose [1 modern 2] (TLS 1.3 only), [1 intermediate 2] (TLS 1.2+), or [1 old 2] (legacy compatibility) profiles."
      backColor="sky"
      extraElements={content}
    />
  );
}
