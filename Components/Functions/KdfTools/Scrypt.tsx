'use client';

import { useCallback, useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  ByteFormat,
  KdfOutput,
  bitsToBytes,
  byteInputNote,
  decodeBytes,
  deriveScrypt,
  encodeKey,
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

export const Scrypt = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [salt, setSalt] = useState('');
  const [saltFormat, setSaltFormat] = useState<ByteFormat>('utf8');
  const [logN, setLogN] = useState('15');
  const [r, setR] = useState('8');
  const [p, setP] = useState('1');
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
    for (const [key, setter] of [
      ['logn', setLogN],
      ['r', setR],
      ['p', setP],
      ['bits', setKeyBits],
    ] as const) {
      const value = params.get(key);
      if (value) setter(value);
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ salt, logn: logN, r, p, bits: keyBits })

  const nValue = Number(logN);
  // N is entered as its exponent: users think in "2^15", and it removes the
  // whole class of "N must be a power of two" mistakes.
  const memoryMb =
    Number.isInteger(nValue) && nValue >= 1 && nValue <= 24
      ? (128 * 2 ** nValue * Number(r) * Number(p)) / (1024 * 1024)
      : null;

  const derive = useCallback(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    setBusy(true);
    afterPaint(() => {
      try {
        const exponent = Number(logN);
        if (!Number.isInteger(exponent) || exponent < 1 || exponent > 24) {
          throw new Error('log2(N) must be a whole number between 1 and 24');
        }
        const key = deriveScrypt(fromValue, {
          salt: decodeBytes(salt, saltFormat, 'Salt'),
          N: 2 ** exponent,
          r: Number(r),
          p: Number(p),
          dkLen: bitsToBytes(Number(keyBits)),
        });
        setToValue(encodeKey(key, output));
      } catch (error) {
        setToValue(error instanceof Error ? error.message : 'Could not derive a key');
      } finally {
        setBusy(false);
      }
    });
  }, [fromValue, salt, saltFormat, logN, r, p, keyBits, output]);

  useEffect(() => {
    setToValue('');
  }, [fromValue, salt, saltFormat, logN, r, p, keyBits, output]);

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
        <NumberField label="log2(N)" value={logN} onChange={setLogN} width="w-24" />
        <NumberField label="r (block)" value={r} onChange={setR} width="w-24" />
        <NumberField label="p (parallel)" value={p} onChange={setP} width="w-24" />
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
      {memoryMb !== null && (
        <p className="text-xs text-gray-500">
          N = 2<sup>{logN}</sup> = {(2 ** nValue).toLocaleString()} — these parameters need about{' '}
          <span className="font-mono text-gray-700">
            {memoryMb < 1 ? `${Math.round(memoryMb * 1024)} KB` : `${memoryMb.toFixed(memoryMb < 10 ? 1 : 0)} MB`}
          </span>{' '}
          of memory.
        </p>
      )}
    </div>
  );

  return (
    <AdvancedConverter
      title="scrypt Key Derivation"
      description="scrypt (RFC 7914) is a password KDF designed to be expensive in memory as well as CPU, which is what makes it hard to attack with GPUs and ASICs. It is used by Litecoin, Tarsnap, and Android disk encryption. The parameters are [1 N 2] (cost), [1 r 2] (block size), and [1 p 2] (parallelism); memory is roughly 128 × N × r × p bytes."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Password"
      toTitle="Derived Key (scrypt)"
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
