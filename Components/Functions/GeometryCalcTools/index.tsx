'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import Diagram from './Diagram';
import { SHAPE_DEFS, findShapeDef, measureShape, type ShapeDef } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const labelClass = 'text-xs font-bold uppercase tracking-wider text-gray-500';

const defaultsFor = (def: ShapeDef): Record<string, string> =>
  Object.fromEntries(def.fields.map((f) => [f.key, String(def.defaults[f.key])]));

export function GeometryCalculator() {
  const [variant, setVariant] = useState('circle');
  const [values, setValues] = useState<Record<string, string>>(() =>
    defaultsFor(SHAPE_DEFS[0]),
  );

  const def = SHAPE_DEFS.find((d) => d.variant === variant) ?? SHAPE_DEFS[0];

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const from = p.get('from');
    if (!from) return;

    // Legacy share links carry the shape name on line 1 and key=value pairs after it.
    const lines = from.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const parsed: Record<string, string> = {};
    for (const line of lines.slice(1)) {
      const match = line.match(/^([a-z_]+)\s*=\s*([0-9.]+)$/i);
      if (match) parsed[match[1].toLowerCase()] = match[2];
    }

    const shape = findShapeDef(lines[0], Object.keys(parsed));
    if (!shape) return;

    setVariant(shape.variant);
    setValues({ ...defaultsFor(shape), ...parsed });
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: [variant, ...Object.entries(values).map(([k, v]) => `${k}=${v}`)].join('\n') })

  const selectShape = (next: ShapeDef) => {
    setVariant(next.variant);
    // Dimensions the new shape shares with the old one carry over, so switching
    // between, say, cylinder and cone keeps the radius you just typed.
    setValues((current) => {
      const seeded = defaultsFor(next);
      for (const field of next.fields) {
        if (current[field.key] !== undefined) seeded[field.key] = current[field.key];
      }
      return seeded;
    });
  };

  const result = useMemo(() => {
    const params: Record<string, number> = {};

    for (const field of def.fields) {
      const raw = (values[field.key] ?? '').trim();
      if (raw === '') return { data: null, params, error: `Enter a value for ${field.label} (${field.key})` };
      const parsed = parseFloat(raw);
      if (isNaN(parsed)) return { data: null, params, error: `${field.key} is not a number: "${raw}"` };
      if (parsed <= 0) return { data: null, params, error: `${field.key} must be greater than zero` };
      params[field.key] = parsed;
    }

    // Two constraints the handlers cannot express: a side set that closes into a
    // triangle, and a whole number of polygon sides.
    if (def.variant === 'triangle-sss') {
      const { a, b, c } = params;
      if (a + b <= c || a + c <= b || b + c <= a) {
        return {
          data: null,
          params,
          error: 'Those sides cannot close into a triangle — each one must be shorter than the other two combined',
        };
      }
    }
    if (def.id === 'polygon' && !Number.isInteger(params.n)) {
      return { data: null, params, error: 'A polygon needs a whole number of sides' };
    }

    try {
      return { data: measureShape(def.id, params), params, error: null };
    } catch (e: unknown) {
      return { data: null, params, error: e instanceof Error ? e.message : 'Could not measure this shape' };
    }
  }, [def, values]);

  const inputClass =
    'bg-white text-gray-900 placeholder:text-gray-400 px-3 py-2 w-full border border-gray-300 focus:border-gray-900 focus:outline-none font-mono text-sm';

  const groups: Array<'2D' | '3D'> = ['2D', '3D'];

  return (
    <Panel
      title="Geometry Calculator"
      description="Pick a shape, type its dimensions, and get every measurement that follows — [1 area 2], [1 perimeter 2], [1 volume 2], [1 surface area 2] and the rest. The sketch is drawn from your numbers, so it always shows which dimension is which."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Shape picker */}
          {groups.map((group) => (
            <div key={group}>
              <p className={`${labelClass} mb-2`}>{group} Shapes</p>
              <div className="inline-flex flex-wrap gap-px bg-gray-200 border border-gray-200">
                {SHAPE_DEFS.filter((d) => d.group === group).map((shape) => (
                  <button
                    key={shape.variant}
                    onClick={() => selectShape(shape)}
                    aria-pressed={shape.variant === def.variant}
                    className={`px-3 py-2 text-sm transition-colors duration-150 ${
                      shape.variant === def.variant
                        ? 'bg-gray-900 text-white font-bold'
                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {shape.name}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Diagram + dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-gray-200 bg-white p-4 flex items-center justify-center">
              <Diagram variant={def.variant} params={result.params} />
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <p className={`${labelClass} mb-2`}>Dimensions</p>
                <div className="grid grid-cols-2 gap-3">
                  {def.fields.map((field) => (
                    <div key={field.key}>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                        {field.label} <span className="font-mono text-gray-300">({field.key})</span>
                      </label>
                      <input
                        className={inputClass}
                        value={values[field.key] ?? ''}
                        onChange={(e) =>
                          setValues((current) => ({ ...current, [field.key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {result.error && (
                <div className="bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm font-mono">
                  {result.error}
                </div>
              )}

              {result.data && (
                <div>
                  <p className={`${labelClass} mb-2`}>Results</p>
                  <div className="border border-gray-200 divide-y divide-gray-100">
                    {result.data.measurements.map((m) => (
                      <div key={m.label} className="flex items-baseline justify-between gap-4 px-3 py-2">
                        <span className="text-sm text-gray-500">{m.label}</span>
                        <span className="font-mono text-sm font-bold text-gray-900 text-right break-all">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
