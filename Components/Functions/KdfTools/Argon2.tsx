'use client';

import { useCallback, useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import {
  Argon2Variant,
  ByteFormat,
  KdfOutput,
  argon2PhcString,
  bitsToBytes,
  byteInputNote,
  decodeBytes,
  deriveArgon2,
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

type OutputFormat = KdfOutput | 'phc';

export const Argon2 = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [salt, setSalt] = useState('somesalt');
  const [saltFormat, setSaltFormat] = useState<ByteFormat>('utf8');
  const [variant, setVariant] = useState<Argon2Variant>('argon2id');
  const [time, setTime] = useState('2');
  const [memory, setMemory] = useState('19456');
  const [lanes, setLanes] = useState('1');
  const [keyBits, setKeyBits] = useState('256');
  const [secret, setSecret] = useState('');
  const [output, setOutput] = useState<OutputFormat>('phc');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
    const paramSalt = params.get('salt');
    if (paramSalt) setSalt(paramSalt);
    const paramVariant = params.get('variant');
    if (paramVariant === 'argon2id' || paramVariant === 'argon2i' || paramVariant === 'argon2d') {
      setVariant(paramVariant);
    }
    for (const [key, setter] of [
      ['t', setTime],
      ['m', setMemory],
      ['p', setLanes],
      ['bits', setKeyBits],
    ] as const) {
      const value = params.get(key);
      if (value) setter(value);
    }
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ salt, variant, t: time, m: memory, p: lanes, bits: keyBits })

  const derive = useCallback(() => {
    if (!fromValue) {
      setToValue('');
      return;
    }
    setBusy(true);
    afterPaint(() => {
      try {
        const saltBytes = decodeBytes(salt, saltFormat, 'Salt');
        const options = {
          salt: saltBytes,
          t: Number(time),
          m: Number(memory),
          p: Number(lanes),
          variant,
          dkLen: bitsToBytes(Number(keyBits)),
          secret: secret ? decodeBytes(secret, 'utf8', 'Secret') : undefined,
        };
        const key = deriveArgon2(fromValue, options);
        setToValue(
          output === 'phc' ? argon2PhcString(key, options) : encodeKey(key, output),
        );
      } catch (error) {
        setToValue(error instanceof Error ? error.message : 'Could not derive a key');
      } finally {
        setBusy(false);
      }
    });
  }, [fromValue, salt, saltFormat, variant, time, memory, lanes, keyBits, secret, output]);

  useEffect(() => {
    setToValue('');
  }, [fromValue, salt, saltFormat, variant, time, memory, lanes, keyBits, secret, output]);

  const memoryMb = Number(memory) / 1024;
  // Argon2's cost is linear in passes x memory. This implementation manages
  // roughly 10 MiB-passes per second on a mid-range laptop, measured across
  // m=4 MiB to m=64 MiB; browsers are usually a little slower than that, so the
  // estimate leans pessimistic on purpose. It sets expectations, it is not a
  // benchmark.
  const memoryPasses = Number(memory) * Number(time);
  const estimateSeconds =
    Number.isFinite(memoryPasses) && memoryPasses > 0 ? memoryPasses / 1024 / 9 : null;

  const saltNote = byteInputNote(salt, saltFormat);

  const extraElements = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Variant">
          <select
            className={SELECT_CLASS}
            value={variant}
            onChange={(e) => setVariant(e.target.value as Argon2Variant)}
          >
            <option value="argon2id">Argon2id (recommended)</option>
            <option value="argon2i">Argon2i</option>
            <option value="argon2d">Argon2d</option>
          </select>
        </Field>
        <Field label="Salt (min 8 bytes)">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="unique per password"
            value={salt}
            onChange={(e) => setSalt(e.target.value)}
          />
        </Field>
        <ByteFormatSelect value={saltFormat} onChange={setSaltFormat} />
        <NumberField label="t (passes)" value={time} onChange={setTime} width="w-24" />
        <NumberField label="m (KiB)" value={memory} onChange={setMemory} width="w-28" />
        <NumberField label="p (lanes)" value={lanes} onChange={setLanes} width="w-24" />
        <NumberField label="Key size (bits)" value={keyBits} onChange={setKeyBits} width="w-28" />
        <Field label="Secret / pepper (optional)">
          <input
            type="text"
            className={INPUT_CLASS}
            placeholder="server-side key, never stored with the hash"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
        </Field>
        <Field label="Output">
          <select
            className={SELECT_CLASS}
            value={output}
            onChange={(e) => setOutput(e.target.value as OutputFormat)}
          >
            <option value="phc">PHC string</option>
            <option value="hex">Hex</option>
            <option value="base64">Base64</option>
          </select>
        </Field>
        <DeriveButton onClick={derive} busy={busy} />
      </div>
      {saltNote && <p className="text-xs text-gray-500">{saltNote}</p>}
      {estimateSeconds !== null && (
        <p className="text-xs text-gray-500">
          Memory cost is <span className="font-mono text-gray-700">{memoryMb.toFixed(memoryMb < 10 ? 1 : 0)} MB</span>{' '}
          per derivation, roughly{' '}
          <span className="font-mono text-gray-700">
            {estimateSeconds < 1 ? 'under a second' : `${estimateSeconds.toFixed(estimateSeconds < 10 ? 1 : 0)} s`}
          </span>{' '}
          of blocked main thread. Pure-JS Argon2 runs several times slower than a native build, so a server using
          the same parameters will be much quicker than this page.
        </p>
      )}
    </div>
  );

  return (
    <AdvancedConverter
      title="Argon2 Password Hashing"
      description="Argon2 won the 2015 Password Hashing Competition and is the current default recommendation for storing passwords. [1 Argon2id 2] is the variant to use unless you have a specific reason otherwise — it resists both GPU cracking and side-channel attacks. OWASP suggests [1 m=19456, t=2, p=1 2] as a floor. The PHC string output is what goes in a database column."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Password"
      toTitle={output === 'phc' ? 'PHC Hash String' : 'Derived Key'}
      extraElements={extraElements}
      backColor="teal"
    />
  );
};
