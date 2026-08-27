'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import MediaConverter from '@/Components/MainView/MainPanel/MediaConverter';
import { MediaResult } from '@/types';
import {
    Rgb,
    guessBackgroundColor,
    hexToRgb,
    pixelAt,
    removeBackground,
    rgbToHex,
    transparentName,
} from './logic';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/bmp,.png,.jpg,.jpeg,.webp,.gif,.bmp';

const fieldLabel = 'text-xs font-bold uppercase tracking-widest text-gray-500';

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>{label}</span>
        {children}
    </label>
);

interface LoadedImage {
    name: string;
    width: number;
    height: number;
    /** Pristine RGBA of the source; every run starts from this copy. */
    pixels: Uint8ClampedArray;
}

export const BackgroundRemover = () => {
    const [loaded, setLoaded] = useState<LoadedImage | null>(null);
    const [sourceUrl, setSourceUrl] = useState('');
    const [result, setResult] = useState<MediaResult | undefined>();
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const [keyHex, setKeyHex] = useState('#ffffff');
    const [tolerance, setTolerance] = useState(0.12);
    const [feather, setFeather] = useState(0.06);
    const [contiguous, setContiguous] = useState(true);
    const [picking, setPicking] = useState(false);
    const [stats, setStats] = useState('');

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

    const openFile = async (file: File) => {
        setError('');
        setResult(undefined);
        setStats('');

        try {
            const bitmap = await createImageBitmap(file);
            const canvas = document.createElement('canvas');
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) throw new Error('This browser cannot read image pixels.');
            ctx.drawImage(bitmap, 0, 0);
            bitmap.close();

            const image = ctx.getImageData(0, 0, canvas.width, canvas.height);

            revokeSource();
            const url = URL.createObjectURL(file);
            sourceUrlRef.current = url;
            setSourceUrl(url);
            setLoaded({ name: file.name, width: canvas.width, height: canvas.height, pixels: image.data });
            // Seed the key from the border so the tool works before any click.
            setKeyHex(rgbToHex(guessBackgroundColor(image.data, canvas.width, canvas.height)));
        } catch (err) {
            setLoaded(null);
            revokeSource();
            setSourceUrl('');
            setError(err instanceof Error ? err.message : 'Could not read this image.');
        }
    };

    const clearAll = () => {
        revokeSource();
        revokeResult();
        setLoaded(null);
        setSourceUrl('');
        setResult(undefined);
        setError('');
        setStats('');
        setPicking(false);
    };

    const run = useCallback(async () => {
        if (!loaded) return;
        setBusy(true);
        setError('');

        try {
            // Work on a copy so tweaking the sliders never compounds edits.
            const pixels = new Uint8ClampedArray(loaded.pixels);
            const changed = removeBackground(pixels, loaded.width, loaded.height, {
                key: hexToRgb(keyHex), tolerance, feather, contiguous,
            });

            const canvas = document.createElement('canvas');
            canvas.width = loaded.width;
            canvas.height = loaded.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('This browser cannot write image pixels.');
            ctx.putImageData(new ImageData(pixels, loaded.width, loaded.height), 0, 0);

            const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
            if (!blob) throw new Error('Could not encode the PNG.');

            revokeResult();
            const url = URL.createObjectURL(blob);
            resultUrlRef.current = url;

            const pct = ((changed.cleared / changed.total) * 100).toFixed(1);
            setResult({ url, fileName: transparentName(loaded.name), meta: `${pct}% of pixels made transparent` });
            setStats(
                `${changed.cleared.toLocaleString()} pixels cleared, ` +
                `${changed.softened.toLocaleString()} softened at the edges.`,
            );
        } catch (err) {
            setResult(undefined);
            setError(err instanceof Error ? err.message : 'Could not remove the background.');
        } finally {
            setBusy(false);
        }
    }, [loaded, keyHex, tolerance, feather, contiguous]);

    useEffect(() => { run(); }, [run]);

    /** Map a click on the preview back to a source pixel and take its colour. */
    const pickFromPreview = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!loaded || !picking) return;
        const image = event.currentTarget.querySelector('img');
        if (!image) return;

        const box = image.getBoundingClientRect();
        if (box.width === 0 || box.height === 0) return;

        const x = Math.floor(((event.clientX - box.left) / box.width) * loaded.width);
        const y = Math.floor(((event.clientY - box.top) / box.height) * loaded.height);
        if (x < 0 || y < 0 || x >= loaded.width || y >= loaded.height) return;

        const picked: Rgb = pixelAt(loaded.pixels, loaded.width, x, y);
        setKeyHex(rgbToHex(picked));
        setPicking(false);
    };

    const source = loaded
        ? { url: sourceUrl, name: loaded.name, meta: `${loaded.width} × ${loaded.height}` }
        : undefined;

    return (
        <MediaConverter
            backColor="fuchsia"
            title="Background Color Remover"
            description="Make an image's background transparent by keying out a colour. Best on logos, screenshots and product shots on a flat background — pick the colour, widen the tolerance until the edges are clean, and download a [1PNG2]. All processing happens in your browser."
            accept={ACCEPT}
            inputMedium="image"
            outputMedium="image"
            hint="Drop an image or click to browse"
            onFiles={f => openFile(f[0])}
            onClear={clearAll}
            source={source}
            result={result}
            progress={busy && !result ? { pct: 60, label: 'Keying out the background…' } : undefined}
            error={error}
            extraElements={
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Field label="Background colour">
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={keyHex}
                                    onChange={e => setKeyHex(e.target.value)}
                                    className="h-9 w-12 flex-shrink-0 border border-gray-300 bg-white cursor-pointer p-1"
                                />
                                <input
                                    value={keyHex}
                                    onChange={e => setKeyHex(e.target.value)}
                                    className="bg-white text-gray-900 p-2 border border-gray-300 font-mono text-sm w-full focus:border-gray-900 focus:outline-none"
                                />
                            </div>
                        </Field>
                        <Field label={`Tolerance — ${Math.round(tolerance * 100)}%`}>
                            <input
                                type="range" min={0} max={100} value={Math.round(tolerance * 100)}
                                onChange={e => setTolerance(Number(e.target.value) / 100)}
                                className="accent-gray-900 h-9"
                            />
                        </Field>
                        <Field label={`Edge feather — ${Math.round(feather * 100)}%`}>
                            <input
                                type="range" min={0} max={50} value={Math.round(feather * 100)}
                                onChange={e => setFeather(Number(e.target.value) / 100)}
                                className="accent-gray-900 h-9"
                            />
                        </Field>
                        <Field label="Pick from image">
                            <button
                                type="button"
                                disabled={!loaded}
                                onClick={() => setPicking(p => !p)}
                                className={`h-9 border text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                    picking
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-900 bg-white text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                                {picking ? 'Click the image…' : 'Eyedropper'}
                            </button>
                        </Field>
                    </div>

                    {loaded && (
                        <div
                            onClick={pickFromPreview}
                            className={`flex items-center justify-center p-3 border border-gray-300 checkerboard ${
                                picking ? 'cursor-crosshair ring-1 ring-gray-900' : ''
                            }`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={sourceUrl} alt={loaded.name} className="max-h-48 object-contain" draggable={false} />
                        </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input
                            type="checkbox"
                            className="accent-gray-900"
                            checked={contiguous}
                            onChange={e => setContiguous(e.target.checked)}
                        />
                        <span className="text-sm text-gray-700">
                            Only clear background touching the edges (keeps matching colours inside the subject)
                        </span>
                    </label>

                    <p className="text-xs text-gray-400 leading-relaxed">
                        {stats && <span className="block text-gray-500">{stats}</span>}
                        This keys out one flat colour, so it will not cut hair or soft edges out of a photograph.
                        The output is always PNG, because JPG cannot store transparency.
                    </p>
                </div>
            }
        />
    );
};
