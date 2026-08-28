'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { generateErdOutput } from './logic';

const EXAMPLE = `users(id, name, email, created_at)
orders(id, user_id, total, status, created_at)
order_items(id, order_id, product_id, quantity, price)
products(id, name, description, price, stock)`;

export function ErdTextGenerator() {
  const [fromValue, setFromValue] = useState(EXAMPLE);
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setFromValue(decodeURIComponent(from));
  }, []);

  useEffect(() => {
    setToValue(generateErdOutput(fromValue));
  }, [fromValue]);

  return (
    <BasicConverter
      title="ERD Text Generator"
      description="Describe tables with a simple syntax like [1 users(id, name, email) 2] to generate an ASCII ER diagram and [1 Mermaid erDiagram 2] code. Foreign keys are auto-detected from [1 _id 2] suffix columns."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Table Definitions"
      toTitle="ER Diagram (ASCII + Mermaid)"
      backColor="lime"
    />
  );
}
