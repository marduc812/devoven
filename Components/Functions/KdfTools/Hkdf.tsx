'use client';

import { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  ByteFormat,
  HASH_LABELS,
  KdfHash,
  KdfOutput,
  decodeBytes,
  deriveHkdf,
  encodeKey,
  bitsToBytes,
  byteInputNote,
} from './logic';
import { ByteFormatSelect, Field, INPUT_CLASS, NumberField, SELECT_CLASS } from './controls';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const Hkdf = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [salt, setSalt] = useState('');
  const [saltFormat, setSaltFormat] = useState<ByteFormat>('utf8');
  const [info, setInfo] = useState('');
  const [hash, setHash] = useState<KdfHash>('sha256');
  const [keyBits, setKeyBits] = useState('256');
  const [output, setOutput] = useState<KdfOutput>('hex');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
    const paramSalt = params.get('salt');
    if (paramSalt) setSalt(paramSalt);
    const paramInfo = params.get('info');
    if (paramInfo) setInfo(paramInfo);
    const paramHash = params.get('hash');
    if (paramHash && paramHash in HASH_LABELS) setHash(paramHash as KdfHash);
    const paramBits = params.get('bits');
    if (paramBits) setKeyBits(paramBits);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ salt, info, hash, bits: keyBits })

  // Unlike the password KDFs, HKDF is two HMAC passes — cheap enough to run on
  // every keystroke.
  useEffect(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    try {
      const key = deriveHkdf(fromValue, {
        salt: salt ? decodeBytes(salt, saltFormat, 'Salt') : undefined,
        info: info ? decodeBytes(info, 'utf8', 'Info') : undefined,
        hash,
        dkLen: bitsToBytes(Number(keyBits)),
      });
      setToValue(encodeKey(key, output));
    } catch (error) {
      setToValue(error instanceof Error ? error.message : 'Could not derive a key');
    }
  }, [fromValue, salt, saltFormat, info, hash, keyBits, output]);

  const saltNote = byteInputNote(salt, saltFormat);

  const extraElements = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Salt (optional)">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="non-secret random value"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
          />
        </Field>
        <ByteFormatSelect value={saltFormat} onChange={setSaltFormat} />
        <Field label="Info (context)">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="e.g. tls13 key expansion"
            value={info}
            onChange={(e) => setInfo(e.target.value)}
          />
        </Field>
        <Field label="Hash">
          <select className={SELECT_CLASS} value={hash} onChange={(e) => setHash(e.target.value as KdfHash)}>
            {(Object.keys(HASH_LABELS) as KdfHash[]).map((name) => (
              <option key={name} value={name}>
                {HASH_LABELS[name]}
              </option>
            ))}
          </select>
        </Field>
        <NumberField label="Key size (bits)" value={keyBits} onChange={setKeyBits} width="w-28" />
        <Field label="Output">
          <select className={SELECT_CLASS} value={output} onChange={(e) => setOutput(e.target.value as KdfOutput)}>
            <option value="hex">Hex</option>
            <option value="base64">Base64</option>
          </select>
        </Field>
      </div>
      {saltNote && <p className="text-xs text-gray-500">{saltNote}</p>}
    </div>
  );

  return (
    <AdvancedConverter
      title="HKDF Key Derivation"
      description="HKDF (RFC 5869) turns one high-entropy secret into as many independent keys as you need: it extracts a pseudorandom key with the salt, then expands it using the info string as context. TLS 1.3, Signal, and Noise all build on it. HKDF is not a password hash — the input must already be random. Change the [1 info 2] string and you get a completely different key from the same secret."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input Key Material"
      toTitle={`Output Key Material (HKDF-${HASH_LABELS[hash]})`}
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
