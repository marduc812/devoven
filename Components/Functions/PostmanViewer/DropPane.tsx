'use client';

import React, { useCallback, useRef, useState } from 'react';
import { IoFolderOpenOutline } from 'react-icons/io5';

/**
 * One half of the input surface. The collection and the environment get the same
 * pane so neither reads as an afterthought — only the copy differs.
 */
const DropPane = ({
  label,
  hint,
  fileName,
  onFile,
  onClear,
  onError,
}: {
  label: string;
  hint: string;
  fileName: string;
  onFile: (name: string, content: string) => void;
  onClear: () => void;
  onError: (message: string) => void;
}) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const read = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onloadend = event => {
        if (event.target?.result) {
          onFile(file.name, event.target.result.toString());
        } else {
          onError(`Could not read "${file.name}".`);
        }
      };
      reader.onerror = () => onError(`Could not read "${file.name}".`);
      reader.readAsText(file);
    },
    [onFile, onError]
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      if (event.dataTransfer.files?.length) read(event.dataTransfer.files[0]);
    },
    [read]
  );

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    onClear();
  };

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</span>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".json,application/json,.postman_collection,.postman_environment"
        onChange={event => {
          if (event.target.files?.length) read(event.target.files[0]);
        }}
      />

      {fileName ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-gray-50 px-3 py-2 min-h-[104px]">
          <span className="flex items-center gap-2 min-w-0">
            <IoFolderOpenOutline className="text-base text-gray-500 flex-shrink-0" />
            <span className="font-mono text-sm text-gray-900 truncate">{fileName}</span>
          </span>
          <button
            type="button"
            onClick={clear}
            className="px-3 py-1.5 border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors duration-150 cursor-pointer text-[10px] font-bold uppercase tracking-widest"
          >
            Replace
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={event => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border border-dashed px-6 py-6 min-h-[104px] text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center gap-2 ${
            dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-900'
          }`}
        >
          <IoFolderOpenOutline className="text-2xl text-gray-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{hint}</p>
          <p className="text-[11px] text-gray-400">or click to choose a .json export</p>
        </div>
      )}
    </div>
  );
};

export default DropPane;
