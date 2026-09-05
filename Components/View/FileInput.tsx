'use client';

import React, { useCallback, useRef, useState } from 'react';
import { IoDocumentTextOutline } from 'react-icons/io5';
import toast from 'react-hot-toast';
import { contentError, sizeError } from '@/lib/textFile';
import { formatTextStats } from '@/Components/Functions/Utils';
import { boxButtonClass, boxLabelClass, boxStatsClass } from '@/Components/MainView/MainPanel/formControls';

/**
 * Loading a text file into an input surface. Anywhere a tool asks for a body of
 * text — a converter's input, one side of a diff, a named field in the blocks
 * builder — the user may have that text in a file instead of on the clipboard,
 * and every one of those surfaces offers the same two ways in: the button and a
 * drop on the box itself.
 *
 * Single values (a colour channel, a key, a latitude) stay plain inputs: there
 * is no file worth opening for six characters.
 */

/**
 * Reads one file as text and hands it over, or explains what went wrong. Every
 * entry point goes through here so the rules and the wording are the same.
 */
export async function loadTextFile(file: File, onText: (text: string, fileName: string) => void): Promise<void> {
  const tooBig = sizeError(file.name, file.size);
  if (tooBig) {
    toast.error(tooBig);
    return;
  }
  let text: string;
  try {
    text = await file.text();
  } catch {
    toast.error(`Could not read "${file.name}"`);
    return;
  }
  const notText = contentError(file.name, text);
  if (notText) {
    toast.error(notText);
    return;
  }
  onText(text, file.name);
  toast.success(`Loaded ${file.name}`);
}

type LoadFileButtonProps = {
  onText: (text: string, fileName: string) => void;
  /** Shortened to "File" where a label row is too tight for the full wording. */
  label?: string;
  /** Narrows the file picker for tools that only accept one format. */
  accept?: string;
  title?: string;
  className?: string;
};

/**
 * The button half of the control. It says what it does rather than leaving a
 * bare icon to be guessed at, and wears the same small bordered style as the
 * Copy and Save buttons it sits beside.
 */
export function LoadFileButton({
  onText,
  label = 'Select file',
  accept,
  title = 'Fill this box from a text file',
  className = '',
}: LoadFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Cleared so choosing the same file twice still fires a change event.
    event.target.value = '';
    if (file) void loadTextFile(file, onText);
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" accept={accept} onChange={pick} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title={title}
        className={`${boxButtonClass} ${className}`}
      >
        <IoDocumentTextOutline className="text-sm" />
        {label}
      </button>
    </>
  );
}

/**
 * Makes any container take a dropped text file. Spread `dropProps` on it and
 * use `dragging` to show that it will accept the drop.
 */
export function useTextFileDrop(onText: (text: string, fileName: string) => void) {
  const [dragging, setDragging] = useState(false);
  // Dragging over a child fires dragleave on the parent, so count instead.
  const depth = useRef(0);

  const carriesFile = (event: React.DragEvent) =>
    Array.from(event.dataTransfer.types).includes('Files');

  const onDragEnter = useCallback((event: React.DragEvent) => {
    if (!carriesFile(event)) return;
    depth.current += 1;
    setDragging(true);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    if (!carriesFile(event)) return;
    // Without this the browser navigates away to the dropped file.
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragLeave = useCallback(() => {
    depth.current = Math.max(0, depth.current - 1);
    if (depth.current === 0) setDragging(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      depth.current = 0;
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      event.preventDefault();
      void loadTextFile(file, onText);
    },
    [onText]
  );

  return { dragging, dropProps: { onDragEnter, onDragOver, onDragLeave, onDrop } };
}

type FileDropZoneProps = {
  onText: (text: string, fileName: string) => void;
  children: React.ReactNode;
  /** Shown over the box while a file is held above it. */
  hint?: string;
  className?: string;
};

/**
 * Wraps an input box so a file dropped anywhere on it becomes its value. The
 * box keeps its own styling; this only adds the outline and the hint.
 */
export function FileDropZone({ onText, children, hint = 'Drop a text file to load', className = '' }: FileDropZoneProps) {
  const { dragging, dropProps } = useTextFileDrop(onText);

  return (
    <div className={`relative ${className}`} {...dropProps}>
      {children}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 border border-dashed border-gray-900 bg-gray-50">
          <IoDocumentTextOutline className="text-lg text-gray-700" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-700">{hint}</span>
        </div>
      )}
    </div>
  );
}

const paneLabelClass = `block ${boxLabelClass}`;
const paneTextAreaClass =
  'block w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-mono focus:outline-none focus:border-gray-900 dark:focus:border-gray-400 placeholder-gray-400 dark:placeholder-gray-600 resize-y min-h-[120px]';

type TextInputPaneProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  accept?: string;
  /** Extra controls for the label row, left of the file button. */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * A labelled box for one body of text, with the file control in its label row
 * and a drop target over the box. Tools that ask for two texts at once — a
 * diff, a similarity score, a merge — build both sides out of this, so the two
 * halves stay identical and neither reads as the afterthought.
 */
export function TextInputPane({
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
  accept,
  actions,
  className = '',
}: TextInputPaneProps) {
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 mb-1">
        {/* The count reads as part of the label, not as another control. */}
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 min-w-0">
          <label className={paneLabelClass}>{label}</label>
          <span className={boxStatsClass}>{formatTextStats(value)}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
          <LoadFileButton onText={onChange} accept={accept} title={`Fill ${label} from a text file`} />
        </div>
      </div>
      <FileDropZone onText={onChange}>
        <textarea
          className={paneTextAreaClass}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          spellCheck={false}
        />
      </FileDropZone>
    </div>
  );
}

type FileTextAreaProps = {
  children: React.ReactNode;
  accept?: string;
  /** Passed to the wrapper, for boxes that have to fill their parent. */
  className?: string;
};

/**
 * The drop-in version, for a tool that already has its own textarea and its own
 * label: it wraps the box, adds the file control above it, and writes what it
 * loads into the box itself.
 *
 * It goes through the DOM rather than a callback because these tools hold their
 * text in a hundred different pieces of state. React tracks the value it last
 * rendered and swallows a plain assignment, so the write goes through the
 * prototype's own setter, which clears that tracking; the input event that
 * follows then reaches the tool's `onChange` exactly as typing would.
 */
export function FileTextArea({ children, accept, className = '' }: FileTextAreaProps) {
  const holder = useRef<HTMLDivElement>(null);

  const write = useCallback((text: string) => {
    const field = holder.current?.querySelector('textarea, input:not([type=file])');
    if (!(field instanceof HTMLTextAreaElement || field instanceof HTMLInputElement)) return;
    const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(field, text);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }, []);

  return (
    <div ref={holder} className={`relative flex flex-col w-full min-w-0 ${className}`}>
      {/* Sits on the label line the tool already has, above the box's top-right
          corner, so adding the control moves nothing on the page. */}
      <div className="absolute right-0 bottom-full mb-1 z-10">
        <LoadFileButton onText={write} accept={accept} />
      </div>
      <FileDropZone onText={write} className="flex-1 min-h-0">
        {children}
      </FileDropZone>
    </div>
  );
}
