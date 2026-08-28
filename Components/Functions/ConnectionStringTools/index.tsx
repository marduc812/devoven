'use client';

import { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { buildConnectionStrings, DbType, ConnectionParams } from './logic';

const DB_OPTIONS: { value: DbType; label: string; defaultPort: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL', defaultPort: '5432' },
  { value: 'mysql', label: 'MySQL', defaultPort: '3306' },
  { value: 'mongodb', label: 'MongoDB', defaultPort: '27017' },
  { value: 'redis', label: 'Redis', defaultPort: '6379' },
];

export function ConnectionStringBuilder() {
  const [dbType, setDbType] = useState<DbType>('postgresql');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('mydb');
  const [username, setUsername] = useState('postgres');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const params: ConnectionParams = { dbType, host, port, database, username, password, ssl };
  const formats = buildConnectionStrings(params);

  const handleDbTypeChange = (val: DbType) => {
    const opt = DB_OPTIONS.find(o => o.value === val);
    setDbType(val);
    if (opt) setPort(opt.defaultPort);
  };

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(label);
        setTimeout(() => setCopied(null), 2000);
      });
    }
  };

  const inputClass =
    'bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30 w-full';
  const selectClass =
    'bg-white text-gray-900 text-sm border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-white/30 w-full';
  const labelClass = 'text-gray-400 text-xs mb-1 block';

  return (
    <Panel
      title="Connection String Builder"
      description="Build database [1 connection strings 2] for [1 PostgreSQL 2], [1 MySQL 2], [1 MongoDB 2], and [1 Redis 2] in multiple formats: URI, SQLAlchemy, JDBC, Go, Node.js, and ORM-specific."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Database Type</label>
              <select
                className={selectClass}
                value={dbType}
                onChange={e => handleDbTypeChange(e.target.value as DbType)}
              >
                {DB_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Host</label>
              <input
                className={inputClass}
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="localhost"
              />
            </div>
            <div>
              <label className={labelClass}>Port</label>
              <input
                className={inputClass}
                value={port}
                onChange={e => setPort(e.target.value)}
                placeholder="5432"
              />
            </div>
            <div>
              <label className={labelClass}>
                {dbType === 'redis' ? 'Database Index' : 'Database Name'}
              </label>
              <input
                className={inputClass}
                value={database}
                onChange={e => setDatabase(e.target.value)}
                placeholder={dbType === 'redis' ? '0' : 'mydb'}
              />
            </div>
            {dbType !== 'redis' || username ? (
              <div>
                <label className={labelClass}>Username</label>
                <input
                  className={inputClass}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="postgres"
                />
              </div>
            ) : null}
            <div>
              <label className={labelClass}>Password</label>
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="(leave blank if none)"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="ssl-toggle"
              type="checkbox"
              checked={ssl}
              onChange={e => setSsl(e.target.checked)}
              className="w-4 h-4 rounded accent-emerald-500"
            />
            <label htmlFor="ssl-toggle" className="text-gray-300 text-sm cursor-pointer">
              Enable SSL / TLS
            </label>
          </div>

          {/* Output formats */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Connection Strings
            </h3>
            {formats.map(f => (
              <div key={f.label} className="border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-sm font-medium">{f.label}</span>
                  <button
                    onClick={() => copyToClipboard(f.value, f.label)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors px-2 py-0.5 rounded border border-emerald-500/30 hover:border-emerald-400/50"
                  >
                    {copied === f.label ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-gray-500 text-xs mb-2 font-mono">{f.format}</p>
                <pre className="text-xs text-gray-900 font-mono bg-white rounded px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all">
                  {f.value}
                </pre>
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
}
