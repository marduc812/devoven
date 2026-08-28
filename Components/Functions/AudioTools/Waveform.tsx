'use client';

/**
 * The audio category's shared graph.
 *
 * One canvas draws the min/max envelope of a mono signal, plus whatever the
 * tool needs on top of it: a draggable selection (trimmer), tinted bands
 * (silence trimmer), a gain curve (fades), or level guides (normalizer, info).
 * Peaks are rebuilt for the measured pixel width, so the graph stays crisp on
 * resize and on high-DPI screens without the caller pre-bucketing anything.
 *
 * Colours come from a small palette keyed on the resolved theme rather than
 * from Tailwind classes — canvas ink cannot inherit the `.dark` override layer.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { Range, buildWaveformPeaks, clamp, formatDuration } from './logic';

export interface WaveformRegion extends Range {
    /** `cut` bands are on their way out of the file; `keep` bands survive. */
    tone?: 'cut' | 'keep';
}

export interface WaveformProps {
    /** Mono signal. Stereo files should be folded with `mixToMono` first. */
    samples: Float32Array;
    duration: number;
    height?: number;
    /** Highlighted span — everything outside it is drawn muted. */
    selection?: Range;
    regions?: WaveformRegion[];
    /** Gain curve sampled evenly across the clip, 0..1, drawn over the wave. */
    envelope?: number[];
    /** Dashed level lines at ±level (linear amplitude, 0..1). */
    guides?: { level: number; label?: string }[];
    /**
     * Enables drag-to-select. `done` is false while the pointer is still down,
     * so a caller can hold off on expensive re-encoding until the drag ends.
     */
    onSelectionChange?: (range: Range, done: boolean) => void;
    /** Hides the 0:00 / duration scale under the graph. */
    hideScale?: boolean;
}

const PALETTE = {
    light: {
        wave: '#8b5cf6',
        muted: '#d4d4d8',
        axis: '#e5e7eb',
        cut: 'rgba(239,68,68,0.10)',
        cutEdge: 'rgba(239,68,68,0.45)',
        keep: 'rgba(139,92,246,0.10)',
        keepEdge: 'rgba(139,92,246,0.45)',
        guide: '#71717a',
        envelope: '#111827',
    },
    dark: {
        wave: '#a78bfa',
        muted: '#3f3f46',
        axis: '#27272a',
        cut: 'rgba(248,113,113,0.14)',
        cutEdge: 'rgba(248,113,113,0.5)',
        keep: 'rgba(167,139,250,0.14)',
        keepEdge: 'rgba(167,139,250,0.5)',
        guide: '#a1a1aa',
        envelope: '#e4e4e7',
    },
};

/** How close to an edge a pointer must land to grab it instead of starting over. */
const GRAB_PX = 10;

type DragMode = 'start' | 'end' | 'new';

