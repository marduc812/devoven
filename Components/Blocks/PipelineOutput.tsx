'use client';

import React, { useRef } from 'react';
import toast from 'react-hot-toast';
import { IoClipboardOutline, IoDownloadOutline, IoShareOutline } from 'react-icons/io5';
import { Operation } from '@/lib/blocks/types';
import TerminalArtifact from './TerminalArtifact';

type PipelineOutputProps = {
  value: string;
  onShare: () => string;
  terminalOp?: Operation | null;
  terminalParams?: Record<string, string>;
};

export default function PipelineOutput({ value, onShare, terminalOp, terminalParams }: PipelineOutputProps) {
  const artifact = terminalOp?.output && terminalOp.output !== 'text' ? terminalOp.output : null;
  const artifactRef = useRef<HTMLDivElement>(null);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = () => {
    // A rendered artifact downloads as the SVG on screen, not as its payload text.
    const svg = artifact ? artifactRef.current?.querySelector('svg') : null;
    const blob = svg
      ? new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
      : new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = svg ? `blocks-${artifact}.svg` : 'blocks-output.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const href = onShare();
    await navigator.clipboard.writeText(href);
    toast.success('Share link copied!');
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-widest">Final Output</span>
          {terminalOp?.terminal && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-1 py-px border border-gray-400 text-gray-500">
              End
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150"
          >
            <IoClipboardOutline className="text-sm" />
            Copy
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150"
          >
            <IoDownloadOutline className="text-sm" />
            Download
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150"
          >
            <IoShareOutline className="text-sm" />
            Share
          </button>
        </div>
      </div>
      {artifact && value ? (
        <div ref={artifactRef} className="flex flex-col items-center gap-3 p-4 border border-gray-300 bg-gray-50">
          <TerminalArtifact kind={artifact} value={value} size="full" errorCorrection={terminalParams?.level} />
          <span className="text-xs text-gray-500 font-mono break-all text-center max-w-full">{value}</span>
        </div>
      ) : (
        <textarea
          className="w-full h-28 p-3 border border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-400 font-mono text-sm resize-y focus:outline-none"
          readOnly
          value={value}
          placeholder="Output will appear here..."
          spellCheck={false}
        />
      )}
    </div>
  );
}
