'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { generateChangelog } from './logic';

export const ChangelogGenerator = () => {
  const [fromValue, setFromValue] = useState('');

  const toValue = fromValue.trim()
    ? generateChangelog(fromValue).markdown
    : '';

  return (
    <BasicConverter
      title="Changelog Generator"
      description="Paste [1 git commit messages 2] (one per line) and get a formatted [1 CHANGELOG.md 2] section. Supports conventional commits — groups by type (feat, fix, docs, chore…) and suggests a version bump."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Commit Messages (one per line)"
      toTitle="CHANGELOG.md Section"
      backColor="lime"
    />
  );
};
