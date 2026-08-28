'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import BasicConverter from '@/Components/MainView/MainPanel/BasicConverter';
import {
  boxShadowToCSS,
  cssPropertyBoxShadow,
  borderRadiusToCSS,
  validateUuid,
  formatUuidInfo,
  calculateAge,
  formatAgeResult,
  type BoxShadowLayer,
  type BorderRadius,
} from './logic';

// ─── A1. CSS Box Shadow Generator ─────────────────────────────────────────────

const DEFAULT_LAYER: BoxShadowLayer = {
  offsetX: 4,
  offsetY: 4,
  blur: 10,
  spread: 0,
  color: 'rgba(0,0,0,0.5)',
  inset: false,
};

export const BoxShadowGenerator = () => {
  const [layers, setLayers] = useState<BoxShadowLayer[]>([{ ...DEFAULT_LAYER }]);
  const [activeLayer, setActiveLayer] = useState(0);
  const [copied, setCopied] = useState(false);

  const cssValue = boxShadowToCSS(layers);
  const cssProperty = cssPropertyBoxShadow(layers);

  const updateLayer = (idx: number, patch: Partial<BoxShadowLayer>) => {
    setLayers(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l));
  };

  const addLayer = () => {
    setLayers(prev => [...prev, { ...DEFAULT_LAYER }]);
    setActiveLayer(layers.length);
  };

  const removeLayer = (idx: number) => {
    if (layers.length === 1) return;
    setLayers(prev => prev.filter((_, i) => i !== idx));
    setActiveLayer(Math.max(0, activeLayer >= idx ? activeLayer - 1 : activeLayer));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(cssProperty).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const inputClass = 'bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-gray-900 px-2 py-1 text-sm font-mono w-full';
  const btnClass = 'px-2 py-1 text-xs border border-gray-300 bg-white text-gray-700 hover:text-gray-900 hover:border-gray-900 transition-colors';

  const layer = layers[activeLayer] ?? layers[0];

  const SliderRow = ({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <label className="text-gray-400 text-xs">{label}</label>
        <span className="text-gray-300 text-xs font-mono">{value}px</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-emerald-500"
      />
    </div>
  );

  return (
    <Panel
      title="CSS Box Shadow Generator"
      description="Generate [1 box-shadow 2] CSS values interactively. Add multiple layers with offsets, blur, spread, color and inset toggle."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Layer tabs */}
          <div className="flex flex-row flex-wrap gap-2 items-center">
            {layers.map((_, i) => (
              <button
                key={i}
                className={`${btnClass} ${i === activeLayer ? 'border-emerald-500/50 text-emerald-300' : ''}`}
                onClick={() => setActiveLayer(i)}
              >
                Layer {i + 1}
              </button>
            ))}
            <button className={btnClass} onClick={addLayer}>+ Add Layer</button>
            {layers.length > 1 && (
              <button className={`${btnClass} text-red-400 hover:text-red-300`} onClick={() => removeLayer(activeLayer)}>
                Remove
              </button>
            )}
          </div>

          {/* Active layer controls */}
          <div className="flex flex-col gap-3">
            <SliderRow label="Offset X" value={layer.offsetX} min={-50} max={50} onChange={v => updateLayer(activeLayer, { offsetX: v })} />
            <SliderRow label="Offset Y" value={layer.offsetY} min={-50} max={50} onChange={v => updateLayer(activeLayer, { offsetY: v })} />
            <SliderRow label="Blur" value={layer.blur} min={0} max={100} onChange={v => updateLayer(activeLayer, { blur: v })} />
            <SliderRow label="Spread" value={layer.spread} min={-50} max={50} onChange={v => updateLayer(activeLayer, { spread: v })} />
            <div className="flex flex-row gap-3 items-center">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-gray-400 text-xs">Color</label>
                <input
                  type="color"
                  value={layer.color.startsWith('#') ? layer.color : '#000000'}
                  onChange={e => updateLayer(activeLayer, { color: e.target.value })}
                  className="w-full h-9 border border-gray-200 bg-white cursor-pointer"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-gray-400 text-xs">Color value</label>
                <input
                  className={inputClass}
                  value={layer.color}
                  onChange={e => updateLayer(activeLayer, { color: e.target.value })}
                  placeholder="rgba(0,0,0,0.5)"
                />
              </div>
              <div className="flex flex-col gap-1 items-center">
                <label className="text-gray-400 text-xs">Inset</label>
                <button
                  className={`${btnClass} ${layer.inset ? 'border-emerald-500/50 text-emerald-300' : ''}`}
                  onClick={() => updateLayer(activeLayer, { inset: !layer.inset })}
                >
                  {layer.inset ? 'On' : 'Off'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="w-full h-px bg-gray-200" />
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Preview</span>
            <div className="flex items-center justify-center py-6">
              <div
                className="w-32 h-32 bg-white/10 border border-gray-200"
                style={{ boxShadow: cssValue === 'none' ? 'none' : cssValue.replace(/\n\s+/g, ' ') }}
              />
            </div>
          </div>

          {/* CSS output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">CSS Output</span>
              <button className={btnClass} onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <textarea
              className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-300 font-mono text-sm resize-y"
              rows={Math.max(2, layers.length + 1)}
              value={cssProperty}
              readOnly
            />
          </div>
        </div>
      }
    />
  );
};

// ─── A2. CSS Border Radius Generator ──────────────────────────────────────────

export const BorderRadiusGenerator = () => {
  const [radius, setRadius] = useState<BorderRadius>({
    topLeft: 8,
    topRight: 8,
    bottomRight: 8,
    bottomLeft: 8,
    unit: 'px',
  });
  const [copied, setCopied] = useState(false);

  const css = borderRadiusToCSS(radius);
  const max = radius.unit === '%' ? 100 : 100;

  const handleCopy = () => {
    navigator.clipboard.writeText(css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const btnClass = 'px-2 py-1 text-xs border border-gray-300 bg-white text-gray-700 hover:text-gray-900 hover:border-gray-900 transition-colors';

  const SliderRow = ({
    label,
    field,
  }: {
    label: string;
    field: keyof Omit<BorderRadius, 'unit'>;
  }) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <label className="text-gray-400 text-xs">{label}</label>
        <span className="text-gray-300 text-xs font-mono">{radius[field]}{radius.unit}</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={radius[field]}
        onChange={e => setRadius(prev => ({ ...prev, [field]: parseInt(e.target.value) }))}
        className="w-full accent-emerald-500"
      />
    </div>
  );

  return (
    <Panel
      title="CSS Border Radius Generator"
      description="Generate [1 border-radius 2] CSS values with per-corner control. Use [1 px 2] or [1 % 2] units."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Unit toggle */}
          <div className="flex flex-row gap-2">
            <span className="text-gray-400 text-xs self-center">Unit:</span>
            {(['px', '%'] as const).map(u => (
              <button
                key={u}
                className={`${btnClass} ${radius.unit === u ? 'border-emerald-500/50 text-emerald-300' : ''}`}
                onClick={() => setRadius(prev => ({ ...prev, unit: u }))}
              >
                {u}
              </button>
            ))}
          </div>

          {/* Sliders */}
          <SliderRow label="Top Left" field="topLeft" />
          <SliderRow label="Top Right" field="topRight" />
          <SliderRow label="Bottom Right" field="bottomRight" />
          <SliderRow label="Bottom Left" field="bottomLeft" />

          {/* Preview */}
          <div className="w-full h-px bg-gray-200" />
          <div className="flex flex-col gap-2">
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Preview</span>
            <div className="flex items-center justify-center py-6">
              <div
                className="w-40 h-32 bg-white/10 border border-gray-400"
                style={{
                  borderRadius: `${radius.topLeft}${radius.unit} ${radius.topRight}${radius.unit} ${radius.bottomRight}${radius.unit} ${radius.bottomLeft}${radius.unit}`,
                }}
              />
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">CSS Output</span>
              <button className={btnClass} onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
            </div>
            <div className="bg-gray-50 text-gray-900 p-3 border border-gray-200 font-mono text-sm">
              {css}
            </div>
          </div>
        </div>
      }
    />
  );
};

