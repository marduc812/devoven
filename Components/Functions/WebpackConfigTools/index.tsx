'use client';

import { useState, useEffect } from 'react';
import AdvancedConverter from '@/Components/MainView/MainPanel/AdvancedConverter';
import { DEFAULT_OPTIONS, generateWebpackConfig, WebpackOptions, getRequiredPackages } from './logic';

export function WebpackConfigGenerator() {
  const [opts, setOpts] = useState<WebpackOptions>({ ...DEFAULT_OPTIONS });
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    setToValue(generateWebpackConfig(opts));
  }, [opts]);

  const set = <K extends keyof WebpackOptions>(key: K, val: WebpackOptions[K]) =>
    setOpts((prev) => ({ ...prev, [key]: val }));

  const toggle = <K extends keyof WebpackOptions>(key: K) =>
    setOpts((prev) => ({ ...prev, [key]: !prev[key] }));

  const { dev, prod } = getRequiredPackages(opts);
  const fromValue = [
    `// npm install -D ${dev.join(' ')}`,
    prod.length > 0 ? `// npm install ${prod.join(' ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const toggleCls = (active: boolean) =>
    `px-2.5 py-1 rounded text-xs border transition-all ${
      active
        ? 'bg-gray-900 text-white border-gray-900'
        : 'bg-white/5 text-gray-400 border-gray-200 hover:bg-gray-100'
    }`;

  const checkRow = (key: keyof WebpackOptions, label: string, enabled = true) => {
    const val = opts[key] as boolean;
    if (!enabled) return null;
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={val}
          onChange={() => toggle(key)}
          className="accent-lime-400"
        />
        <span className="text-xs text-gray-700">{label}</span>
      </label>
    );
  };

  return (
    <AdvancedConverter
      title="Webpack Config Generator"
      description="Generate a [1 webpack.config.js 2] by selecting your project features. Supports [1 TypeScript 2], [1 React 2], [1 Babel 2], [1 CSS Modules 2], [1 Sass 2], asset modules, [1 HtmlWebpackPlugin 2], and [1 MiniCssExtractPlugin 2]."
      fromTitle="Install commands"
      toTitle="webpack.config.js"
      fromValue={fromValue}
      toValue={toValue}
      setFromValue={() => {}}
      inputReadOnly
      backColor="lime"
      extraElements={
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400">Mode:</span>
            {(['development', 'production', 'none'] as const).map((m) => (
              <button
                key={m}
                onClick={() => set('mode', m)}
                className={toggleCls(opts.mode === m)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Language</span>
              {checkRow('useTypeScript', 'TypeScript')}
              {checkRow('useBabel', 'Babel')}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Framework</span>
              {checkRow('useReact', 'React / JSX')}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Styles</span>
              {checkRow('useCssModules', 'CSS Modules')}
              {checkRow('useSass', 'Sass / SCSS')}
              {checkRow('useMiniCssExtract', 'MiniCssExtract')}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Assets</span>
              {checkRow('useImages', 'Images (PNG/JPG)')}
              {checkRow('useSvg', 'SVG')}
              {checkRow('useFonts', 'Fonts')}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Plugins</span>
              {checkRow('useHtmlPlugin', 'HtmlWebpackPlugin')}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">Dev</span>
              {checkRow('useSourceMaps', 'Source Maps')}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-400">Entry point</label>
              <input
                className="bg-white text-gray-900 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gray-900"
                value={opts.entryPoint}
                onChange={(e) => set('entryPoint', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-400">Output directory</label>
              <input
                className="bg-white text-gray-900 border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-gray-900"
                value={opts.outputDir}
                onChange={(e) => set('outputDir', e.target.value)}
              />
            </div>
          </div>
        </div>
      }
    />
  );
}
