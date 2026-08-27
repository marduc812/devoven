'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { detectStack } from './logic';

export const StackDetector = () => {
  const [fromValue, setFromValue] = useState('');

  const toValue = fromValue.trim()
    ? detectStack(fromValue).formatted
    : '';

  return (
    <BasicConverter
      title="Tech Stack Detector"
      description="Paste a [1 package.json 2], [1 requirements.txt 2], [1 go.mod 2], or [1 Cargo.toml 2] file to detect frameworks, libraries, and tools — categorized by frontend, backend, database, testing, build, and deployment."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Paste package.json / requirements.txt / go.mod / Cargo.toml"
      toTitle="Detected Tech Stack"
      backColor="lime"
    />
  );
};
