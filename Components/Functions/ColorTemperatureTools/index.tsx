'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  KELVIN_MAX,
  KELVIN_MIN,
  TEMPERATURE_PRESETS,
  describeTemperature,
  isDarkRgb,
  kelvinToMired,
  kelvinToRgb,
  rgbToHex,
  spectrumStops,
} from './logic';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

function copy(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

const RULER_TICKS = [1000, 2000, 3000, 4000, 5000, 6500, 8000, 10000, 12000];

/** Position of a Kelvin value along the ruler, as a percentage. */
const kelvinToPercent = (k: number) =>
  ((Math.min(KELVIN_MAX, Math.max(KELVIN_MIN, k)) - KELVIN_MIN) / (KELVIN_MAX - KELVIN_MIN)) * 100;

function ChannelBar({ name, value, tint }: { name: string; value: number; tint: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs text-gray-400 w-3">{name}</span>
      <div className="flex-1 h-3 bg-gray-100">
        <div className={tint} style={{ width: `${(value / 255) * 100}%`, height: '100%' }} />
      </div>
      <span className="font-mono text-xs text-gray-900 w-8 text-right">{value}</span>
    </div>
  );
}

function Readout({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <button
      onClick={() => copy(value)}
      title="Click to copy"
      className="bg-white p-4 text-left hover:bg-gray-50 transition-colors"
    >
      <p className={`${labelClass} mb-1`}>{label}</p>
      <p className="text-lg font-black text-gray-900 font-mono break-all">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
    </button>
  );
}

export const ColorTemperature = () => {
  const [kelvinText, setKelvinText] = useState('5500');

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = params.get('from');
    if (from) setKelvinText(from.trim());
  }, []);

  const parsed = useMemo(() => {
    const k = parseFloat(kelvinText.trim());
    if (!kelvinText.trim() || isNaN(k) || k <= 0) {
      return { kelvin: null as number | null, error: 'Enter a Kelvin value, for example 6500' };
    }
    if (k < KELVIN_MIN || k > KELVIN_MAX) {
      return {
        kelvin: null as number | null,
        error: `The conversion is only defined between ${KELVIN_MIN}K and ${KELVIN_MAX}K`,
      };
    }
    return { kelvin: Math.round(k), error: null as string | null };
  }, [kelvinText]);

  const kelvin = parsed.kelvin;
  const rgb = kelvin === null ? null : kelvinToRgb(kelvin);
  const hex = rgb === null ? null : rgbToHex(rgb.r, rgb.g, rgb.b);
  const mired = kelvin === null ? null : kelvinToMired(kelvin);
  const stops = useMemo(() => spectrumStops(), []);
  const gradient = `linear-gradient(to right, ${stops.map(s => `${s.hex} ${s.offset.toFixed(1)}%`).join(', ')})`;

  const sliderValue = kelvin ?? 5500;
  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  return (
    <Panel
      title="Color Temperature Converter"
      description="Drag along the blackbody spectrum or type a [1 Kelvin 2] value. Gives the light's colour as RGB and hex, the [1 Mired 2] value photographers use for filter shifts, and the per-channel mix that makes it read warm or cool."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Kelvin entry + Mired mirror */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={`${labelClass} block mb-1`}>Kelvin (K)</label>
              <input
                className={inputClass}
                placeholder="5500"
                value={kelvinText}
                onChange={e => setKelvinText(e.target.value)}
                aria-label="Colour temperature in Kelvin"
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Mired (µrd)</label>
              <input
                className={inputClass}
                placeholder="182"
                value={mired === null ? '' : String(mired)}
                onChange={e => {
                  const m = parseFloat(e.target.value);
                  // Mired is the reciprocal scale, so editing it drives Kelvin back.
                  setKelvinText(isNaN(m) || m <= 0 ? e.target.value : String(Math.round(1000000 / m)));
                }}
                aria-label="Colour temperature in Mired"
              />
            </div>
            <div>
              <label className={`${labelClass} block mb-1`}>Classification</label>
              <div className="px-3 py-2 border border-gray-200 bg-gray-50 text-sm text-gray-700 font-mono">
                {kelvin === null ? '—' : describeTemperature(kelvin)}
              </div>
            </div>
          </div>

          {/* Spectrum ruler */}
          <div>
            <p className={`${labelClass} mb-2`}>
              Blackbody Spectrum{' '}
              <span className="normal-case font-normal text-gray-400">
                ({KELVIN_MIN}K – {KELVIN_MAX}K)
              </span>
            </p>
            <div className="relative">
              <div className="h-12 border border-gray-300" style={{ background: gradient }} />
              {kelvin !== null && (
                <div
                  className="absolute top-0 h-12 w-0.5 bg-gray-900 pointer-events-none"
                  style={{ left: `${kelvinToPercent(kelvin)}%` }}
                >
                  <span className="absolute -top-0.5 -left-1 w-2.5 h-2.5 bg-gray-900" />
                </div>
              )}
            </div>
            <input
              type="range"
              min={KELVIN_MIN}
              max={KELVIN_MAX}
              step={50}
              value={sliderValue}
              onChange={e => setKelvinText(e.target.value)}
              className="w-full mt-2 accent-gray-900"
              aria-label="Kelvin slider"
            />
            <div className="relative h-4 mt-0.5">
              {RULER_TICKS.map(t => (
                <span
                  key={t}
                  className="absolute text-[10px] font-mono text-gray-400 -translate-x-1/2 whitespace-nowrap"
                  style={{ left: `${kelvinToPercent(t)}%` }}
                >
                  {t / 1000}k
                </span>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div>
            <p className={`${labelClass} mb-2`}>Reference Sources</p>
            <div className="flex flex-wrap gap-px bg-gray-200 border border-gray-200">
              {TEMPERATURE_PRESETS.map(p => {
                const prgb = kelvinToRgb(p.kelvin);
                const active = kelvin === p.kelvin;
                return (
                  <button
                    key={p.name}
                    onClick={() => setKelvinText(String(p.kelvin))}
                    className={`flex items-center gap-2 px-3 py-2 text-left ${active ? 'bg-gray-900' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <span
                      className="w-4 h-4 flex-shrink-0 border border-gray-300"
                      style={{ background: rgbToHex(prgb.r, prgb.g, prgb.b) }}
                    />
                    <span>
                      <span className={`block text-xs font-bold ${active ? 'text-white' : 'text-gray-900'}`}>
                        {p.name}
                      </span>
                      <span className={`block text-[10px] font-mono ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                        {p.kelvin}K · {p.note}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {parsed.error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">
              {parsed.error}
            </div>
          )}

          {kelvin !== null && rgb !== null && hex !== null && (
            <>
              {/* The light itself */}
              <div
                className="p-8 border border-gray-300 flex flex-col items-center justify-center"
                style={{ background: hex }}
              >
                <p
                  className={`text-5xl font-black leading-none ${isDarkRgb(rgb.r, rgb.g, rgb.b) ? 'text-white' : 'text-gray-900'}`}
                >
                  {kelvin}K
                </p>
                <p
                  className={`text-sm font-mono mt-2 ${isDarkRgb(rgb.r, rgb.g, rgb.b) ? 'text-gray-200' : 'text-gray-700'}`}
                >
                  {describeTemperature(kelvin)}
                </p>
              </div>

              {/* Readouts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200 border border-gray-200">
                <Readout label="Hex" value={hex} hint="click to copy" />
                <Readout label="RGB" value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} hint="click to copy" />
                <Readout label="Mired" value={`${mired} µrd`} hint="1,000,000 / K" />
              </div>

              {/* Channel mix */}
              <div>
                <p className={`${labelClass} mb-2`}>
                  Channel Mix{' '}
                  <span className="normal-case font-normal text-gray-400">
                    (red saturates below 6600K, blue above it)
                  </span>
                </p>
                <div className="border border-gray-200 p-4 flex flex-col gap-2">
                  <ChannelBar name="R" value={rgb.r} tint="bg-red-500" />
                  <ChannelBar name="G" value={rgb.g} tint="bg-green-500" />
                  <ChannelBar name="B" value={rgb.b} tint="bg-blue-500" />
                </div>
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
