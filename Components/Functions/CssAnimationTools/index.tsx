'use client';

import { useState } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { generateAnimationCSS, generateDefaultAnimation, AnimationProps } from './logic';

export function CssAnimationGenerator() {
  const [anim, setAnim] = useState<AnimationProps>(generateDefaultAnimation());
  const css = generateAnimationCSS(anim);

  function updateAnim(partial: Partial<AnimationProps>) {
    setAnim((prev) => ({ ...prev, ...partial }));
  }

  const inputClass =
    'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';
  const labelClass = 'text-xs text-gray-500 uppercase tracking-wider';
  const selectClass =
    'border border-gray-300 bg-white text-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:border-gray-900';

  return (
    <Panel
      title="CSS Animation Generator"
      description="Generate CSS [1 @keyframes 2] animations with a live preview. Customize properties and copy the generated CSS."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-5">
          {/* Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Name</span>
              <input
                type="text"
                className={inputClass}
                value={anim.name}
                onChange={(e) => updateAnim({ name: e.target.value || 'myAnimation' })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Duration (s)</span>
              <input
                type="number"
                min={0.1}
                max={60}
                step={0.1}
                className={inputClass}
                value={anim.duration}
                onChange={(e) => updateAnim({ duration: parseFloat(e.target.value) || 1 })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Delay (s)</span>
              <input
                type="number"
                min={0}
                max={60}
                step={0.1}
                className={inputClass}
                value={anim.delay}
                onChange={(e) => updateAnim({ delay: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Timing</span>
              <select
                className={selectClass}
                value={anim.timingFunction}
                onChange={(e) => updateAnim({ timingFunction: e.target.value })}
              >
                <option value="ease">ease</option>
                <option value="ease-in">ease-in</option>
                <option value="ease-out">ease-out</option>
                <option value="ease-in-out">ease-in-out</option>
                <option value="linear">linear</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Iteration</span>
              <select
                className={selectClass}
                value={anim.iterationCount}
                onChange={(e) => updateAnim({ iterationCount: e.target.value })}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="infinite">infinite</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Direction</span>
              <select
                className={selectClass}
                value={anim.direction}
                onChange={(e) => updateAnim({ direction: e.target.value })}
              >
                <option value="normal">normal</option>
                <option value="reverse">reverse</option>
                <option value="alternate">alternate</option>
                <option value="alternate-reverse">alternate-reverse</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Fill Mode</span>
              <select
                className={selectClass}
                value={anim.fillMode}
                onChange={(e) => updateAnim({ fillMode: e.target.value })}
              >
                <option value="none">none</option>
                <option value="forwards">forwards</option>
                <option value="backwards">backwards</option>
                <option value="both">both</option>
              </select>
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Live Preview</span>
            <div className="border border-gray-200 bg-gray-50 flex items-center justify-center h-24 overflow-hidden">
              <style>{`
                @keyframes ${anim.name}_preview {
                  0% { opacity: 0; transform: translateY(0px); }
                  100% { opacity: 1; transform: translateY(-20px); }
                }
                .css-anim-preview {
                  animation: ${anim.name}_preview ${anim.duration}s ${anim.timingFunction} ${anim.delay}s ${anim.iterationCount} ${anim.direction} ${anim.fillMode};
                }
              `}</style>
              <div
                className="css-anim-preview w-10 h-10 bg-lime-400/70"
              />
            </div>
          </div>

          {/* Generated CSS */}
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Generated CSS</span>
            <textarea
              className="bg-gray-50 text-gray-900 p-3 w-full border border-gray-200 resize-none font-mono text-sm cursor-default"
              rows={10}
              value={css}
              readOnly
            />
          </div>
        </div>
      }
    />
  );
}
