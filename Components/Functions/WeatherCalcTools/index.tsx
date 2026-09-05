'use client';

import React, { useEffect, useState } from 'react';
import { FileTextArea } from '@/Components/View/FileInput';
import Panel from '@/Components/MainView/MainPanel/Panel';
import { parseWeatherInput, computeWeather, formatTemp } from './logic';
import { useShareLink } from '@/Components/Functions/ShareLink';

const PLACEHOLDER = `T=20°C
W=30km/h
RH=65%`;

export const WeatherCalculator = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from') || '';
    if (from) setInput(from);
  }, []);

  // Mirrors the params read above, so the header's copy-link button carries them.
  useShareLink({ from: input })

  useEffect(() => {
    if (!input.trim()) { setOutput(''); setError(''); return; }
    try {
      const inp = parseWeatherInput(input);
      const r = computeWeather(inp);

      const lines: string[] = [
        `Temperature:    ${formatTemp(r.tempC)}`,
        `Wind speed:     ${r.windKmh.toFixed(1)} km/h (${r.windMph.toFixed(1)} mph)`,
      ];

      if (inp.rhPct !== null) {
        lines.push(`Relative Hum.:  ${inp.rhPct.toFixed(0)}%`);
      }

      lines.push('');

      if (r.windChill !== null) {
        lines.push(`Wind Chill:     ${formatTemp(r.windChill)}`);
      } else if (r.windChillNote) {
        lines.push(`Wind Chill:     N/A — ${r.windChillNote}`);
      }

      if (r.heatIndex !== null) {
        lines.push(`Heat Index:     ${formatTemp(r.heatIndex)}`);
      } else if (r.heatIndexNote) {
        lines.push(`Heat Index:     N/A — ${r.heatIndexNote}`);
      }

      if (r.dewPoint !== null) {
        lines.push(`Dew Point:      ${formatTemp(r.dewPoint)}`);
      } else if (r.dewPointNote) {
        lines.push(`Dew Point:      N/A — ${r.dewPointNote}`);
      }

      setOutput(lines.join('\n'));
      setError('');
    } catch (e) {
      setOutput('');
      setError(e instanceof Error ? e.message : 'Invalid input');
    }
  }, [input]);

  const textareaClass = 'bg-white backdrop-blur-sm text-gray-900 placeholder:text-gray-400 p-3 w-full border border-gray-200 focus:border-gray-400 focus:outline-none resize-none transition-colors duration-200 font-mono text-sm';

  return (
    <Panel
      title="Weather Calculator"
      description="Compute [1 wind chill 2], [1 heat index 2], and [1 dew point 2] from temperature, wind speed, and relative humidity. Supports °C/°F and km/h/mph/m/s."
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Input</label>
            <FileTextArea>
              <textarea
                className={textareaClass}
                placeholder={PLACEHOLDER}
                rows={5}
                value={input}
                onChange={e => setInput(e.target.value)}
              />
            </FileTextArea>
          </div>

          <div className="text-gray-500 text-xs font-mono space-y-0.5">
            <p>Keys: <span className="text-gray-400">T</span> (temperature), <span className="text-gray-400">W</span> (wind), <span className="text-gray-400">RH</span> (relative humidity %)</p>
            <p>Examples: <span className="text-gray-400">T=32°F</span>, <span className="text-gray-400">W=15mph</span>, <span className="text-gray-400">W=5m/s</span></p>
          </div>

          {error && <p className="text-red-400 text-sm font-mono">{error}</p>}

          {output && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Result</label>
              <pre className="bg-gray-50 p-3 border border-gray-200 font-mono text-sm text-gray-900 whitespace-pre-wrap">
                {output}
              </pre>
            </div>
          )}

          <div className="w-full h-px bg-gray-200" />
          <div className="text-gray-500 text-xs space-y-1">
            <p>Wind Chill: NWS formula, valid for T ≤ 50°F and wind ≥ 3 mph.</p>
            <p>Heat Index: Rothfuss formula, valid for T ≥ 80°F and RH ≥ 40%.</p>
            <p>Dew Point: Magnus formula (August-Roche-Magnus approximation).</p>
          </div>
        </div>
      }
    />
  );
};
