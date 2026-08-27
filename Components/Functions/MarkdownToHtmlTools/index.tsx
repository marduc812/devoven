'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { markdownToHtml } from './logic';

export const MarkdownToHtml = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const from = params.get('from') || '';
      if (from) setFromValue(from);
    }
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(markdownToHtml(fromValue));
    } catch (e: unknown) {
      setToValue(e instanceof Error ? e.message : 'Conversion error');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Markdown to HTML"
      description="Convert Markdown syntax to HTML. Supports [1 headers 2], [1 **bold** 2], [1 *italic* 2], [1 `code` 2], [1 code blocks 2], [1 links 2], [1 images 2], [1 lists 2], [1 blockquotes 2], and [1 --- 2] horizontal rules."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Markdown"
      toTitle="HTML Output"
      backColor="cyan"
    />
  );
};