// ─── A3. UUID Validator ────────────────────────────────────────────────────────

export const UuidValidator = () => {
  const [fromValue, setFromValue] = useState('');

  let toValue = '';
  if (fromValue.trim()) {
    const info = validateUuid(fromValue);
    toValue = formatUuidInfo(info);
  }

  return (
    <BasicConverter
      title="UUID Validator"
      description="Validate and inspect [1 UUID 2] strings. Accepts formatted UUIDs, UUIDs without dashes, and UUIDs wrapped in curly braces."
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={setFromValue}
      fromTitle="UUID Input"
      toTitle="Validation Result"
      backColor="lime"
    />
  );
};

// ─── A4. Age Calculator ────────────────────────────────────────────────────────

export const AgeCalculator = () => {
  const [birthdate, setBirthdate] = useState('');

  let result: ReturnType<typeof calculateAge> | null = null;
  let error = '';
  if (birthdate) {
    try {
      result = calculateAge(birthdate);
    } catch {
      error = 'Invalid date';
    }
  }

  const inputClass = 'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 border border-gray-300 focus:outline-none focus:border-gray-900 text-sm';

  return (
    <Panel
      title="Age Calculator"
      description="Calculate your exact age from a [1 birthdate 2]. Includes zodiac sign, day of week born, and next birthday countdown."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Date of Birth</label>
            <input
              type="date"
              className={inputClass}
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          {result && (
            <>
              <div className="w-full h-px bg-gray-200" />
              <div className="flex flex-col gap-2">
                {[
                  { label: 'Age', value: `${result.years} years, ${result.months} months, ${result.days} days` },
                  { label: 'Total Days', value: result.totalDays.toLocaleString() },
                  { label: 'Born on', value: result.dayOfWeekBorn },
                  { label: 'Zodiac Sign', value: result.zodiacSign },
                  { label: 'Next Birthday', value: `${result.nextBirthday} (in ${result.daysUntilBirthday} days)` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-3 border-b border-gray-200 pb-2">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <span className="text-gray-900 text-sm font-mono text-right">{value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      }
    />
  );
};
