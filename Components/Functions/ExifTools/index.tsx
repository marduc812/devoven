'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  CopyButton,
  ErrorNote,
  HeroResult,
  ResultTable,
  SectionTitle,
  StatTile,
  StatusBadge,
  type BadgeTone,
} from '@/Components/MainView/MainPanel/ResultUI';
import { formatFileSize } from '@/Components/Functions/ImageTools/logic';
import {
  parseImageMetadata,
  toDms,
  MAX_FILE_BYTES,
  type ExifResult,
  type Finding,
  type Severity,
} from './logic';

const severityTone: Record<Severity, BadgeTone> = {
  high: 'fail',
  medium: 'warn',
  low: 'info',
  info: 'neutral',
};

const severityLabel: Record<Severity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Clean',
};

/** Worst severity present decides the headline tone. */
const overallTone = (findings: Finding[]): BadgeTone => {
  if (findings.some(f => f.severity === 'high')) return 'fail';
  if (findings.some(f => f.severity === 'medium')) return 'warn';
  if (findings.some(f => f.severity === 'low')) return 'info';
  return 'pass';
};

const headline = (findings: Finding[]): string => {
  const real = findings.filter(f => f.severity !== 'info');
  if (!real.length) return 'Nothing identifying found';
  return `${real.length} ${real.length === 1 ? 'finding' : 'findings'}`;
};

/** Everything except the thumbnail bytes, which are not JSON-friendly. */
const toJson = (result: ExifResult): string =>
  JSON.stringify(
    {
      ...result,
      thumbnail: result.thumbnail
        ? {
            bytes: `${result.thumbnail.bytes.length} bytes`,
            width: result.thumbnail.width,
            height: result.thumbnail.height,
          }
        : undefined,
    },
    null,
    2
  );

