'use client';

import React, { useEffect, useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { formatSql } from './logic';

export const SqlFormatter = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') || '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      return;
    }
    try {
      setToValue(formatSql(fromValue));
    } catch (e) {
      setToValue(e instanceof Error ? e.message : 'Error formatting SQL');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="SQL Formatter"
      description="Format and pretty-print SQL queries. Keywords are capitalized and queries are indented for readability. Paste any SQL like [1 select * from users where id=1 2] to format it."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="SQL Query"
      toTitle="Formatted SQL"
      backColor="cyan"
    />
  );
};