const Waveform = ({
    samples,
    duration,
    height = 128,
    selection,
    regions,
    envelope,
    guides,
    onSelectionChange,
    hideScale,
}: WaveformProps) => {
    const boxRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [width, setWidth] = useState(0);
    const { resolvedTheme } = useTheme();
    const colors = resolvedTheme === 'dark' ? PALETTE.dark : PALETTE.light;

    // The pointer handlers live on window during a drag, so the live values
    // they need are kept in a ref rather than closed over per render.
    const drag = useRef<{ mode: DragMode; anchor: number } | null>(null);
    const live = useRef({ duration, selection, onSelectionChange });
    live.current = { duration, selection, onSelectionChange };

    useEffect(() => {
        const box = boxRef.current;
        if (!box) return;
        const observer = new ResizeObserver(entries => {
            setWidth(Math.max(1, Math.floor(entries[0].contentRect.width)));
        });
        observer.observe(box);
        setWidth(Math.max(1, Math.floor(box.clientWidth)));
        return () => observer.disconnect();
    }, []);

    const peaks = useMemo(
        () => (width > 0 ? buildWaveformPeaks(samples, width) : []),
        [samples, width],
    );

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || width === 0 || peaks.length === 0) return;

        const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);

        const middle = height / 2;
        const amplitude = middle * 0.94;
        const atTime = (seconds: number) =>
            duration > 0 ? clamp(seconds / duration, 0, 1) * width : 0;

        for (const region of regions ?? []) {
            const from = atTime(region.start);
            const to = atTime(region.end);
            ctx.fillStyle = region.tone === 'keep' ? colors.keep : colors.cut;
            ctx.fillRect(from, 0, Math.max(1, to - from), height);
            ctx.strokeStyle = region.tone === 'keep' ? colors.keepEdge : colors.cutEdge;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(Math.round(from) + 0.5, 0);
            ctx.lineTo(Math.round(from) + 0.5, height);
            ctx.moveTo(Math.round(to) - 0.5, 0);
            ctx.lineTo(Math.round(to) - 0.5, height);
            ctx.stroke();
        }

        ctx.strokeStyle = colors.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, middle + 0.5);
        ctx.lineTo(width, middle + 0.5);
        ctx.stroke();

        const from = selection ? atTime(selection.start) : 0;
        const to = selection ? atTime(selection.end) : width;
        peaks.forEach((peak, x) => {
            const inside = !selection || (x >= from - 1 && x <= to);
            ctx.fillStyle = inside ? colors.wave : colors.muted;
            const top = middle - peak.max * amplitude;
            const bottom = middle - peak.min * amplitude;
            ctx.fillRect(x, top, 1, Math.max(1, bottom - top));
        });

        for (const guide of guides ?? []) {
            const offset = clamp(guide.level, 0, 1) * amplitude;
            ctx.strokeStyle = colors.guide;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(0, middle - offset);
            ctx.lineTo(width, middle - offset);
            ctx.moveTo(0, middle + offset);
            ctx.lineTo(width, middle + offset);
            ctx.stroke();
            ctx.setLineDash([]);
            if (guide.label) {
                ctx.fillStyle = colors.guide;
                ctx.font = '10px ui-monospace, monospace';
                ctx.textAlign = 'right';
                ctx.fillText(guide.label, width - 4, Math.max(10, middle - offset - 3));
            }
        }

        if (envelope && envelope.length > 1) {
            ctx.strokeStyle = colors.envelope;
            ctx.lineWidth = 1.5;
            for (const sign of [-1, 1]) {
                ctx.beginPath();
                envelope.forEach((value, index) => {
                    const x = (index / (envelope.length - 1)) * width;
                    const y = middle - sign * clamp(value, 0, 1) * amplitude;
                    if (index === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            }
        }
    }, [peaks, width, height, duration, selection, regions, envelope, guides, colors]);

    const timeAt = useCallback((clientX: number) => {
        const box = boxRef.current;
        if (!box) return 0;
        const rect = box.getBoundingClientRect();
        if (rect.width === 0) return 0;
        return clamp(((clientX - rect.left) / rect.width) * live.current.duration, 0, live.current.duration);
    }, []);

    const emit = useCallback((time: number, done: boolean) => {
        const state = drag.current;
        const { onSelectionChange: notify, selection: current } = live.current;
        if (!state || !notify) return;
        const [start, end] = state.anchor <= time ? [state.anchor, time] : [time, state.anchor];

        // A click with no travel would produce an empty clip, so the selection
        // is left alone — but the end of the gesture still has to be reported,
        // or a caller deferring work until `done` would wait forever.
        if (end - start < 0.001) {
            if (done && current) notify(current, true);
            return;
        }
        notify({ start, end }, done);
    }, []);

    useEffect(() => {
        if (!onSelectionChange) return;

        const move = (event: PointerEvent) => {
            if (!drag.current) return;
            event.preventDefault();
            emit(timeAt(event.clientX), false);
        };
        const up = (event: PointerEvent) => {
            if (!drag.current) return;
            emit(timeAt(event.clientX), true);
            drag.current = null;
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            window.removeEventListener('pointercancel', up);
        };
    }, [onSelectionChange, emit, timeAt]);

    const onPointerDown = (event: React.PointerEvent) => {
        if (!onSelectionChange || duration <= 0) return;
        event.preventDefault();
        const time = timeAt(event.clientX);
        const perPixel = duration / Math.max(1, width);

        // Grabbing an edge keeps the far edge anchored; anywhere else starts
        // a fresh selection from the press point.
        if (selection) {
            if (Math.abs(time - selection.start) <= GRAB_PX * perPixel) {
                drag.current = { mode: 'start', anchor: selection.end };
                return;
            }
            if (Math.abs(time - selection.end) <= GRAB_PX * perPixel) {
                drag.current = { mode: 'end', anchor: selection.start };
                return;
            }
        }
        drag.current = { mode: 'new', anchor: time };
    };

    const pct = (seconds: number) =>
        duration > 0 ? `${clamp(seconds / duration, 0, 1) * 100}%` : '0%';

    return (
        <div className="flex flex-col gap-1">
            <div
                ref={boxRef}
                onPointerDown={onPointerDown}
                className={`relative w-full border border-gray-300 bg-white overflow-hidden ${
                    onSelectionChange ? 'cursor-ew-resize touch-none select-none' : ''
                }`}
                style={{ height }}
            >
                <canvas ref={canvasRef} className="block w-full h-full" />
                {onSelectionChange && selection && (
                    <>
                        <span
                            className="absolute top-0 bottom-0 w-0.5 -ml-px bg-violet-500 pointer-events-none"
                            style={{ left: pct(selection.start) }}
                        />
                        <span
                            className="absolute top-0 bottom-0 w-0.5 -ml-px bg-violet-500 pointer-events-none"
                            style={{ left: pct(selection.end) }}
                        />
                        <span
                            className="absolute top-0 h-2 w-2 -ml-1 bg-violet-500 pointer-events-none"
                            style={{ left: pct(selection.start) }}
                        />
                        <span
                            className="absolute bottom-0 h-2 w-2 -ml-1 bg-violet-500 pointer-events-none"
                            style={{ left: pct(selection.end) }}
                        />
                    </>
                )}
            </div>
            {!hideScale && (
                <div className="flex justify-between font-mono text-[10px] text-gray-400">
                    <span>0:00.00</span>
                    <span>{formatDuration(duration)}</span>
                </div>
            )}
        </div>
    );
};

export default Waveform;
