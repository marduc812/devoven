'use client';

import React, { useEffect, useState } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { formatTomlValidation, getTomlStats } from './logic';

export const TomlValidator = () => {
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const from = searchParams.get('from') ?? '';
    if (from) setFromValue(from);
  }, []);

  useEffect(() => {
    if (!fromValue.trim()) {
      setToValue('');
      setIsValid(null);
      return;
    }

    import('smol-toml').then(toml => {
      try {
        const parsed = toml.parse(fromValue);
        const stats = getTomlStats(fromValue);
        setToValue(`✓ Valid TOML\n${stats}\n\n${formatTomlValidation(parsed)}`);
        setIsValid(true);
      } catch (e: unknown) {
        setToValue(`✗ Invalid TOML\n${e instanceof Error ? e.message : 'Parse error'}`);
        setIsValid(false);
      }
    });
  }, [fromValue]);

  const statusBadge = isValid !== null ? (
    <span className={`px-3 py-1.5 text-xs font-medium border ${
      isValid
        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
        : 'bg-red-500/20 text-red-300 border-red-400/30'
    }`}>
      {isValid ? '✓ Valid' : '✗ Invalid'}
    </span>
  ) : null;

  return (
    <AdvancedConverter
      title="TOML Validator"
      description="Validate a [1 TOML 2] document and preview the parsed structure as JSON."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="TOML Input"
      toTitle="Validation Result"
      backColor="cyan"
      extraElements={statusBadge ?? <span />}
    />
  );
};
