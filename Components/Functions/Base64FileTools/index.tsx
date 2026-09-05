'use client';

import React, { useState, useRef } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { isDataUri, stripDataUriPrefix, guessFilename, getBase64Stats, base64ToMimeType } from './logic';

export const Base64File = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [base64Output, setBase64Output] = useState('');
  const [decodeInput, setDecodeInput] = useState('');
  const [fileName, setFileName] = useState('');
  const [stats, setStats] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBase64Output(result);
      setStats(getBase64Stats(result));
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBase64Output(result);
      setStats(getBase64Stats(result));
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  };

  const handleCopy = () => {
    if (!base64Output) return;
    navigator.clipboard.writeText(base64Output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleDecode = () => {
    const input = decodeInput.trim();
    if (!input) { setError('Please enter a base64 string or data URI'); return; }
    setError('');
    try {
      const dataUri = isDataUri(input) ? input : `data:application/octet-stream;base64,${input}`;
      const mimeType = base64ToMimeType(dataUri);
      const cleanBase64 = stripDataUriPrefix(dataUri);
      const guessed = guessFilename(mimeType);

      const byteStr = atob(cleanBase64);
      const bytes = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = guessed;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Invalid base64 input');
    }
  };

  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 font-mono text-sm w-full resize-none';

  return (
    <Panel
      backColor="lime"
      title="Base64 File Encoder / Decoder"
      description="Encode any file to [1base642] string, or paste a base64 string to download the file. All processing happens in your browser."
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setMode('encode'); setError(''); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${mode === 'encode' ? 'bg-gray-900 text-white border-gray-900' : 'border border-gray-200 text-gray-400 hover:text-gray-900'}`}
            >
              Encode File
            </button>
            <button
              onClick={() => { setMode('decode'); setError(''); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${mode === 'decode' ? 'bg-gray-900 text-white border-gray-900' : 'border border-gray-200 text-gray-400 hover:text-gray-900'}`}
            >
              Decode Base64
            </button>
          </div>

          {mode === 'encode' && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-400 p-8 text-center cursor-pointer hover:border-white/30 transition-colors"
              >
                <p className="text-gray-400 text-sm">Drop a file here or <span className="text-gray-700 underline">click to browse</span></p>
                {fileName && <p className="text-gray-700 text-sm mt-2 font-mono">{fileName}</p>}
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              </div>

              {base64Output && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-gray-400">Base64 Output (Data URI)</label>
                    <button onClick={handleCopy} className="text-xs text-gray-700 hover:text-gray-700 transition-colors">
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <textarea
                    className={inputClass}
                    rows={6}
                    value={base64Output}
                    readOnly
                  />
                  {stats && <p className="text-xs text-gray-500 mt-1 font-mono whitespace-pre">{stats}</p>}
                </div>
              )}
            </>
          )}

          {mode === 'decode' && (
            <>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Base64 string or Data URI</label>
                <FileTextArea>
                  <textarea
                    className={inputClass}
                    rows={6}
                    placeholder="Paste base64 or data:image/png;base64,... here"
                    value={decodeInput}
                    onChange={e => setDecodeInput(e.target.value)}
                  />
                </FileTextArea>
              </div>
              <button
                onClick={handleDecode}
                className="bg-gray-900 text-white border-gray-900 px-4 py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Download Decoded File
              </button>
            </>
          )}

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}
        </div>
      }
    />
  );
};
