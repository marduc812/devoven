'use client';

import React, { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { graphqlToTypeScript } from './logic';

export const GraphqlToTs = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = graphqlToTypeScript(fromValue);
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  return (
    <BasicConverter
      title="GraphQL Schema to TypeScript"
      description="Convert [1 GraphQL 2] schema definitions to TypeScript interfaces and types. Supports type, input, interface, enum, scalar, and union."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="GraphQL Schema"
      toTitle="TypeScript Output"
      backColor="cyan"
    />
  );
};
