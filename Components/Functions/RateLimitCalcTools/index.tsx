'use client';

import React, { useState } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { calculateRateLimit } from './logic';

export const RateLimitCalculator = () => {
  const [fromValue, setFromValue] = useState('');

  let toValue = '';
  if (fromValue.trim()) {
    const result = calculateRateLimit(fromValue);
    if (result) {
      toValue = result.formatted;
    } else {
      toValue = 'Could not parse rate. Try formats like:\n  1000/hour\n  100 per minute\n  50 req/s\n  10000 requests per day';
    }
  }

  return (
    <BasicConverter
      title="API Rate Limit Calculator"
      description="Enter a rate limit like [1 1000/hour 2] or [1 100 per minute 2] to calculate requests per second/minute/hour/day, safety margins, token bucket parameters, and retry-after timing."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Rate Limit (e.g. 1000/hour, 100 per minute, 50 req/s)"
      toTitle="Rate Limit Analysis"
      backColor="lime"
    />
  );
};
