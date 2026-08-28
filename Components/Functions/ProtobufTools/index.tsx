'use client';

import React, { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import { decodeProto, jsonToProtoSkeleton } from './logic';

export const ProtobufConverter = () => {
  const [fromValue, setFromValue] = useState('');
  const [mode, setMode] = useState<'decode-hex' | 'decode-base64' | 'json-to-proto'>('decode-hex');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    try {
      if (mode === 'decode-hex') {
        toValue = decodeProto(fromValue, 'hex');
      } else if (mode === 'decode-base64') {
        toValue = decodeProto(fromValue, 'base64');
      } else {
        toValue = jsonToProtoSkeleton(fromValue);
      }
    } catch (e) {
      toValue = e instanceof Error ? e.message : 'Error';
    }
  }

  const fromTitle = mode === 'json-to-proto' ? 'JSON Example' : 'Protobuf Bytes';
  const toTitle = mode === 'json-to-proto' ? '.proto Skeleton' : 'Decoded Fields';

  const extraElements = (
    <select
      className="border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:border-gray-900"
      value={mode}
      onChange={e => setMode(e.target.value as typeof mode)}
    >
      <option value="decode-hex">Decode from Hex</option>
      <option value="decode-base64">Decode from Base64</option>
      <option value="json-to-proto">JSON to .proto Skeleton</option>
    </select>
  );

  return (
    <AdvancedConverter
      title="Protobuf Decoder"
      description="Decode a [1 hex 2] or [1 base64 2] protobuf binary blob without a schema. Shows field number, wire type, and interpreted values for each field. Also generates a [1 .proto 2] skeleton from a JSON example."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle={fromTitle}
      toTitle={toTitle}
      extraElements={extraElements}
      backColor="cyan"
    />
  );
};

export const ProtobufSchemaBuilder = () => {
  const [fromValue, setFromValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    if (from) setFromValue(from);
  }, []);

  let toValue = '';
  if (fromValue.trim()) {
    try {
      toValue = jsonToProtoSkeleton(fromValue);
    } catch (e) {
      toValue = e instanceof Error ? e.message : 'Error generating schema';
    }
  }

  return (
    <BasicConverter
      title="Protobuf Schema Builder"
      description="Paste a [1 JSON 2] example object and get a [1 .proto 2] v3 schema definition. Field types are inferred: string, int64, double, bool, repeated, and nested messages. Field numbers start from 1, camelCase keys are converted to snake_case."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="JSON Example"
      toTitle=".proto Schema"
      backColor="lime"
    />
  );
};
