'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel'
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter'
import {
  formatAesOutput,
  parseAesInput,
  base32DecodeToBytes,
  totpTimeStep,
  timeStepToBytes,
  hotp,
  formatTotp,
  totpSecondsRemaining,
  extractFromText,
  formatExtractResults,
  ExtractType,
} from './logic'

// ─── AES Encrypt ─────────────────────────────────────────────────────────────

async function aesEncrypt(plaintext: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext)))
  return formatAesOutput(salt, iv, ciphertext)
}

export function AesEncrypt() {
  const [plaintext, setPlaintext] = useState('')
  const [password, setPassword] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEncrypt = async () => {
    if (!plaintext.trim()) { setError('Please enter text to encrypt.'); return }
    if (!password) { setError('Please enter a password.'); return }
    setError('')
    setLoading(true)
    try {
      const result = await aesEncrypt(plaintext, password)
      setOutput(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel
      title="AES Encrypt"
      description="Encrypt text with AES-256-GCM using a password. The output is a compact base64url-encoded blob containing the salt, IV, and ciphertext."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            Your data never leaves your browser.
          </div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Plaintext</label>
          <FileTextArea>
            <textarea
              className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm"
              placeholder="Enter text to encrypt…"
              rows={4}
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
            />
          </FileTextArea>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
          <input
            type="text"
            className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm"
            placeholder="Enter password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleEncrypt}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 px-4 transition-colors duration-200"
          >
            {loading ? 'Encrypting…' : 'Encrypt'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {output && (
            <>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Encrypted Output</label>
              <textarea
                className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
                rows={4}
                value={output}
                readOnly
              />
            </>
          )}
        </div>
      }
    />
  )
}

// ─── AES Decrypt ─────────────────────────────────────────────────────────────

async function aesDecrypt(encoded: string, password: string): Promise<string> {
  const { salt, iv, ciphertext } = parseAesInput(encoded)
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}

export function AesDecrypt() {
  const [cipherInput, setCipherInput] = useState('')
  const [password, setPassword] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDecrypt = async () => {
    if (!cipherInput.trim()) { setError('Please enter encrypted text.'); return }
    if (!password) { setError('Please enter a password.'); return }
    setError('')
    setLoading(true)
    try {
      const result = await aesDecrypt(cipherInput.trim(), password)
      setOutput(result)
    } catch (e) {
      setError('Decryption failed. Check your ciphertext and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Panel
      title="AES Decrypt"
      description="Decrypt AES-256-GCM encrypted text using your password. Paste the base64url output from the AES Encrypt tool."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            Your data never leaves your browser.
          </div>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Encrypted Text</label>
          <FileTextArea>
            <textarea
              className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm"
              placeholder="Paste encrypted base64url text…"
              rows={4}
              value={cipherInput}
              onChange={(e) => setCipherInput(e.target.value)}
            />
          </FileTextArea>
          <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
          <input
            type="text"
            className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm"
            placeholder="Enter password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleDecrypt}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 px-4 transition-colors duration-200"
          >
            {loading ? 'Decrypting…' : 'Decrypt'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {output && (
            <>
              <label className="text-xs text-gray-400 uppercase tracking-wider">Decrypted Output</label>
              <textarea
                className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
                rows={4}
                value={output}
                readOnly
              />
            </>
          )}
        </div>
      }
    />
  )
}

// ─── TOTP Generator ───────────────────────────────────────────────────────────

async function generateTotp(secret: string): Promise<string> {
  const keyBytes = base32DecodeToBytes(secret)
  const step = totpTimeStep()
  const message = timeStepToBytes(step)
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, message))
  return formatTotp(hotp(sig))
}

export function TotpGenerator() {
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [seconds, setSeconds] = useState(30)
  const [error, setError] = useState('')
  const [otpauthUri, setOtpauthUri] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const generate = useCallback(async (s: string) => {
    if (!s.trim()) return
    try {
      setError('')
      const result = await generateTotp(s.trim())
      setCode(result)
      setOtpauthUri(`otpauth://totp/DevOven?secret=${s.trim().toUpperCase()}&issuer=DevOven`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid secret.')
      setCode('')
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!secret.trim()) { setSeconds(totpSecondsRemaining()); return }

    generate(secret)
    setSeconds(totpSecondsRemaining())

    timerRef.current = setInterval(() => {
      const rem = totpSecondsRemaining()
      setSeconds(rem)
      if (rem === 30) generate(secret)
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [secret, generate])

  return (
    <Panel
      title="TOTP Generator"
      description="Generate time-based one-time passwords (TOTP / RFC 6238) from a Base32 secret. Codes refresh every 30 seconds."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Base32 Secret</label>
          <input
            type="text"
            className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm uppercase"
            placeholder="e.g. JBSWY3DP…"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {code && (
            <div className="flex flex-col items-center gap-2 py-4">
              <span className="text-6xl font-mono font-bold text-emerald-300 tracking-widest">{code}</span>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: seconds > 10 ? '#34d399' : '#f87171' }}
                />
                <span>Refreshes in {seconds}s</span>
              </div>
            </div>
          )}
          {otpauthUri && (
            <div className="mt-2">
              <label className="text-xs text-gray-400 uppercase tracking-wider">OTPAuth URI</label>
              <textarea
                className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-xs mt-1"
                rows={2}
                value={otpauthUri}
                readOnly
              />
            </div>
          )}
        </div>
      }
    />
  )
}

// ─── Extract from Text ────────────────────────────────────────────────────────

const EXTRACT_OPTIONS: { label: string; value: ExtractType }[] = [
  { label: 'Emails', value: 'emails' },
  { label: 'URLs', value: 'urls' },
  { label: 'IP Addresses', value: 'ips' },
  { label: 'Phone Numbers', value: 'phones' },
  { label: 'Dates', value: 'dates' },
  { label: 'Credit Card Numbers', value: 'creditcards' },
]

export function ExtractFromText() {
  const [input, setInput] = useState('')
  const [extractType, setExtractType] = useState<ExtractType>('emails')
  const [output, setOutput] = useState('')

  useEffect(() => {
    const matches = extractFromText(input, extractType)
    setOutput(formatExtractResults(matches, extractType))
  }, [input, extractType])

  const extraElements = (
    <select
      className="bg-gray-100 text-gray-900 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-400 transition-colors duration-200"
      value={extractType}
      onChange={(e) => setExtractType(e.target.value as ExtractType)}
    >
      {EXTRACT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )

  return (
    <AdvancedConverter
      title="Extract from Text"
      description="Paste any text and extract emails, URLs, IP addresses, phone numbers, dates, or credit card numbers using smart pattern matching."
      backColor="lime"
      fromTitle="Input Text"
      toTitle="Extracted Results"
      fromValue={input}
      setFromValue={setInput}
      toValue={output}
      extraElements={extraElements}
    />
  )
}
