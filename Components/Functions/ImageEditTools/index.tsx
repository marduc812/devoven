'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import MediaConverter from '@/Components/MainView/MainPanel/MediaConverter';
import { MediaResult } from '@/types';
import { useShareLink } from '@/Components/Functions/ShareLink';
import {
  Adjustments,
  FLIP_DEFAULT,
  FlipAxes,
  INVERT_DEFAULT,
  INVERT_MAX,
  MAX_IMAGE_BYTES,
  MAX_PERCENT,
  NEUTRAL,
  OUTPUT_QUALITY,
  OutputFormat,
  buildFilter,
  buildInvertFilter,
  describeAdjustments,
  describeFlip,
  describeInvert,
  editedName,
  flipTransform,
  formatBytes,
  isNeutral,
  mimeFor,
  outputFormatFor,
  parseAdjustments,
  parseFlipAxes,
  parseInvertAmount,
  serializeFlipAxes,
} from './logic';

const ACCEPT = 'image/*';

interface Loaded {
  name: string;
  size: number;
  format: OutputFormat;
  image: HTMLImageElement;
}

/** What a tool tells the shared renderer to do with the loaded pixels. */
type Draw = (ctx: CanvasRenderingContext2D, image: HTMLImageElement) => void;

/**
 * The parts every pixel-editing tool on this page shares: hold one decoded
 * image, redraw it whenever the options change, and hand `MediaConverter` a
 * source and a result. Each tool supplies only its own `draw`.
 *
 * Object URLs are owned here, one ref per side, each revoked before the next
 * one is published and again on unmount — the same shape the audio tools use.
 */
