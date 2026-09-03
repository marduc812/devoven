'use client';

import React, { useState } from 'react';
import { BlockState, BlockResult } from '@/lib/blocks/types';
import { terminalBlockIndex } from '@/lib/blocks/pipeline';
import BlockItem from './BlockItem';
import { IoAddOutline } from 'react-icons/io5';

type BlockListProps = {
  input: string;
  blocks: BlockState[];
  results: BlockResult[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onParamChange: (id: string, paramId: string, value: string) => void;
  onLinkChange: (id: string, fieldId: string | null) => void;
  onReorder: (newBlocks: BlockState[]) => void;
  onAddAt: (index: number) => void;
};

export default function BlockList({ input, blocks, results, onToggle, onRemove, onParamChange, onLinkChange, onReorder, onAddAt }: BlockListProps) {
  const [dragSrcIndex, setDragSrcIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hoveredInsert, setHoveredInsert] = useState<number | null>(null);

  // Nothing runs after a terminal block, so neither downstream blocks nor the
  // insert affordances past it are live.
  const endsAt = terminalBlockIndex(blocks);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragSrcIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragSrcIndex === null || dragSrcIndex === dropIndex) { setDragSrcIndex(null); setDragOverIndex(null); return; }
    const newBlocks = [...blocks];
    const [removed] = newBlocks.splice(dragSrcIndex, 1);
    newBlocks.splice(dropIndex, 0, removed);
    onReorder(newBlocks);
    setDragSrcIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => { setDragSrcIndex(null); setDragOverIndex(null); };

  return (
    <div className="flex flex-col gap-1">
      <InsertAffordance index={0} hovered={hoveredInsert === 0} onHover={setHoveredInsert} onAdd={onAddAt} disabled={false} />

      {blocks.map((block, index) => {
        const result = results.find((r) => r.blockId === block.id);
        // What flows into this block: the pipeline input for the first one,
        // otherwise the previous block's result (empty when that block failed).
        const previous = index === 0 ? null : results.find((r) => r.blockId === blocks[index - 1].id);
        const upstream = index === 0 ? input : previous && !previous.error ? previous.output : '';
        const isDragging = dragSrcIndex === index;
        const isDragOver = dragOverIndex === index;

        return (
          <React.Fragment key={block.id}>
            <div
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDrop={handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`transition-transform ${isDragOver && !isDragging ? 'scale-[1.01]' : ''}`}
            >
              <BlockItem
                block={block}
                index={index}
                result={result}
                onToggle={() => onToggle(block.id)}
                onRemove={() => onRemove(block.id)}
                onParamChange={(paramId, value) => onParamChange(block.id, paramId, value)}
                onLinkChange={(fieldId) => onLinkChange(block.id, fieldId)}
                upstream={upstream}
                isDragging={isDragging}
                dragHandleProps={{}}
                unreachable={endsAt !== -1 && index > endsAt}
              />
            </div>
            <InsertAffordance
              index={index + 1}
              hovered={hoveredInsert === index + 1}
              onHover={setHoveredInsert}
              onAdd={onAddAt}
              disabled={endsAt !== -1 && index >= endsAt}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

function InsertAffordance({ index, hovered, onHover, onAdd, disabled }: { index: number; hovered: boolean; onHover: (idx: number | null) => void; onAdd: (idx: number) => void; disabled: boolean; }) {
  return (
    <div
      className={`flex items-center justify-center h-6 group relative ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={() => { if (!disabled) onAdd(index); }}
      title={disabled ? 'The pipeline ends at the terminal block above' : undefined}
    >
      <div className={`flex items-center gap-1 text-xs font-medium uppercase tracking-wide transition-opacity ${disabled ? 'text-gray-300' : 'text-gray-500'} ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        {!disabled && <IoAddOutline className="text-sm" />}
        <span>{disabled ? 'Pipeline ends here' : 'Add here'}</span>
      </div>
      <div className={`absolute h-px bg-gray-300 w-full pointer-events-none transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}
