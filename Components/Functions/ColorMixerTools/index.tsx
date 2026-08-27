'use client';

import React, { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { mixColors, generateColorScale, hexToRgbColor } from './logic';

export const ColorMixerTools = () => {
  const [color1, setColor1] = useState('#ff0000');
  const [color2, setColor2] = useState('#0000ff');
  const [ratio, setRatio] = useState(50);

  // weight=1 means 100% color1, weight=0 means 100% color2
  const weight = 1 - ratio / 100;
  const mixed = mixColors(color1, color2, weight);
  const scale = generateColorScale(color1, color2, 5);
  const mixedRgb = hexToRgbColor(mixed);

  const labelClass = 'text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1';
  const infoRowClass = 'flex items-center gap-3 border-b border-gray-200 py-2';

  return (
    <Panel
      title="Color Mixer"
      description="Mix two colors together with an adjustable ratio. Choose [1 Color 1 2] and [1 Color 2 2], then drag the slider to blend them."
      backColor="cyan"
      extraElements={
        <div className="flex flex-col gap-6">
          <div className="flex flex-row gap-4 flex-wrap">
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className={labelClass}>Color 1</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color1}
                  onChange={e => setColor1(e.target.value)}
                  className="w-10 h-10 border border-gray-200 cursor-pointer bg-transparent"
                />
                <span className="text-gray-900 font-mono text-sm">{color1}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1 min-w-32">
              <label className={labelClass}>Color 2</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color2}
                  onChange={e => setColor2(e.target.value)}
                  className="w-10 h-10 border border-gray-200 cursor-pointer bg-transparent"
                />
                <span className="text-gray-900 font-mono text-sm">{color2}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>
              Ratio: {100 - ratio}% color 1 + {ratio}% color 2
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={ratio}
              onChange={e => setRatio(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>Mixed Color</label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: mixed }}
              />
              <div>
                <p className="text-gray-900 font-mono text-sm">{mixed}</p>
                <p className="text-gray-400 text-xs font-mono">rgb({mixedRgb.r}, {mixedRgb.g}, {mixedRgb.b})</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className={labelClass}>5-Stop Scale</label>
            <div className="flex flex-row gap-2">
              {scale.map((hex, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className="w-full h-10 border border-gray-200"
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                  <span className="text-gray-500 font-mono text-xs">{hex}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className={labelClass}>Details</label>
            <div className={infoRowClass}>
              <span className="text-gray-400 text-sm w-20">Color 1</span>
              <span className="text-gray-900 font-mono text-sm">{color1}</span>
            </div>
            <div className={infoRowClass}>
              <span className="text-gray-400 text-sm w-20">Color 2</span>
              <span className="text-gray-900 font-mono text-sm">{color2}</span>
            </div>
            <div className={infoRowClass}>
              <span className="text-gray-400 text-sm w-20">Mixed</span>
              <span className="text-gray-900 font-mono text-sm">{mixed}</span>
            </div>
          </div>
        </div>
      }
    />
  );
};
