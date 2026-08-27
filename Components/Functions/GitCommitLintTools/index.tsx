'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { lintCommit } from './logic';

export const GitCommitLinter = () => {
  const [fromValue, setFromValue] = useState('');

  let toValue = '';
  if (fromValue.trim()) {
    const result = lintCommit(fromValue);
    toValue = result.formatted;
  }

  return (
    <BasicConverter
      title="Git Commit Message Linter"
      description="Lint a [1 git commit message 2] against Conventional Commits spec. Checks type, scope, subject length, imperative mood, and breaking change markers."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Commit Message"
      toTitle="Lint Report"
      backColor="lime"
    />
  );
};
