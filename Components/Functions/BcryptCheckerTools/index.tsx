'use client'

import { useState } from 'react'
import bcrypt from 'bcryptjs'
import Panel from '@/Components/MainView/MainPanel/Panel'

export function BcryptChecker() {
  const [password, setPassword] = useState('')
  const [hash, setHash] = useState('')
  const [result, setResult] = useState<null | boolean>(null)

  const handleVerify = () => {
    if (!password || !hash) return
    const match = bcrypt.compareSync(password, hash)
    setResult(match)
  }

  return (
    <Panel
      title="Bcrypt Password Checker"
      description="Verify a plaintext password against a bcrypt hash. All verification happens client-side in your browser."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Password</label>
          <input
            type="text"
            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900 dark:focus:border-gray-400"
            placeholder="Enter password…"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setResult(null) }}
          />
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Bcrypt Hash</label>
          <input
            type="text"
            className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900 dark:focus:border-gray-400"
            placeholder="$2a$10$..."
            value={hash}
            onChange={(e) => { setHash(e.target.value); setResult(null) }}
          />
          <button
            onClick={handleVerify}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 px-4 transition-colors duration-200"
          >
            Verify
          </button>
          {result !== null && (
            <p className={`text-sm font-semibold ${result ? 'text-emerald-500' : 'text-red-400'}`}>
              {result ? 'Match — password is correct.' : 'No match — password does not match the hash.'}
            </p>
          )}
        </div>
      }
    />
  )
}
