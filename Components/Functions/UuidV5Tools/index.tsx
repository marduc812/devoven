'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { formatUuidV5, NAMESPACES } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

export function UuidV5Generator() {
  const [name, setName] = useState('');
  const [ns, setNs] = useState('DNS');
  const [output, setOutput] = useState('');

  useEffect(function() {
    const p = new URLSearchParams(window.location.search);
    const from = p.get('from');
    if (from) setName(from);
    const nsParam = p.get('ns');
    if (nsParam && NAMESPACES[nsParam]) setNs(nsParam);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ ns })

  useEffect(function() {
    if (!name.trim()) { setOutput(''); return; }
    try {
      setOutput(formatUuidV5(ns, name));
    } catch (e) {
      setOutput('Error: ' + (e as Error).message);
    }
  }, [name, ns]);

  const selectClass = 'bg-white text-gray-900 text-xs border border-gray-200 px-3 py-1.5 focus:outline-none focus:border-gray-400';

  return (
    <AdvancedConverter
      title="UUID v5 Generator"
      description="Generate a deterministic UUID v5 (name-based, SHA-1) from a namespace and a name string. Same namespace + name always produces the same UUID. Namespaces: [1 DNS 2], [1 URL 2], [1 OID 2], [1 X500 2]."
      fromValue={name}
      toValue={output}
      setFromValue={setName}
      fromTitle="Name"
      toTitle="UUID v5"
      backColor="lime"
      extraElements={
        <label className="flex items-center gap-2 text-xs text-gray-400">
          Namespace:
          <select
            className={selectClass}
            value={ns}
            onChange={function(e) { setNs(e.target.value); }}
          >
            {Object.keys(NAMESPACES).map(function(k) {
              return <option key={k} value={k}>{k}</option>;
            })}
          </select>
        </label>
      }
    />
  );
}
