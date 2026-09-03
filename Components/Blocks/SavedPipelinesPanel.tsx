'use client';

import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { SavedPipeline, PipelineState } from '@/lib/blocks/types';
import { loadSavedPipelines, savePipeline, deletePipeline, exportPipelineJson, importPipelineJson } from '@/lib/blocks/storage';
import { IoCloseOutline, IoTrashOutline, IoDownloadOutline, IoCodeDownloadOutline, IoFolderOpenOutline } from 'react-icons/io5';

type SavedPipelinesPanelProps = {
  currentPipeline: PipelineState;
  onLoad: (pipeline: PipelineState) => void;
  onClose: () => void;
};

function SavedPipelinesPanelContent({ currentPipeline, onLoad, onClose }: SavedPipelinesPanelProps) {
  const [savedPipelines, setSavedPipelines] = useState<SavedPipeline[]>([]);
  const [saveName, setSaveName] = useState('');

  useEffect(() => { setSavedPipelines(loadSavedPipelines()); }, []);

  const handleSave = () => {
    const name = saveName.trim();
    if (!name) return;
    savePipeline(name, currentPipeline);
    setSavedPipelines(loadSavedPipelines());
    setSaveName('');
  };

  const handleDelete = (name: string) => {
    deletePipeline(name);
    setSavedPipelines(loadSavedPipelines());
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // The JSON file is the pipeline's own format: what a `?p=` link carries,
  // readable and diffable, so it can live in a repo or be sent around.
  const downloadJson = (pipeline: PipelineState, name: string) => {
    const blob = new Blob([exportPipelineJson(pipeline, name)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'blocks'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File | undefined) => {
    if (!file) return;
    const loaded = importPipelineJson(await file.text());
    if (!loaded) { toast.error('That file is not a blocks pipeline'); return; }
    onLoad(loaded);
    onClose();
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-900 shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="font-black text-lg text-gray-900 tracking-tight">Saved Blocks</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <IoCloseOutline className="text-2xl" />
          </button>
        </div>

        {/* Save current */}
        <div className="px-4 py-3 border-b border-gray-200">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Save current pipeline</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Pipeline name..."
              className="flex-1 border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none transition-colors"
            />
            <button
              onClick={handleSave}
              disabled={!saveName.trim()}
              className="px-3 py-1.5 bg-gray-900 border border-gray-900 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Save
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => downloadJson(currentPipeline, saveName.trim() || 'blocks')}
              disabled={currentPipeline.blocks.length === 0}
              title="Download the current pipeline as a JSON file"
              className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-150"
            >
              <IoCodeDownloadOutline className="text-sm" />
              Export JSON
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Load a pipeline from a JSON file"
              className="flex items-center gap-1 text-xs px-2.5 py-1 border border-gray-300 text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150"
            >
              <IoFolderOpenOutline className="text-sm" />
              Import JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => { void handleImportFile(e.target.files?.[0]); e.target.value = ''; }}
            />
          </div>
        </div>

        {/* Saved list */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
          {savedPipelines.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No saved pipelines yet</p>
          )}

          {savedPipelines.map((sp) => (
            <div
              key={sp.name}
              className="flex items-center justify-between border border-gray-200 px-3 py-2.5 hover:border-gray-400 transition-colors duration-150"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-gray-900 truncate">{sp.name}</span>
                <span className="text-xs text-gray-400">
                  {sp.pipeline.blocks.length} block{sp.pipeline.blocks.length !== 1 ? 's' : ''} · {formatDate(sp.savedAt)}
                </span>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-2">
                <button
                  onClick={() => downloadJson(sp.pipeline, sp.name)}
                  title="Export as JSON"
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <IoCodeDownloadOutline className="text-lg" />
                </button>
                <button
                  onClick={() => { onLoad(sp.pipeline); onClose(); }}
                  title="Load pipeline"
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <IoDownloadOutline className="text-lg" />
                </button>
                <button
                  onClick={() => handleDelete(sp.name)}
                  title="Delete pipeline"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <IoTrashOutline className="text-lg" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function SavedPipelinesPanel(props: SavedPipelinesPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  const portalEl = document.getElementById('overlays');
  if (portalEl) return createPortal(<SavedPipelinesPanelContent {...props} />, portalEl);
  return <SavedPipelinesPanelContent {...props} />;
}
