'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { generateOpenApiSchema } from './logic';

export const OpenApiSchemaGenerator = () => {
  const [fromValue, setFromValue] = useState('');

  const toValue = fromValue.trim() ? generateOpenApiSchema(fromValue) : '';

  return (
    <BasicConverter
      title="OpenAPI Schema Generator"
      description="Paste a [1 JSON example object 2] to generate an OpenAPI 3.0 schema definition with inferred types, required fields, and nested object/array support."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Example"
      toTitle="OpenAPI Schema (JSON)"
      backColor="lime"
    />
  );
};
