'use client';
import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseProductsInput, formatComparisonResult } from './logic';

export function UnitPriceComparator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const p = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = p.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    try {
      const products = parseProductsInput(input);
      setOutput(formatComparisonResult(products));
    } catch (e) {
      setOutput(`Error: ${(e as Error).message}`);
    }
  }, [input]);

  return (
    <BasicConverter
      title="Unit Price Comparator"
      description="Compare value across products. Enter [1 Name, Price, Quantity, Unit 2] — one product per line (2–5 products). Units: kg, g, oz, lb, L, mL, fl oz, count. Example: [1 Oats A, 2.99, 500, g 2]"
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Products (Name, Price, Quantity, Unit — one per line)"
      toTitle="Comparison Results (ranked cheapest first)"
      backColor="lime"
    />
  );
}
