'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { parseAndValidate, formatValidationResult } from './logic';

const EXAMPLE_ENV = `# Application Configuration
NODE_ENV=development
PORT=3000
APP_NAME=myapp

# Database
DATABASE_URL=postgresql://admin:secret@localhost:5432/mydb
DB_PASS=secret

# API Keys (examples with issues for demo)
API_KEY=abc
SECRET_KEY=changeme
STRIPE_TOKEN=sk_test_longvalidtoken123456789

# Misc
LOG_LEVEL=debug
FEATURE_FLAG=true
VALUE WITH SPACES=bad
`;

export function EnvValidator() {
  const [fromValue, setFromValue] = useState(EXAMPLE_ENV);
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : ''
    );
    const from = params.get('from');
    if (from) setFromValue(decodeURIComponent(from));
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      return;
    }
    try {
      const result = parseAndValidate(fromValue);
      setToValue(formatValidationResult(result));
    } catch (e) {
      setToValue('Error: ' + (e instanceof Error ? e.message : 'Invalid input'));
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Environment Variable Validator"
      description="Validate [1 .env 2] file contents — checks for syntax errors, spaces in keys, missing quotes, duplicate keys, and exposed [1 secrets 2] patterns (API_KEY, SECRET, PASSWORD with weak values)."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle=".env File Contents"
      toTitle="Validation Report"
      backColor="lime"
    />
  );
}
