'use client';

import { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { inspectText, formatInspection, detectIssues } from './logic';

export const EncodingInspector = () => {
  const [fromValue, setFromValue] = useState('');

  const issues = fromValue ? detectIssues(fromValue) : [];
  const chars = inspectText(fromValue);
  const inspection = formatInspection(chars);

  const issuePrefix =
    issues.length > 0
      ? `⚠ Issues detected:\n${issues.map(i => `  • ${i}`).join('\n')}\n\n`
      : '';

  const toValue = fromValue ? issuePrefix + inspection : '';

  return (
    <BasicConverter
      title="Encoding Inspector"
      description="Inspect text character by character. See [1 Unicode code points 2], categories, and detect encoding issues like [1 BOM 2], [1 null bytes 2], or [1 zero-width characters 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Input Text"
      toTitle="Character Inspection"
      backColor="lime"
    />
  );
};