const useImageEditor = (suffix: string) => {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [result, setResult] = useState<MediaResult | undefined>();
  const [error, setError] = useState('');

  const sourceUrlRef = useRef('');
  const resultUrlRef = useRef('');
  // Dragging a slider fires renders faster than toBlob finishes them, so only
  // the newest one is allowed to publish its URL.
  const renderToken = useRef(0);

  const revokeSource = () => {
    if (sourceUrlRef.current) URL.revokeObjectURL(sourceUrlRef.current);
    sourceUrlRef.current = '';
  };
  const revokeResult = () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = '';
  };

  useEffect(() => () => { revokeSource(); revokeResult(); }, []);

  const openFile = async (file: File) => {
    setError('');
    setResult(undefined);
    revokeResult();
    renderToken.current += 1;

    if (!file.type.startsWith('image/')) {
      setLoaded(null);
      revokeSource();
      setSourceUrl('');
      setError(`"${file.name}" is not an image.`);
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setLoaded(null);
      revokeSource();
      setSourceUrl('');
      setError(
        `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_IMAGE_BYTES)}, ` +
          'because editing the pixels means decoding the whole picture into memory.',
      );
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('decode failed'));
        image.src = url;
      });
    } catch {
      URL.revokeObjectURL(url);
      setLoaded(null);
      revokeSource();
      setSourceUrl('');
      setError(`Could not decode "${file.name}". Your browser does not read this image format.`);
      return;
    }

    revokeSource();
    sourceUrlRef.current = url;
    setSourceUrl(url);
    setLoaded({
      name: file.name,
      size: file.size,
      format: outputFormatFor(file.type),
      image,
    });
  };

  const clearAll = () => {
    renderToken.current += 1;
    revokeSource();
    revokeResult();
    setLoaded(null);
    setSourceUrl('');
    setResult(undefined);
    setError('');
  };

  const render = useCallback((draw: Draw, describe: string) => {
    if (!loaded) return;
    const token = ++renderToken.current;
    const { image, format } = loaded;

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('This browser did not give us a 2D canvas, so the image cannot be edited here.');
      return;
    }

    // JPEG has no alpha channel: whatever the canvas leaves transparent is
    // written as black unless something opaque is under it.
    if (format === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    draw(ctx, image);

    canvas.toBlob(
      (blob) => {
        if (token !== renderToken.current) return;
        if (!blob) {
          setError('The edited image could not be encoded.');
          return;
        }
        revokeResult();
        const url = URL.createObjectURL(blob);
        resultUrlRef.current = url;
        setError('');
        setResult({
          url,
          fileName: editedName(loaded.name, suffix, format),
          meta: `${image.naturalWidth} × ${image.naturalHeight} · ${formatBytes(blob.size)} · ${describe}`,
        });
      },
      mimeFor[format],
      OUTPUT_QUALITY,
    );
  }, [loaded, suffix]);

  const source = loaded
    ? {
        url: sourceUrl,
        name: loaded.name,
        meta: `${loaded.image.naturalWidth} × ${loaded.image.naturalHeight} · ${formatBytes(loaded.size)}`,
      }
    : undefined;

  return { loaded, source, result, error, openFile, clearAll, render };
};

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const Slider = ({
  label,
  value,
  onChange,
  min = 0,
  max = MAX_PERCENT,
  neutral,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  neutral?: number;
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center justify-between gap-3">
      <span className={labelClass}>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-400 font-mono">{value}%</span>
        {neutral !== undefined && value !== neutral && (
          <button
            type="button"
            onClick={() => onChange(neutral)}
            className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-gray-900"
    />
  </div>
);

const privacyNote = (
  <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
    The edit is redrawn on a canvas in this tab and re-encoded in the format you dropped —
    JPEG stays JPEG, PNG stays PNG, and anything else comes back as PNG. Nothing is uploaded.
  </p>
);

// ─── Image Adjustments ────────────────────────────────────────────────────────

export const ImageAdjust = () => {
  const [values, setValues] = useState<Adjustments>(NEUTRAL);
  const { loaded, source, result, error, openFile, clearAll, render } = useImageEditor('adjusted');

  useEffect(() => {
    setValues(parseAdjustments(new URLSearchParams(window.location.search)));
  }, []);

  useShareLink({
    brightness: values.brightness,
    contrast: values.contrast,
    saturation: values.saturation,
  });

  useEffect(() => {
    if (!loaded) return;
    const filter = buildFilter(values);
    render((ctx, image) => {
      ctx.filter = filter || 'none';
      ctx.drawImage(image, 0, 0);
    }, describeAdjustments(values));
  }, [loaded, values, render]);

  const set = (key: keyof Adjustments) => (value: number) =>
    setValues((current) => ({ ...current, [key]: value }));

  return (
    <MediaConverter
      backColor="fuchsia"
      title="Image Adjustments"
      description="Turn the brightness, contrast and saturation of a photo up or down and watch the result change as you drag. [1 100% 2] is the picture you dropped; below that the effect is dialled back, above it, pushed. Runs on a canvas in your browser."
      accept={ACCEPT}
      inputMedium="image"
      outputMedium="image"
      hint="Drop an image, or click to browse"
      onFiles={(files) => openFile(files[0])}
      onClear={clearAll}
      source={source}
      result={result}
      error={error}
      extraElements={
        <div className="flex flex-col gap-4 max-w-md">
          <Slider label="Brightness" value={values.brightness} onChange={set('brightness')} neutral={100} />
          <Slider label="Contrast" value={values.contrast} onChange={set('contrast')} neutral={100} />
          <Slider label="Saturation" value={values.saturation} onChange={set('saturation')} neutral={100} />
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setValues(NEUTRAL)}
              disabled={isNeutral(values)}
              className="py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Reset all
            </button>
            <span className="text-xs text-gray-400">
              Saturation at 0% is a greyscale conversion.
            </span>
          </div>
          {privacyNote}
        </div>
      }
    />
  );
};

// ─── Invert Colors ────────────────────────────────────────────────────────────

export const InvertImage = () => {
  const [amount, setAmount] = useState(INVERT_DEFAULT);
  const { loaded, source, result, error, openFile, clearAll, render } = useImageEditor('inverted');

  useEffect(() => {
    setAmount(parseInvertAmount(new URLSearchParams(window.location.search)));
  }, []);

  useShareLink({ amount });

  useEffect(() => {
    if (!loaded) return;
    const filter = buildInvertFilter(amount);
    render((ctx, image) => {
      ctx.filter = filter || 'none';
      ctx.drawImage(image, 0, 0);
    }, describeInvert(amount));
  }, [loaded, amount, render]);

  return (
    <MediaConverter
      backColor="fuchsia"
      title="Invert Image Colors"
      description="Make a photographic negative: every channel becomes [1 255 - value 2], so black turns white, blue turns orange, and back again if you run the result through a second time. Transparency is left alone. Drag the amount below 100% to stop part of the way."
      accept={ACCEPT}
      inputMedium="image"
      outputMedium="image"
      hint="Drop an image, or click to browse"
      onFiles={(files) => openFile(files[0])}
      onClear={clearAll}
      source={source}
      result={result}
      error={error}
      extraElements={
        <div className="flex flex-col gap-4 max-w-md">
          <Slider
            label="Amount"
            value={amount}
            onChange={setAmount}
            max={INVERT_MAX}
            neutral={INVERT_DEFAULT}
          />
          <p className="text-xs text-gray-400 leading-relaxed">
            At 50% every channel lands on the same mid-grey, so the picture disappears rather
            than half-inverting. The interesting values are near the top of the range.
          </p>
          {privacyNote}
        </div>
      }
    />
  );
};

// ─── Flip Image ───────────────────────────────────────────────────────────────

export const FlipImage = () => {
  const [axes, setAxes] = useState<FlipAxes>(FLIP_DEFAULT);
  const { loaded, source, result, error, openFile, clearAll, render } = useImageEditor('flipped');

  useEffect(() => {
    setAxes(parseFlipAxes(new URLSearchParams(window.location.search)));
  }, []);

  useShareLink({ axis: serializeFlipAxes(axes) });

  useEffect(() => {
    if (!loaded) return;
    const { scaleX, scaleY } = flipTransform(axes);
    render((ctx, image) => {
      ctx.translate(scaleX < 0 ? image.naturalWidth : 0, scaleY < 0 ? image.naturalHeight : 0);
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(image, 0, 0);
    }, describeFlip(axes));
  }, [loaded, axes, render]);

  const toggle = (key: keyof FlipAxes) => () =>
    setAxes((current) => ({ ...current, [key]: !current[key] }));

  return (
    <MediaConverter
      backColor="fuchsia"
      title="Flip Image"
      description="Mirror a picture left to right, top to bottom, or both at once — the selfie that came out the wrong way round, or a texture that has to tile. The dimensions and the format stay as they were; only the pixel order changes."
      accept={ACCEPT}
      inputMedium="image"
      outputMedium="image"
      hint="Drop an image, or click to browse"
      onFiles={(files) => openFile(files[0])}
      onClear={clearAll}
      source={source}
      result={result}
      error={error}
      extraElements={
        <div className="flex flex-col gap-3 max-w-md">
          <span className={labelClass}>Mirror</span>
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              className="accent-gray-900"
              checked={axes.horizontal}
              onChange={toggle('horizontal')}
            />
            <span className="text-sm text-gray-700">Horizontally — left becomes right</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              className="accent-gray-900"
              checked={axes.vertical}
              onChange={toggle('vertical')}
            />
            <span className="text-sm text-gray-700">Vertically — top becomes bottom</span>
          </label>
          <p className="text-xs text-gray-400 leading-relaxed">
            Both boxes together is the same picture as a 180° rotation. For 90° turns, use the
            Image Rotator.
          </p>
          {privacyNote}
        </div>
      }
    />
  );
};
