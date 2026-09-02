'use client';

import { useCallback, useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  ByteFormat,
  HASH_LABELS,
  KdfHash,
  KdfOutput,
  decodeBytes,
  derivePbkdf2,
  encodeKey,
  bitsToBytes,
  byteInputNote,
} from './logic';
import {
  ByteFormatSelect,
  DeriveButton,
  Field,
  INPUT_CLASS,
  NumberField,
  SELECT_CLASS,
  afterPaint,
} from './controls';
import { useShareLink } from '@/Components/Functions/ShareLink';

export const Pbkdf2 = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [salt, setSalt] = useState('');
  const [saltFormat, setSaltFormat] = useState<ByteFormat>('utf8');
  const [iterations, setIterations] = useState('600000');
  const [hash, setHash] = useState<KdfHash>('sha256');
  const [keyBits, setKeyBits] = useState('256');
  const [output, setOutput] = useState<KdfOutput>('hex');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
    const paramSalt = params.get('salt');
    if (paramSalt) setSalt(paramSalt);
    const paramIterations = params.get('iterations');
    if (paramIterations) setIterations(paramIterations);
    const paramHash = params.get('hash');
    if (paramHash && paramHash in HASH_LABELS) setHash(paramHash as KdfHash);
    const paramBits = params.get('bits');
    if (paramBits) setKeyBits(paramBits);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ salt, iterations, hash, bits: keyBits })

  const derive = useCallback(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    setBusy(true);
    // Yield once so the button repaints as "Deriving…" before the main thread
    // disappears into several hundred thousand HMAC rounds.
    afterPaint(() => {
      try {
        const key = derivePbkdf2(fromValue, {
          salt: decodeBytes(salt, saltFormat, 'Salt'),
          iterations: Number(iterations),
          hash,
          dkLen: bitsToBytes(Number(keyBits)),
        });
        setToValue(encodeKey(key, output));
      } catch (error) {
        setToValue(error instanceof Error ? error.message : 'Could not derive a key');
      } finally {
        setBusy(false);
      }
    });
  }, [fromValue, salt, saltFormat, iterations, hash, keyBits, output]);

  // Any parameter change invalidates the shown key; blank it rather than leave
  // a result that no longer matches the form.
  useEffect(() => {
    setToValue('');
  }, [fromValue, salt, saltFormat, iterations, hash, keyBits, output]);

  const saltNote = byteInputNote(salt, saltFormat);

  const extraElements = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Salt">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="unique per password"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
          />
        </Field>
        <ByteFormatSelect value={saltFormat} onChange={setSaltFormat} />
        <NumberField label="Iterations" value={iterations} onChange={setIterations} width="w-32" />
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
        <DeriveButton onClick={derive} busy={busy} />
      </div>
      {saltNote && <p className="text-xs text-gray-500">{saltNote}</p>}
    </div>
  );

  return (
    <AdvancedConverter
      title="PBKDF2 Key Derivation"
      description="PBKDF2 (RFC 8018) stretches a password into a key by running HMAC many times over. It is the KDF built into WebCrypto, WPA2, and most older password databases. OWASP currently suggests [1 600,000 2] iterations for PBKDF2-HMAC-SHA256. Deriving is deliberately slow, so this runs on the button rather than as you type."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Password"
      toTitle={`Derived Key (PBKDF2-HMAC-${HASH_LABELS[hash]})`}
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
