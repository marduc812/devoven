'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { validateEmail, formatEmailInfo } from './logic';

export const EmailValidator = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setInput(from);
  }, []);

  useEffect(() => {
    if (!input.trim()) { setOutput(''); return; }
    const info = validateEmail(input);
    setOutput(formatEmailInfo(info));
  }, [input]);

  return (
    <BasicConverter
      title="Email Address Validator"
      description="Validate email address format and extract components. Detects [1 disposable 2] email providers."
      fromValue={input}
      toValue={output}
      setFromValue={setInput}
      fromTitle="Email Address"
      toTitle="Validation Result"
      backColor="lime"
    />
  );
};
