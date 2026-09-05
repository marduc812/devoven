'use client';
import { useState, useEffect } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { processMatrixOp, MatrixOp } from './logic';

export function MatrixCalc() {
  const [matrixA, setMatrixA] = useState('1 2\n3 4');
  const [matrixB, setMatrixB] = useState('5 6\n7 8');
  const [op, setOp] = useState<MatrixOp>('add');
  const [output, setOutput] = useState('');

  useEffect(() => {
    if (!matrixA.trim()) { setOutput(''); return; }
    try {
      setOutput(processMatrixOp(matrixA, matrixB, op));
    } catch (e) {
      setOutput('Error: ' + (e as Error).message);
    }
  }, [matrixA, matrixB, op]);

  const opOptions: Array<{ value: MatrixOp; label: string }> = [
    { value: 'add', label: 'A + B (Add)' },
    { value: 'subtract', label: 'A - B (Subtract)' },
    { value: 'multiply', label: 'A × B (Multiply)' },
    { value: 'transposeA', label: 'Transpose A' },
    { value: 'determinantA', label: 'Determinant of A' },
    { value: 'inverseA', label: 'Inverse of A' },
  ];

  const extra = (
    <div className="flex flex-col gap-3 w-full items-center">
      <div className="flex flex-col gap-1 w-full max-w-md">
        <label className="text-xs text-gray-400">Operation</label>
        <select
          value={op}
          onChange={e => setOp(e.target.value as MatrixOp)}
          className="bg-white text-gray-900 border border-gray-200 px-3 py-1.5 text-sm focus:outline-none"
        >
          {opOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1 w-full max-w-md">
        <label className="text-xs text-gray-400">Matrix B (space-separated, one row per line)</label>
        <FileTextArea>
          <textarea
            value={matrixB}
            onChange={e => setMatrixB(e.target.value)}
            rows={4}
            className="bg-white text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:outline-none resize-none font-mono text-sm"
            placeholder="5 6&#10;7 8"
          />
        </FileTextArea>
      </div>
    </div>
  );

  return (
    <AdvancedConverter
      title="Matrix Calculator"
      description="Enter Matrix A and Matrix B with space-separated values, one row per line. Example: [1 1 2\n3 4 2]. Supports add, subtract, multiply, transpose, determinant, and inverse."
      fromValue={matrixA}
      toValue={output}
      setFromValue={setMatrixA}
      fromTitle="Matrix A (space-separated, one row per line)"
      toTitle="Result"
      backColor="lime"
      extraElements={extra}
    />
  );
}
