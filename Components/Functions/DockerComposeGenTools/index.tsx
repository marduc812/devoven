'use client';

import { useState, useEffect } from 'react';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { generateCompose } from './logic';

export function DockerComposeGen() {
  const [fromValue, setFromValue] = useState('postgres 15 with persistent volume, port 5432, password secret');
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
      const result = generateCompose(fromValue);
      const parts: string[] = [];
      if (result.warnings.length > 0) {
        parts.push('# Warnings:');
        result.warnings.forEach(w => parts.push('# ' + w));
        parts.push('');
      }
      parts.push(result.yaml);
      setToValue(parts.join('\n'));
    } catch (e) {
      setToValue('# Error: ' + (e instanceof Error ? e.message : 'Invalid input'));
    }
  }, [fromValue]);

  return (
    <BasicConverter
      title="Docker Compose Generator"
      description="Describe services in plain English and generate a [1 docker-compose.yml 2] snippet. Supports [1 postgres 2], [1 mysql 2], [1 redis 2], [1 nginx 2], [1 mongodb 2], [1 rabbitmq 2], [1 elasticsearch 2], [1 kafka 2] and more. Separate multiple services with commas."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="Service Description"
      toTitle="docker-compose.yml"
      backColor="lime"
    />
  );
}
