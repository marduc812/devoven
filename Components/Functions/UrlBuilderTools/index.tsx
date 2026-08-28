'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseUrlInput } from './logic';

const EXAMPLE = `protocol: https
host: api.example.com
port: 8080
path: /v1/users
param: search=hello world
param: page=1
hash: results`;

export function UrlBuilderTools() {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = params.get('from') ?? '';
    if (from) setFromValue(from);
    else setFromValue(EXAMPLE);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) { setToValue(''); return; }
    try {
      setToValue(parseUrlInput(fromValue));
    } catch (e) {
      setToValue(`Error: ${(e as Error).message}`);
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="URL Builder"
      description="Build a URL from its components. Enter one property per line: [1 protocol, host, port, path, param, hash 2]. Multiple param lines are supported."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="URL Components"
      toTitle="Built URL"
      backColor="sky"
    />
  );
}
