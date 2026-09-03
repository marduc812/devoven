'use client';

import React from 'react';
import { IoReorderThreeOutline, IoCloseOutline, IoClipboardOutline } from 'react-icons/io5';
import { BlockState, BlockResult, linkedField } from '@/lib/blocks/types';
import { OPERATION_MAP } from '@/lib/blocks/registry';
import BlockParams from './BlockParams';
import BlockInputs from './BlockInputs';
import TerminalArtifact from './TerminalArtifact';
import { categoryAccent, categoryShortLabel } from './categoryMeta';
import toast from 'react-hot-toast';

type BlockItemProps = {
  block: BlockState;
  index: number;
  result: BlockResult | undefined;
  onToggle: () => void;
  onRemove: () => void;
  onParamChange: (paramId: string, value: string) => void;
  onLinkChange: (fieldId: string | null) => void;
  /** What this block receives: the pipeline input, or the previous block's output. */
  upstream: string;
  dragHandleProps: React.HTMLAttributes<HTMLDivElement>;
  isDragging?: boolean;
  unreachable?: boolean;
};

export default function BlockItem({ block, index, result, onToggle, onRemove, onParamChange, onLinkChange, upstream, dragHandleProps, isDragging, unreachable }: BlockItemProps) {
  const op = OPERATION_MAP[block.operationId];
  const hasError = result?.error !== null && result?.error !== undefined;
  const outputPreview = result?.output ?? '';
  const artifact = op?.output && op.output !== 'text' ? op.output : null;

  const handleCopyOutput = async () => {
    if (outputPreview) {
      await navigator.clipboard.writeText(outputPreview);
      toast.success('Copied!');
    }
  };

  const accent = (op && categoryAccent[op.category]) ?? 'bg-gray-400';

  return (
    <div
      className={`border bg-white transition-all duration-150 ${
        block.enabled && !unreachable ? 'opacity-100' : 'opacity-40'
      } ${isDragging ? 'shadow-md border-gray-900' : unreachable ? 'border-dashed border-gray-300' : 'border-gray-300'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <div
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700 text-xl flex-shrink-0 transition-colors"
          title="Drag to reorder"
        >
          <IoReorderThreeOutline />
        </div>

        <span className="text-xs font-bold text-gray-400 w-5 flex-shrink-0">#{index + 1}</span>

        <span className="font-semibold text-sm text-gray-900 flex-1 truncate">{op?.name ?? block.operationId}</span>

        {op?.terminal && (
          <span
            className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-1 py-px border border-gray-400 text-gray-500"
            title="Terminal block: produces a final result — nothing runs after it"
          >
            End
          </span>
        )}

        {op && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-2 h-2 ${accent}`} />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{categoryShortLabel[op.category] ?? op.category}</span>
          </div>
        )}

        {/* Toggle */}
        <button
          onClick={onToggle}
          title={block.enabled ? 'Disable block' : 'Enable block'}
          className={`flex-shrink-0 relative inline-flex w-9 h-5 transition-colors duration-150 border ${
            block.enabled ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'
          }`}
        >
          <span
            className={`pointer-events-none absolute top-0.5 left-0.5 w-4 h-4 bg-white shadow transition-transform duration-150 ${
              block.enabled ? 'translate-x-4' : 'translate-x-0'
            } ${block.enabled ? '' : 'bg-gray-300'}`}
          />
        </button>

        <button onClick={onRemove} title="Remove block" className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors">
          <IoCloseOutline className="text-lg" />
        </button>
      </div>

      {/* Named inputs of a multi-input operation. The first block's fields are
          the pipeline input pane itself, so only later blocks show them here. */}
      {op?.inputs && op.inputs.length > 0 && index > 0 && (
        <div className="border-b border-gray-200">
          <BlockInputs
            fields={op.inputs}
            values={block.params}
            linked={linkedField(op, block)}
            upstream={upstream}
            onChange={onParamChange}
            onLinkChange={onLinkChange}
          />
        </div>
      )}

      {/* Params */}
      {op && op.params.length > 0 && (
        <div className="px-1 py-1 border-b border-gray-200 bg-gray-50">
          <BlockParams params={op.params} values={block.params} onChange={onParamChange} />
        </div>
      )}

      {/* Output preview */}
      <div className="flex items-center gap-2 px-3 py-2 min-h-[36px] bg-gray-50">
        {hasError ? (
          <span className="text-xs text-red-600 font-medium flex-1 truncate">
            {unreachable ? result?.error : `Error: ${result?.error}`}
          </span>
        ) : artifact ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TerminalArtifact kind={artifact} value={outputPreview} size="preview" errorCorrection={block.params.level} />
            <span className="text-xs text-gray-500 font-mono truncate">{outputPreview}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500 font-mono flex-1 truncate">
            {outputPreview || <span className="italic text-gray-400">empty output</span>}
          </span>
        )}
        {outputPreview && !hasError && (
          <button onClick={handleCopyOutput} className="flex-shrink-0 text-gray-400 hover:text-gray-900 transition-colors" title="Copy output">
            <IoClipboardOutline className="text-base" />
          </button>
        )}
      </div>
    </div>
  );
}
