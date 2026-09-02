'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processBacon, BaconRepresentation } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';

export function BaconCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [repr, setRepr] = useState<BaconRepresentation>('AB');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const r = params.get('repr');
    if (r === '01') setRepr('01');
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ repr })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      setOutput(processBacon(input, repr));
    } catch (e: unknown) {
      setOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }, [input, repr]);

  return (
    <AdvancedConverter
      title="Bacon's Cipher"
      description="Francis Bacon's biliteral cipher encodes each letter as a 5-character code using [1 A and B 2] (or 0 and 1). For example A=AAAAA, B=AAAAB. I/J and U/V share codes. Auto-detects encode/decode."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Input (text or A/B codes)"
      toTitle="Output"
      backColor="yellow"
      extraElements={
        <div className="flex flex-row flex-wrap gap-3 items-center">
          <label className={labelClass}>Representation</label>
          <select
            value={repr}
            onChange={(e) => setRepr(e.target.value as BaconRepresentation)}
            className={selectClass}
          >
            <option value="AB">A / B</option>
            <option value="01">0 / 1</option>
          </select>
        </div>
      }
    />
  );
}
