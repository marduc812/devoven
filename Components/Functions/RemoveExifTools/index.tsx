'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import MediaConverter from '@/Components/MainView/MainPanel/MediaConverter';
import { MediaResult } from '@/types';
import { ResultTable, SectionTitle, StatusBadge } from '@/Components/MainView/MainPanel/ResultUI';
import { useShareLink } from '@/Components/Functions/ShareLink';
import { MAX_FILE_BYTES } from '@/Components/Functions/ExifTools/logic';
import {
  StripResult,
  describeStrip,
  formatBytes,
  mimeFor,
  stripMetadata,
  strippedName,
} from './logic';

const ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

interface Loaded {
  name: string;
  bytes: Uint8Array;
  size: number;
}

export const RemoveExif = () => {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [result, setResult] = useState<MediaResult | undefined>();
  const [report, setReport] = useState<StripResult | null>(null);
  const [error, setError] = useState('');
  const [keepColorProfile, setKeepColorProfile] = useState(false);

  const sourceUrlRef = useRef('');
  const resultUrlRef = useRef('');

  const revokeSource = () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = '';
  };
  const revokeResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = '';
  };

  useEffect(() => () => { revokeSource(); revokeResult(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (params.get('icc') === 'keep') setKeepColorProfile(true);
  }, []);

  // A file cannot be seeded from a URL, but the option can, so a shared link
  // still opens the tool configured the way it was copied.
  useShareLink({ icc: keepColorProfile ? 'keep' : 'strip' });

  const openFile = async (file: File) => {
    setError('');
    setResult(undefined);
    setReport(null);
    revokeResult();

    if (file.size > MAX_FILE_BYTES) {
      setLoaded(null);
      revokeSource();
      setSourceUrl('');
      setError(`"${file.name}" is ${formatBytes(file.size)}. The limit is 100 MB.`);
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      revokeSource();
      const url = URL.createObjectURL(file);
      sourceUrlRef.current = url;
      setSourceUrl(url);
      setLoaded({ name: file.name, bytes, size: file.size });
    } catch {
      setLoaded(null);
      revokeSource();
      setSourceUrl('');
      setError('Could not read that file.');
    }
  };

  const clearAll = () => {
    revokeSource();
    revokeResult();
    setLoaded(null);
    setSourceUrl('');
    setResult(undefined);
    setReport(null);
    setError('');
  };

  const run = useCallback(() => {
    if (!loaded) return;
    try {
      const stripped = stripMetadata(loaded.bytes, { keepColorProfile });

      revokeResult();
      // Copy out of the source buffer: a Blob keeps whatever it is handed.
      const blob = new Blob([stripped.bytes.slice()], { type: mimeFor[stripped.format] });
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;

      setError('');
      setReport(stripped);
      setResult({
        url,
        fileName: strippedName(loaded.name, stripped.format),
        meta: `${formatBytes(stripped.bytes.length)} · ${describeStrip(stripped)}`,
      });
    } catch (err) {
      revokeResult();
      setResult(undefined);
      setReport(null);
      setError(err instanceof Error ? err.message : 'Could not read this image.');
    }
  }, [loaded, keepColorProfile]);

  useEffect(() => { run(); }, [run]);

  const source = loaded
    ? {
        url: sourceUrl,
        name: loaded.name,
        meta: `${formatBytes(loaded.size)}${report ? ` · ${report.format}` : ''}`,
      }
    : undefined;

  const outputVisual = report ? (
    <div className="flex flex-col gap-3">
      {report.removed.length === 0 ? (
        <div className="border border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-3">
          <StatusBadge tone="pass">already clean</StatusBadge>
          <p className="text-sm text-gray-600">
            This {report.format} carried no EXIF, no XMP and no comments. The file below is a
            byte-for-byte copy of what you dropped.
          </p>
        </div>
      ) : (
        <>
          <SectionTitle note={`${formatBytes(report.bytesRemoved)} of ${formatBytes(report.originalBytes)}`}>
            Removed
          </SectionTitle>
          <ResultTable
            headers={['Block', 'What it held', 'Size']}
            align={['left', 'left', 'right']}
            rows={report.removed.map((item) => [
              <span key="l" className="text-gray-900 font-bold whitespace-nowrap">{item.label}</span>,
              <span key="w" className="font-sans text-gray-600">{item.what}</span>,
              <span key="b" className="text-gray-500">{formatBytes(item.bytes)}</span>,
            ])}
          />
        </>
      )}
    </div>
  ) : undefined;

  return (
    <MediaConverter
      backColor="fuchsia"
      title="Remove EXIF"
      description="Strip the metadata out of a photo before you post it — the [1 GPS 2] coordinates, the camera and lens, the timestamps, the editing history and the embedded thumbnail. The pixels are copied through untouched, so nothing is re-compressed and the picture does not lose quality. Works on [1 JPEG 2], [1 PNG 2] and [1 WebP 2], in your browser."
      accept={ACCEPT}
      inputMedium="image"
      outputMedium="image"
      hint="Drop a JPEG, PNG or WebP, or click to browse"
      onFiles={(files) => openFile(files[0])}
      onClear={clearAll}
      source={source}
      result={result}
      error={error}
      outputVisual={outputVisual}
      extraElements={
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              className="accent-gray-900"
              checked={keepColorProfile}
              onChange={(e) => setKeepColorProfile(e.target.checked)}
            />
            <span className="text-sm text-gray-700">
              Keep the ICC colour profile
            </span>
          </label>
          <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
            A colour profile says nothing about you, but it is often the largest thing in the
            file. Drop it and the image gets smaller; keep it and the colours stay exactly as the
            camera or the editor intended. Everything else identifying goes either way.
          </p>
        </div>
      }
    />
  );
};
