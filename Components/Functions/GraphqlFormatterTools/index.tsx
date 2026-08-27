'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatGraphQL, extractGraphQLOperations, validateGraphQLBasic } from './logic';

export const GraphqlFormatter = () => {
  const [fromValue, setFromValue] = useState('');

  let toValue = '';
  if (fromValue.trim()) {
    try {
      const errors = validateGraphQLBasic(fromValue);
      if (errors.length > 0) {
        toValue = 'Validation errors:\n' + errors.map(e => `• ${e}`).join('\n');
      } else {
        const formatted = formatGraphQL(fromValue);
        const ops = extractGraphQLOperations(fromValue);
        toValue = formatted;
        if (ops.length > 0) {
          toValue += '\n\n// Operations: ' + ops.join(', ');
        }
      }
    } catch (e: unknown) {
      toValue = e instanceof Error ? e.message : 'Invalid input';
    }
  }

  return (
    <BasicConverter
      title="GraphQL Query Formatter"
      description="Format and prettify [1 GraphQL 2] queries. Validates basic syntax including balanced braces and parentheses."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="GraphQL Query"
      toTitle="Formatted Output"
      backColor="lime"
    />
  );
};
