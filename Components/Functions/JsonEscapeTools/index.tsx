'use client'

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';

export const JsonEscape = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from != '') {
      setFromValue(from);
    }
  }, []);

  useEffect(() => {
    if (fromValue != '') {
      try {
        const escaped = JSON.stringify(fromValue).slice(1, -1);
        setToValue(escaped);
      } catch {
        setToValue('Invalid input');
      }
    } else {
      setToValue('');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="JSON Escape"
      description="Escape a raw string for safe use inside a JSON string value. Handles quotes, backslashes, newlines, tabs, and unicode control characters. For example, [1 Hello\nWorld 2] becomes [1 Hello\\nWorld 2]."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Raw String'
      toTitle='Escaped String'
      backColor='cyan'
    />
  );
};

export const JsonUnescape = () => {
  const [fromValue, setFromValue] = useState<string>('');
  const [toValue, setToValue] = useState<string>('');

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from != '') {
      setFromValue(from);
    }
  }, []);

  useEffect(() => {
    if (fromValue != '') {
      try {
        const unescaped = JSON.parse('"' + fromValue + '"');
        setToValue(unescaped);
      } catch {
        setToValue('Invalid escaped string');
      }
    } else {
      setToValue('');
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="JSON Unescape"
      description='Unescape a JSON-escaped string back to its original form. Converts escape sequences like [1 \\n 2], [1 \\t 2], and [1 \\" 2] back to their literal characters.'
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle='Escaped String'
      toTitle='Raw String'
      backColor='cyan'
    />
  );
};
