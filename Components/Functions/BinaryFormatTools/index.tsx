'use client';

import { useState, useEffect, useMemo } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  decodeToJson,
  detectEncoding,
  CBOR_SAMPLE,
  MSGPACK_SAMPLE,
  type BinaryEncoding,
  type BinaryFormat,
} from './logic';

const selectClass = 'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
const buttonClass = 'px-3 py-1.5 border border-gray-300 bg-white text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-900 transition-colors cursor-pointer';

type EncodingChoice = BinaryEncoding | 'auto';

function useBinaryDecoder(format: BinaryFormat, sample: string) {
  const [input, setInput] = useState('');
  const [encoding, setEncoding] = useState<EncodingChoice>('auto');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
    const enc = params.get('encoding');
    if (enc === 'hex' || enc === 'base64' || enc === 'auto') setEncoding(enc);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ encoding });

  const { output, notes, error, size } = useMemo(() => {
    if (!input.trim()) return { output: '', notes: [] as string[], error: '', size: 0 };
    try {
      const result = decodeToJson(input, format, {
        encoding: encoding === 'auto' ? undefined : encoding,
      });
      return { output: result.json, notes: result.notes, error: '', size: result.totalBytes };
    } catch (e: unknown) {
      return {
        output: '',
        notes: [] as string[],
        error: e instanceof Error ? e.message : 'Cannot decode those bytes',
        size: 0,
      };
    }
  }, [input, encoding, format]);

  const detected = input.trim() ? detectEncoding(input) : null;

  return {
    input,
    setInput,
    encoding,
    setEncoding,
    toValue: error ? `Error: ${error}` : output,
    notes,
    size,
    detected,
    loadSample: () => setInput(sample),
  };
}

const controls = (
  tool: ReturnType<typeof useBinaryDecoder>,
) => (
  <>
    <div className="flex items-center gap-2">
      <label className={labelClass}>Bytes as</label>
      <select
        className={selectClass}
        value={tool.encoding}
        onChange={(e) => tool.setEncoding(e.target.value as EncodingChoice)}
      >
        <option value="auto">Detect{tool.detected ? ` (${tool.detected})` : ''}</option>
        <option value="hex">Hex</option>
        <option value="base64">Base64</option>
      </select>
    </div>
    <button className={buttonClass} onClick={tool.loadSample}>Load Sample</button>
    {tool.size > 0 && (
      <span className="text-gray-500 text-xs font-mono whitespace-nowrap">{tool.size} bytes</span>
    )}
    {tool.notes.map((note) => (
      <span key={note} className="text-amber-700 text-xs">{note}</span>
    ))}
  </>
);

// ─── CBOR Decoder ─────────────────────────────────────────────────────────────

export function CborDecoder() {
  const tool = useBinaryDecoder('cbor', CBOR_SAMPLE);

  return (
    <AdvancedConverter
      title="CBOR Decoder"
      description={'Decode CBOR (RFC 8949) to JSON. Handles every major type, indefinite lengths, half floats, bignums and tags: a byte string comes out as [1 {"$bytes": "deadbeef"} 2] and a tag as [1 {"$tag": 32, "value": ...} 2], so nothing the encoding carries is quietly lost.'}
      fromValue={tool.input}
      toValue={tool.toValue}
      setFromValue={tool.setInput}
      fromTitle="CBOR (hex or Base64)"
      toTitle="JSON"
      backColor="cyan"
      extraElements={controls(tool)}
    />
  );
}

// ─── MessagePack Decoder ──────────────────────────────────────────────────────

export function MessagePackDecoder() {
  const tool = useBinaryDecoder('msgpack', MSGPACK_SAMPLE);

  return (
    <AdvancedConverter
      title="MessagePack to JSON"
      description={'Decode MessagePack to JSON. Fixints through 64-bit integers, str and bin, arrays and maps, and the extension types: the timestamp extension comes out as an ISO date, anything else as [1 {"$tag": n, "value": ...} 2] with the payload as hex.'}
      fromValue={tool.input}
      toValue={tool.toValue}
      setFromValue={tool.setInput}
      fromTitle="MessagePack (hex or Base64)"
      toTitle="JSON"
      backColor="cyan"
      extraElements={controls(tool)}
    />
  );
}
