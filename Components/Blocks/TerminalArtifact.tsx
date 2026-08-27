'use client';

import React, { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { OperationOutput } from '@/lib/blocks/types';

type TerminalArtifactProps = {
  kind: OperationOutput;
  value: string;
  size: 'preview' | 'full';
  errorCorrection?: string;
};

function Barcode({ value, size }: { value: string; size: 'preview' | 'full' }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const node = svgRef.current;
    if (!node) return;

    // jsbarcode reaches for the DOM, so it is only loaded once the block renders.
    import('jsbarcode')
      .then(({ default: JsBarcode }) => {
        if (cancelled || !svgRef.current) return;
        try {
          JsBarcode(svgRef.current, value, {
            format: 'CODE128',
            width: size === 'full' ? 2 : 1,
            height: size === 'full' ? 80 : 36,
            displayValue: size === 'full',
            margin: 8,
            background: '#ffffff',
          });
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });

    return () => { cancelled = true; };
  }, [value, size]);

  if (error) return <span className="text-xs text-red-600 font-medium">Barcode error: {error}</span>;
  return <svg ref={svgRef} className="max-w-full" />;
}

export default function TerminalArtifact({ kind, value, size, errorCorrection }: TerminalArtifactProps) {
  if (!value) return null;

  if (kind === 'qr') {
    const level = (['L', 'M', 'Q', 'H'].includes(errorCorrection ?? '') ? errorCorrection : 'M') as 'L' | 'M' | 'Q' | 'H';
    return (
      <QRCodeSVG
        value={value}
        level={level}
        size={size === 'full' ? 220 : 64}
        marginSize={2}
        bgColor="#ffffff"
        fgColor="#111827"
      />
    );
  }

  if (kind === 'barcode') return <Barcode value={value} size={size} />;

  return null;
}
