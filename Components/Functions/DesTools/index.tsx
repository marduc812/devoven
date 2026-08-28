'use client'

import { useEffect, useState } from 'react'
import CryptoJS from 'crypto-js'
import Panel from '@/Components/MainView/MainPanel/Panel'

const fieldClass =
  'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm'
const labelClass = 'text-xs text-gray-400 uppercase tracking-wider'

export function DesEncrypt() {
  const [plaintext, setPlaintext] = useState('')
  const [password, setPassword] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!plaintext || !password) { setOutput(''); setError(''); return }
    try {
      setOutput(CryptoJS.DES.encrypt(plaintext, password).toString())
      setError('')
    } catch (e) {
      setOutput('')
      setError(e instanceof Error ? e.message : 'Encryption failed.')
    }
  }, [plaintext, password])

  return (
    <Panel
      title="DES Encrypt"
      description="Encrypt text using the DES algorithm with a password. The result updates as you type. All encryption happens client-side in your browser."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <label className={labelClass}>Plaintext</label>
          <textarea
            className={`${fieldClass} resize-none`}
            placeholder="Enter text to encrypt…"
            rows={4}
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
          />
          <label className={labelClass}>Password</label>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            className={fieldClass}
            placeholder="Enter password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <label className={labelClass}>Encrypted Output</label>
          <textarea
            className="bg-gray-50 text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
            placeholder="Enter a plaintext and a password to see the ciphertext…"
            rows={4}
            value={output}
            readOnly
          />
        </div>
      }
    />
  )
}

export function DesDecrypt() {
  const [cipherInput, setCipherInput] = useState('')
  const [password, setPassword] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!cipherInput.trim() || !password) { setOutput(''); setError(''); return }
    try {
      const result = CryptoJS.DES.decrypt(cipherInput, password).toString(CryptoJS.enc.Utf8)
      if (!result) {
        setOutput('')
        setError('Decryption failed. Check your ciphertext and password.')
        return
      }
      setOutput(result)
      setError('')
    } catch {
      setOutput('')
      setError('Decryption failed. Check your ciphertext and password.')
    }
  }, [cipherInput, password])

  return (
    <Panel
      title="DES Decrypt"
      description="Decrypt DES encrypted text using your password. Paste the output from the DES Encrypt tool and the plaintext appears as you type."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <label className={labelClass}>Encrypted Text</label>
          <textarea
            className={`${fieldClass} resize-none`}
            placeholder="Paste encrypted text…"
            rows={4}
            value={cipherInput}
            onChange={(e) => setCipherInput(e.target.value)}
          />
          <label className={labelClass}>Password</label>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            className={fieldClass}
            placeholder="Enter password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <label className={labelClass}>Decrypted Output</label>
          <textarea
            className="bg-gray-50 text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-300 cursor-default resize-y font-mono text-sm"
            placeholder="Enter a ciphertext and a password to see the plaintext…"
            rows={4}
            value={output}
            readOnly
          />
        </div>
      }
    />
  )
}
