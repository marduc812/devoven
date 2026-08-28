'use client'

import { useState } from 'react'
import CryptoJS from 'crypto-js'
import Panel from '@/Components/MainView/MainPanel/Panel'

export function RabbitEncrypt() {
  const [plaintext, setPlaintext] = useState('')
  const [password, setPassword] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const handleEncrypt = () => {
    if (!plaintext.trim()) { setError('Please enter text to encrypt.'); return }
    if (!password) { setError('Please enter a password.'); return }
    setError('')
    try {
      const result = CryptoJS.Rabbit.encrypt(plaintext, password).toString()
      setOutput(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Encryption failed.')
    }
  }

  return (
    <Panel
      title="Rabbit Encrypt"
      description="Encrypt text using the Rabbit stream cipher with a password. All encryption happens client-side in your browser."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Plaintext</label>
          <textarea
            className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm"
            placeholder="Enter text to encrypt…"
            rows={4}
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
          />
          <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
          <input
            type="password"
            className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm"
            placeholder="Enter password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleEncrypt}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 px-4 transition-colors duration-200"
          >
            Encrypt
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

export function RabbitDecrypt() {
  const [cipherInput, setCipherInput] = useState('')
  const [password, setPassword] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const handleDecrypt = () => {
    if (!cipherInput.trim()) { setError('Please enter encrypted text.'); return }
    if (!password) { setError('Please enter a password.'); return }
    setError('')
    try {
      const result = CryptoJS.Rabbit.decrypt(cipherInput, password).toString(CryptoJS.enc.Utf8)
      if (!result) { setError('Decryption failed. Check your ciphertext and password.'); return }
      setOutput(result)
    } catch (e) {
      setError('Decryption failed. Check your ciphertext and password.')
    }
  }

  return (
    <Panel
      title="Rabbit Decrypt"
      description="Decrypt Rabbit encrypted text using your password. Paste the output from the Rabbit Encrypt tool."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <label className="text-xs text-gray-400 uppercase tracking-wider">Encrypted Text</label>
          <textarea
            className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm"
            placeholder="Paste encrypted text…"
            rows={4}
            value={cipherInput}
            onChange={(e) => setCipherInput(e.target.value)}
          />
          <label className="text-xs text-gray-400 uppercase tracking-wider">Password</label>
          <input
            type="password"
            className="bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none transition-colors duration-200 font-mono text-sm"
            placeholder="Enter password…"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleDecrypt}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 px-4 transition-colors duration-200"
          >
            Decrypt
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
