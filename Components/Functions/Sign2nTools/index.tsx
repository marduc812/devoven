'use client';

import { useEffect, useRef, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import type { RecoveredKey } from './logic';
import type { WorkerMessage } from './worker';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';
const inputClass =
  'bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm resize-none break-all';

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard blocked — ignore */
        }
      }}
      className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
    >
      {copied ? 'Copied' : label}
    </button>
  );
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function stageText(stage: string, exponent?: number): string {
  if (stage === 'hashing') return 'Hashing the signing inputs…';
  if (stage === 'building-key') return 'Encoding the recovered key…';
  if (stage === 'gcd') {
    if (exponent === 65537)
      return 'Computing GCD for e=65537 — this is the slow step, typically 2–4 minutes…';
    return `Computing GCD for e=${exponent ?? '?'}…`;
  }
  return 'Working…';
}

export function Sign2nTool() {
  const [jwt1, setJwt1] = useState('');
  const [jwt2, setJwt2] = useState('');
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [cancelled, setCancelled] = useState(false);
  const [result, setResult] = useState<{ alg: string; matchedExponent: number | null; key: RecoveredKey | null } | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  // (Re)create the worker. The GCD is a single synchronous GMP call, so the only
  // way to stop a run in progress is to terminate the worker — after which we
  // spin up a fresh one so the next recovery can run.
  const spawnWorker = () => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url));
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const msg = event.data;
      if (msg.type === 'stage') {
        setStage(stageText(msg.stage, msg.exponent));
      } else if (msg.type === 'result') {
        setResult({ alg: msg.alg, matchedExponent: msg.matchedExponent, key: msg.key });
        setRunning(false);
        setStage('');
        stopTimer();
      } else if (msg.type === 'error') {
        setError(msg.message);
        setRunning(false);
        setStage('');
        stopTimer();
      }
    };
    worker.onerror = e => {
      setError(e.message || 'The recovery worker crashed');
      setRunning(false);
      setStage('');
      stopTimer();
    };
    workerRef.current = worker;
    return worker;
  };

  useEffect(() => {
    spawnWorker();
    return () => {
      workerRef.current?.terminate();
      stopTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = () => {
    workerRef.current?.terminate();
    spawnWorker(); // ready for the next run
    setRunning(false);
    setStage('');
    setElapsed(0);
    stopTimer();
    setCancelled(true);
  };

  // ?from= pre-populates the first token.
  useEffect(() => {
    const from = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    ).get('from');
    if (from) setJwt1(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: jwt1 })

  const recover = () => {
    if (!jwt1.trim() || !jwt2.trim()) {
      setError('Paste two JWTs to recover the key.');
      return;
    }
    setError('');
    setCancelled(false);
    setResult(null);
    setRunning(true);
    setStage('Starting…');
    setElapsed(0);
    const started = Date.now();
    stopTimer();
    timerRef.current = setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    workerRef.current?.postMessage({ jwt1: jwt1.trim(), jwt2: jwt2.trim() });
  };

  const key = result?.key ?? null;

  const content = (
    <div className="flex flex-col gap-6">
      {/* Heads-up about the cost */}
      <div className="bg-amber-50 border border-amber-300 px-4 py-3 text-amber-800 text-xs leading-relaxed">
        <span className="font-bold">⚠ Heavy computation.</span> Recovery for the common{' '}
        <code className="font-mono">e=65537</code> keys runs a GCD over two ~16&nbsp;MB integers
        entirely in your browser and typically takes <span className="font-bold">2–4 minutes</span>{' '}
        (small <code className="font-mono">e=3</code> keys are instant). It runs in a Web Worker, so
        this page stays responsive — leave the tab open. Nothing is uploaded.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <label className={labelClass}>JWT #1</label>
          <textarea
            rows={7}
            className={inputClass}
            value={jwt1}
            onChange={e => setJwt1(e.target.value)}
            placeholder="eyJhbGciOiJSUzI1NiII…  (an RS256/384/512 token)"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={labelClass}>JWT #2 (same key, different payload)</label>
          <textarea
            rows={7}
            className={inputClass}
            value={jwt2}
            onChange={e => setJwt2(e.target.value)}
            placeholder="eyJhbGciOiJSUzI1NiII…  (another token from the same signer)"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={recover}
            disabled={running}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
              running
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-700 cursor-pointer'
            }`}
          >
            {running ? 'Recovering…' : 'Recover Public Key'}
          </button>
          {running && (
            <button
              onClick={cancel}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-red-300 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              ■ Stop
            </button>
          )}
        </div>

        {/* Busy indicator — an animated sweep makes clear the long, ETA-less GCD
            is actively working, with a live status line and elapsed timer. */}
        {running && (
          <div className="flex flex-col gap-2">
            <span className="text-gray-700 text-xs font-mono flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              <span className="font-bold">Guessing…</span>
              <span className="text-gray-500">{stage}</span>
              <span className="text-gray-400">· {formatElapsed(elapsed)}</span>
            </span>
            <div className="h-1.5 w-full bg-gray-200 indeterminate-bar text-emerald-500" />
          </div>
        )}

        {cancelled && !running && (
          <span className="text-gray-500 text-xs font-mono">■ Stopped.</span>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 px-4 py-3 text-red-700 text-xs font-mono leading-relaxed">
          {error}
        </div>
      )}

      {result && !key && (
        <div className="bg-red-50 border border-red-300 px-4 py-3 text-red-700 text-xs leading-relaxed">
          Could not recover a modulus. Make sure both tokens were signed by the{' '}
          <span className="font-bold">same</span> RSA key (RS256/384/512) and were copied in full.
        </div>
      )}

      {key && (
        <div className="flex flex-col gap-5">
          <div className="bg-emerald-50 border border-emerald-300 px-4 py-2.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            ✓ Recovered RSA-{key.bits} public key — exponent e={key.e}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Public Key (PEM)</label>
              <CopyButton text={key.pem} />
            </div>
            <pre className="bg-gray-50 border border-gray-200 p-3 text-xs font-mono overflow-x-auto whitespace-pre">
              {key.pem}
            </pre>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className={labelClass}>Public Key (JWK)</label>
              <CopyButton text={key.jwk} />
            </div>
            <pre className="bg-gray-50 border border-gray-200 p-3 text-xs font-mono overflow-x-auto whitespace-pre">
              {key.jwk}
            </pre>
          </div>

          {/* RS→HS algorithm-confusion context (manual: paste the PEM as the HMAC secret) */}
          <div className="bg-gray-900 text-white px-4 py-4 text-xs leading-relaxed">
            <span className="font-bold uppercase tracking-wider">RS→HS algorithm confusion.</span>{' '}
            A server that verifies RS256 but also accepts HS256 can be tricked into using this
            public key as an HMAC secret. To test it, paste the recovered PEM above as the HMAC
            secret in the JWT Editor and re-sign the token as HS256. The exact key bytes matter —
            if the PEM-with-newline variant fails, try the no-newline one below.
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 font-bold uppercase tracking-wider">
              Alternate key byte variants
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">PEM without trailing newline</span>
                <CopyButton text={key.pemNoNewline} />
              </div>
              <pre className="bg-gray-50 border border-gray-200 p-3 font-mono overflow-x-auto whitespace-pre">
                {key.pemNoNewline}
              </pre>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Modulus n (hex)</span>
                <CopyButton text={key.nHex} />
              </div>
              <pre className="bg-gray-50 border border-gray-200 p-3 font-mono overflow-x-auto break-all whitespace-pre-wrap">
                {key.nHex}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );

  return (
    <Panel
      title="JWT Public Key Recovery (sign2n)"
      description="Recover the RSA [1 public key 2] from two [1 RS256 2]/RS384/RS512 JWTs signed by the same key — no public key needed. Computes [1 gcd(s₁ᵉ−m₁, s₂ᵉ−m₂) 2] to factor out the modulus, exposing the public key for RS→HS algorithm-confusion testing. Runs entirely in your browser."
      backColor="lime"
      extraElements={content}
    />
  );
}
