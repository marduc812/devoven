'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PipelineState, BlockState, linkedField } from '@/lib/blocks/types';
import { finalBlock } from '@/lib/blocks/pipeline';
import { usePipelineResults } from './usePipelineResults';
import { serializePipeline, deserializePipeline } from '@/lib/blocks/serialization';
import { OPERATION_MAP } from '@/lib/blocks/registry';
import PipelineInput from './PipelineInput';
import PipelineOutput from './PipelineOutput';
import BlockList from './BlockList';
import AddBlockModal from './AddBlockModal';
import SavedPipelinesPanel from './SavedPipelinesPanel';
import { IoAddOutline, IoSaveOutline, IoLinkOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { loadDraft, saveDraft, clearDraft } from '@/lib/blocks/storage';

const EMPTY_PIPELINE: PipelineState = { input: '', blocks: [] };

// Longest `?p=` the address bar is kept in sync with. The server refuses
// query strings past ~16KB, so a longer pipeline is only shared on demand.
const MAX_SYNCED_LINK = 8_000;

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function buildDefaultParams(operationId: string): Record<string, string> {
  const op = OPERATION_MAP[operationId];
  if (!op) return {};
  return Object.fromEntries([
    ...op.params.map((p) => [p.id, p.default]),
    ...(op.inputs ?? []).map((f) => [f.id, '']),
  ]);
}

function newBlock(operationId: string): BlockState {
  const op = OPERATION_MAP[operationId];
  const block: BlockState = { id: generateId(), operationId, params: buildDefaultParams(operationId), enabled: true };
  // A multi-input block starts with its first field fed by the previous block.
  if (op?.inputs && op.inputs.length > 0) block.linked = op.inputs[0].id;
  return block;
}

export default function BlocksPage() {
  const [pipeline, setPipeline] = useState<PipelineState>(EMPTY_PIPELINE);
  const [showAddModal, setShowAddModal] = useState(false);
  const [insertAtIndex, setInsertAtIndex] = useState(0);
  const [showSaved, setShowSaved] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const encoded = params.get('p');
    if (encoded) {
      const loaded = deserializePipeline(encoded);
      if (loaded) { setPipeline(loaded); return; }
    }
    const draft = loadDraft();
    if (draft) setPipeline(draft);
  }, []);

  // Every change is kept: as a draft in local storage, and in the address bar
  // as `?p=` while it fits, so the URL is always a link to what is on screen.
  useEffect(() => {
    if (!isInitialized.current) return;
    const timer = window.setTimeout(() => {
      saveDraft(pipeline);
      const url = new URL(window.location.href);
      if (pipeline.blocks.length === 0) {
        url.searchParams.delete('p');
      } else {
        const encoded = serializePipeline(pipeline);
        if (encoded.length <= MAX_SYNCED_LINK) url.searchParams.set('p', encoded);
        else url.searchParams.delete('p');
      }
      if (url.toString() !== window.location.href) history.replaceState(null, '', url.toString());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [pipeline]);

  const updatePipeline = useCallback(
    (updater: (prev: PipelineState) => PipelineState) => setPipeline((prev) => updater(prev)),
    []
  );

  /** A link to the current pipeline, whatever its length. */
  const shareUrl = useCallback((state: PipelineState) => {
    const url = new URL(window.location.href);
    url.searchParams.set('p', serializePipeline(state));
    return url.toString();
  }, []);

  const handleCopyLink = async () => {
    if (pipeline.blocks.length === 0) { toast.error('Add a block first'); return; }
    await navigator.clipboard.writeText(shareUrl(pipeline));
    toast.success('Copied link to these blocks');
  };

  // The pipeline runs in a worker: an operation given a hostile parameter (a
  // regex from a share link, say) can take minutes, and a worker can be killed
  // where a render pass cannot.
  const { results, note } = usePipelineResults(pipeline);

  // The pipeline stops at its terminal block, so the final output is that
  // block's result rather than the last block in the list.
  const lastBlock = useMemo(() => finalBlock(pipeline), [pipeline]);
  const terminalOp = lastBlock ? OPERATION_MAP[lastBlock.operationId] : null;

  const finalOutput = useMemo(() => {
    if (note) return '';
    if (!lastBlock) return pipeline.input;
    const last = results.find((r) => r.blockId === lastBlock.id);
    if (!last) return pipeline.input;
    return last.error ? '' : last.output;
  }, [results, lastBlock, pipeline.input, note]);

  const handleInputChange = (value: string) => updatePipeline((prev) => ({ ...prev, input: value }));

  // The input pane takes the shape of the first block. A block with named
  // fields puts those fields at the top of the page: the linked one is the
  // pipeline input, the others are the block's own values.
  const firstBlock = pipeline.blocks[0] ?? null;
  const firstOp = firstBlock ? OPERATION_MAP[firstBlock.operationId] : null;
  const firstFields = firstOp?.inputs && firstOp.inputs.length > 0 ? firstOp.inputs : null;
  const firstLinked = firstOp && firstBlock ? linkedField(firstOp, firstBlock) : null;
  const firstFieldValues = useMemo(() => {
    if (!firstFields || !firstBlock) return undefined;
    return Object.fromEntries(
      firstFields.map((f) => [f.id, f.id === firstLinked ? pipeline.input : firstBlock.params[f.id] ?? ''])
    );
  }, [firstFields, firstBlock, firstLinked, pipeline.input]);
  const handleFirstFieldChange = (fieldId: string, value: string) => {
    if (!firstBlock) return;
    if (fieldId === firstLinked) handleInputChange(value);
    else handleParamChange(firstBlock.id, fieldId, value);
  };

  const handleAddBlock = (operationId: string, atIndex: number) => {
    const block = newBlock(operationId);
    updatePipeline((prev) => {
      const blocks = [...prev.blocks];
      blocks.splice(atIndex, 0, block);
      return { ...prev, blocks };
    });
  };

  const handleToggle = (id: string) =>
    updatePipeline((prev) => ({ ...prev, blocks: prev.blocks.map((b) => (b.id === id ? { ...b, enabled: !b.enabled } : b)) }));

  const handleRemove = (id: string) =>
    updatePipeline((prev) => ({ ...prev, blocks: prev.blocks.filter((b) => b.id !== id) }));

  const handleParamChange = (blockId: string, paramId: string, value: string) =>
    updatePipeline((prev) => ({ ...prev, blocks: prev.blocks.map((b) => b.id === blockId ? { ...b, params: { ...b.params, [paramId]: value } } : b) }));

  const handleLinkChange = (blockId: string, fieldId: string | null) =>
    updatePipeline((prev) => ({ ...prev, blocks: prev.blocks.map((b) => (b.id === blockId ? { ...b, linked: fieldId } : b)) }));

  const handleReorder = (newBlocks: BlockState[]) => updatePipeline((prev) => ({ ...prev, blocks: newBlocks }));

  const handleAddAt = (index: number) => { setInsertAtIndex(index); setShowAddModal(true); };

  const handleLoadPipeline = (loaded: PipelineState) => setPipeline(loaded);

  const handleClearPipeline = () => {
    updatePipeline(() => EMPTY_PIPELINE);
    clearDraft();
    const url = new URL(window.location.href);
    url.searchParams.delete('p');
    history.replaceState(null, '', url.toString());
  };

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="border-b border-gray-900 px-8 md:px-12 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 bg-indigo-500 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Pipeline</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Blocks Builder</h1>
            <p className="text-sm text-gray-500 mt-2">
              Chain operations together — each block&apos;s output feeds the next.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 mt-1">
            <button
              onClick={handleCopyLink}
              title="Copy a link that opens these blocks, input and settings included"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm font-medium text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150"
            >
              <IoLinkOutline className="text-base" />
              Copy link
            </button>
            <button
              onClick={handleClearPipeline}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 text-sm font-medium text-gray-500 hover:border-red-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
            >
              Clear
            </button>
            <button
              onClick={() => setShowSaved(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-900 bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors duration-150"
            >
              <IoSaveOutline className="text-base" />
              Save / Load
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-8 md:px-12 py-8 space-y-6">
        {firstBlock && (
          <PipelineInput
            value={pipeline.input}
            onChange={handleInputChange}
            fields={firstFields ?? undefined}
            fieldValues={firstFieldValues}
            onFieldChange={handleFirstFieldChange}
          />
        )}

        {note && (
          <div className="border border-red-300 bg-red-50 px-4 py-3 text-sm font-mono text-red-700">
            {note}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Blocks
              {pipeline.blocks.length > 0 && (
                <span className="ml-1.5 text-gray-400">({pipeline.blocks.length})</span>
              )}
            </span>
          </div>

          {pipeline.blocks.length === 0 && (
            <p className="text-sm text-gray-400 py-2">
              Add a block to start. The input pane takes the shape of the first block: one box, or one per named field.
            </p>
          )}

          <BlockList
            input={pipeline.input}
            blocks={pipeline.blocks}
            results={results}
            onToggle={handleToggle}
            onRemove={handleRemove}
            onParamChange={handleParamChange}
            onLinkChange={handleLinkChange}
            onReorder={handleReorder}
            onAddAt={handleAddAt}
          />

          <button
            onClick={() => handleAddAt(pipeline.blocks.length)}
            className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-gray-300 text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 text-sm font-medium"
          >
            <IoAddOutline className="text-lg" />
            Add Block
          </button>
        </div>

        {firstBlock && (
          <PipelineOutput
            value={finalOutput}
            onShare={() => shareUrl(pipeline)}
            terminalOp={terminalOp}
            terminalParams={lastBlock?.params}
          />
        )}
      </div>

      {showAddModal && (
        <AddBlockModal insertAtIndex={insertAtIndex} onAdd={handleAddBlock} onClose={() => setShowAddModal(false)} />
      )}
      {showSaved && (
        <SavedPipelinesPanel currentPipeline={pipeline} onLoad={handleLoadPipeline} onClose={() => setShowSaved(false)} />
      )}
    </div>
  );
}