export const ExifViewer = () => {
  const [result, setResult] = useState<ExifResult | null>(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URLs are the only browser resource this tool holds. One effect each,
  // so replacing the preview can never revoke a thumbnail that is still shown.
  useEffect(
    () => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); },
    [previewUrl]
  );
  useEffect(
    () => () => { if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl); },
    [thumbnailUrl]
  );

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setResult(null);

    if (file.size > MAX_FILE_BYTES) {
      setError(`"${file.name}" is ${formatFileSize(file.size)}. The limit is 100 MB.`);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseImageMetadata(buffer, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      setPreviewUrl(URL.createObjectURL(file));
      setThumbnailUrl(
        parsed.thumbnail
          // Copy out of the file buffer: a Blob keeps whatever it is handed.
          ? URL.createObjectURL(new Blob([parsed.thumbnail.bytes.slice()], { type: 'image/jpeg' }))
          : ''
      );

      setResult(parsed);
    } catch {
      setError('Could not read that file.');
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const gps = result?.gps;
  const mapsUrl = gps
    ? `https://www.google.com/maps/search/?api=1&query=${gps.lat},${gps.lon}`
    : '';

  return (
    <Panel
      title="EXIF Viewer"
      description="Read the hidden metadata in a photo — camera, lens, timestamps, editing software and GPS coordinates — and see what it gives away about you. Supports [1 JPEG 2], [1 PNG 2], [1 WebP 2] and [1 TIFF 2]. The file is read in your browser and never uploaded."
      backColor="fuchsia"
      extraElements={
        <div className="flex flex-col gap-6">
          {/* Input */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`border border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
              dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-900'
            }`}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-gray-500">
              Drop an image here
            </p>
            <p className="text-xs text-gray-400 mt-1">or click to choose a file — nothing leaves your browser</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          {result && (
            <>
              {/* Headline */}
              <HeroResult
                label="Privacy report"
                value={headline(result.findings)}
                tone={overallTone(result.findings)}
                note={`${result.file.name} — ${result.format}${
                  result.byteOrder ? `, ${result.byteOrder}-endian` : ''
                }`}
                copyText={toJson(result)}
              />

              {/* Findings */}
              <div className="flex flex-col gap-2">
                <SectionTitle note={`${result.findings.length} total`}>What this file reveals</SectionTitle>
                {result.findings.map((finding, i) => (
                  <div key={i} className="border border-gray-200 px-3 py-2">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StatusBadge tone={severityTone[finding.severity]}>
                        {severityLabel[finding.severity]}
                      </StatusBadge>
                      <span className="text-sm font-bold text-gray-900">{finding.title}</span>
                      <span className="text-[10px] font-mono text-gray-400">{finding.source}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{finding.detail}</p>
                  </div>
                ))}
              </div>

              {result.warnings.length > 0 && (
                <div className="flex flex-col gap-1">
                  <SectionTitle>Parser notes</SectionTitle>
                  {result.warnings.map((warning, i) => (
                    <ErrorNote key={i}>{warning}</ErrorNote>
                  ))}
                </div>
              )}

              {/* File facts */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <StatTile label="Format" value={result.format} />
                <StatTile
                  label="Dimensions"
                  value={
                    result.file.width && result.file.height
                      ? `${result.file.width} × ${result.file.height}`
                      : '—'
                  }
                />
                <StatTile label="File size" value={formatFileSize(result.file.size)} />
                <StatTile
                  label="Tags found"
                  value={result.sections.reduce((n, s) => n + s.tags.length, 0)}
                />
              </div>

              {/* Preview and embedded thumbnail, side by side so a mismatch is visible */}
              <div className="flex flex-wrap gap-4">
                {previewUrl && (
                  <figure className="flex flex-col gap-1">
                    <figcaption className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Image
                    </figcaption>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previewUrl} alt="Selected file" className="max-h-56 border border-gray-200 object-contain" />
                  </figure>
                )}
                {thumbnailUrl && (
                  <figure className="flex flex-col gap-1">
                    <figcaption className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Embedded thumbnail
                      {result.thumbnail?.width && result.thumbnail.height
                        ? ` (${result.thumbnail.width} × ${result.thumbnail.height})`
                        : ''}
                    </figcaption>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailUrl} alt="Thumbnail stored inside the file" className="max-h-56 border border-gray-200 object-contain" />
                  </figure>
                )}
              </div>

              {/* Location */}
              {gps && (
                <div className="flex flex-col gap-2">
                  <SectionTitle note="opens Google Maps in a new tab">Location</SectionTitle>
                  <div className="border border-rose-200 bg-rose-50 px-3 py-3 flex flex-col gap-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <StatTile label="Decimal" value={`${gps.lat.toFixed(6)}, ${gps.lon.toFixed(6)}`} />
                      <StatTile
                        label="Degrees / minutes / seconds"
                        value={`${toDms(gps.lat, 'lat')}, ${toDms(gps.lon, 'lon')}`}
                      />
                      {gps.altitude !== undefined && (
                        <StatTile label="Altitude" value={`${gps.altitude.toFixed(1)} m`} />
                      )}
                      {gps.timestamp && <StatTile label="GPS time" value={gps.timestamp} />}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
                      >
                        Open in Google Maps ↗
                      </a>
                      <CopyButton text={`${gps.lat},${gps.lon}`} label="coordinates" />
                      <span className="text-[11px] text-gray-500">
                        The coordinates only leave your browser if you follow this link.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Every tag, by directory */}
              {result.sections.map(section => (
                <div key={section.name} className="flex flex-col gap-2">
                  <SectionTitle note={`${section.tags.length} tags`}>{section.name}</SectionTitle>
                  <ResultTable
                    headers={['Tag', 'ID', 'Type', 'Value']}
                    rows={section.tags.map(t => [
                      t.name,
                      t.id ? `0x${t.id.toString(16).toUpperCase().padStart(4, '0')}` : '—',
                      t.type,
                      <span key="v" className="break-all">
                        {t.formatted}
                        {t.formatted !== t.raw && (
                          <span className="text-gray-400"> · raw: {t.raw}</span>
                        )}
                      </span>,
                    ])}
                  />
                </div>
              ))}

              {result.sections.length === 0 && (
                <p className="text-sm text-gray-500">
                  No metadata directories were found in this file.
                </p>
              )}
            </>
          )}
        </div>
      }
    />
  );
};
