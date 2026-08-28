'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { generateGraphqlSchema } from './logic';

export const GraphqlSchemaBuilder = () => {
  const [fromValue, setFromValue] = useState('');

  const toValue = fromValue.trim() ? generateGraphqlSchema(fromValue) : '';

  return (
    <BasicConverter
      title="GraphQL Schema Builder"
      description="Paste a [1 JSON example object 2] to generate a GraphQL type definition with correct scalar types ([1 String 2], [1 Int 2], [1 Float 2], [1 Boolean 2], [1 ID 2]). Nested objects become separate types."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Example"
      toTitle="GraphQL Schema"
      backColor="lime"
    />
  );
};
