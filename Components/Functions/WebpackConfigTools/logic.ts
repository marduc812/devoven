export interface WebpackOptions {
  useTypeScript: boolean;
  useReact: boolean;
  useBabel: boolean;
  useCssModules: boolean;
  useSass: boolean;
  useImages: boolean;
  useSvg: boolean;
  useFonts: boolean;
  useHtmlPlugin: boolean;
  useMiniCssExtract: boolean;
  useSourceMaps: boolean;
  mode: 'development' | 'production' | 'none';
  entryPoint: string;
  outputDir: string;
}

export const DEFAULT_OPTIONS: WebpackOptions = {
  useTypeScript: false,
  useReact: false,
  useBabel: false,
  useCssModules: false,
  useSass: false,
  useImages: false,
  useSvg: false,
  useFonts: false,
  useHtmlPlugin: true,
  useMiniCssExtract: false,
  useSourceMaps: true,
  mode: 'development',
  entryPoint: './src/index.js',
  outputDir: 'dist',
};

function indent(n: number): string {
  return '  '.repeat(n);
}

function generatePackagesComment(opts: WebpackOptions): string {
  const packages: string[] = ['webpack', 'webpack-cli'];
  if (opts.useTypeScript) packages.push('typescript', 'ts-loader');
  if (opts.useReact && !opts.useTypeScript) packages.push('@babel/preset-react');
  if (opts.useBabel || opts.useReact) packages.push('babel-loader', '@babel/core', '@babel/preset-env');
  if (opts.useReact) packages.push('react', 'react-dom');
  if (opts.useTypeScript && opts.useReact) packages.push('@types/react', '@types/react-dom');
  if (opts.useCssModules || opts.useSass) packages.push('css-loader', 'style-loader');
  if (opts.useSass) packages.push('sass-loader', 'sass');
  if (opts.useMiniCssExtract) {
    packages.push('mini-css-extract-plugin');
    // remove style-loader if extracting
  }
  if (opts.useHtmlPlugin) packages.push('html-webpack-plugin');
  if (opts.useImages || opts.useSvg || opts.useFonts) {
    // asset modules built into webpack 5
  }

  const devPackages = packages.filter(
    (p) => !['react', 'react-dom'].includes(p)
  );
  const prodPackages = packages.filter(
    (p) => ['react', 'react-dom'].includes(p)
  );

  const lines: string[] = ['// Install dependencies:'];
  if (devPackages.length > 0) lines.push(`// npm install -D ${devPackages.join(' ')}`);
  if (prodPackages.length > 0) lines.push(`// npm install ${prodPackages.join(' ')}`);

  return lines.join('\n');
}

export function generateWebpackConfig(opts: WebpackOptions): string {
  const lines: string[] = [];

  lines.push(generatePackagesComment(opts));
  lines.push('');
  lines.push("const path = require('path');");

  if (opts.useMiniCssExtract) {
    lines.push("const MiniCssExtractPlugin = require('mini-css-extract-plugin');");
  }
  if (opts.useHtmlPlugin) {
    lines.push("const HtmlWebpackPlugin = require('html-webpack-plugin');");
  }

  lines.push('');
  lines.push('module.exports = {');
  lines.push(`${indent(1)}mode: '${opts.mode}',`);

  // Entry
  const entry = opts.entryPoint || './src/index.js';
  lines.push(`${indent(1)}entry: '${entry}',`);

  // Output
  lines.push(`${indent(1)}output: {`);
  lines.push(`${indent(2)}path: path.resolve(__dirname, '${opts.outputDir || 'dist'}'),`);
  lines.push(`${indent(2)}filename: '${opts.mode === 'production' ? '[name].[contenthash].js' : 'bundle.js'}',`);
  if (opts.mode === 'production') {
    lines.push(`${indent(2)}clean: true,`);
  }
  lines.push(`${indent(1)}},`);

  // Source maps
  if (opts.useSourceMaps) {
    const devtool = opts.mode === 'production' ? 'source-map' : 'eval-cheap-module-source-map';
    lines.push(`${indent(1)}devtool: '${devtool}',`);
  }

  // Resolve extensions
  const extensions = ["'.js'"];
  if (opts.useTypeScript) extensions.push("'.ts'");
  if (opts.useReact && !opts.useTypeScript) extensions.push("'.jsx'");
  if (opts.useReact && opts.useTypeScript) extensions.push("'.tsx'");

  lines.push(`${indent(1)}resolve: {`);
  lines.push(`${indent(2)}extensions: [${extensions.join(', ')}],`);
  lines.push(`${indent(1)}},`);

  // Module rules
  lines.push(`${indent(1)}module: {`);
  lines.push(`${indent(2)}rules: [`);

  // JS/TS rule
  if (opts.useTypeScript) {
    const ext = opts.useReact ? '/\\.tsx?$/' : '/\\.ts$/';
    lines.push(`${indent(3)}{`);
    lines.push(`${indent(4)}test: ${ext},`);
    lines.push(`${indent(4)}use: 'ts-loader',`);
    lines.push(`${indent(4)}exclude: /node_modules/,`);
    lines.push(`${indent(3)}},`);
  } else if (opts.useBabel || opts.useReact) {
    const ext = opts.useReact ? '/\\.jsx?$/' : '/\\.js$/';
    lines.push(`${indent(3)}{`);
    lines.push(`${indent(4)}test: ${ext},`);
    lines.push(`${indent(4)}exclude: /node_modules/,`);
    lines.push(`${indent(4)}use: {`);
    lines.push(`${indent(5)}loader: 'babel-loader',`);
    lines.push(`${indent(5)}options: {`);
    const presets = ["'@babel/preset-env'"];
    if (opts.useReact) presets.push("'@babel/preset-react'");
    lines.push(`${indent(6)}presets: [${presets.join(', ')}],`);
    lines.push(`${indent(5)}},`);
    lines.push(`${indent(4)}},`);
    lines.push(`${indent(3)}},`);
  }

  // CSS rule
  if (opts.useCssModules || opts.useSass) {
    const testExt = opts.useSass ? '/\\.(css|scss|sass)$/' : '/\\.css$/';
    const styleLoader = opts.useMiniCssExtract ? 'MiniCssExtractPlugin.loader' : "'style-loader'";
    const cssModulesOpt = opts.useCssModules
      ? `{
${indent(6)}loader: 'css-loader',
${indent(6)}options: { modules: true },
${indent(5)}}`
      : "'css-loader'";

    lines.push(`${indent(3)}{`);
    lines.push(`${indent(4)}test: ${testExt},`);
    lines.push(`${indent(4)}use: [`);
    lines.push(`${indent(5)}${styleLoader},`);
    lines.push(`${indent(5)}${cssModulesOpt},`);
    if (opts.useSass) {
      lines.push(`${indent(5)}'sass-loader',`);
    }
    lines.push(`${indent(4)}],`);
    lines.push(`${indent(3)}},`);
  }

  // Images rule
  if (opts.useImages) {
    lines.push(`${indent(3)}{`);
    lines.push(`${indent(4)}test: /\\.(png|jpg|jpeg|gif|webp)$/i,`);
    lines.push(`${indent(4)}type: 'asset/resource',`);
    lines.push(`${indent(3)}},`);
  }

  // SVG rule
  if (opts.useSvg) {
    lines.push(`${indent(3)}{`);
    lines.push(`${indent(4)}test: /\\.svg$/i,`);
    lines.push(`${indent(4)}type: 'asset/inline',`);
    lines.push(`${indent(3)}},`);
  }

  // Fonts rule
  if (opts.useFonts) {
    lines.push(`${indent(3)}{`);
    lines.push(`${indent(4)}test: /\\.(woff|woff2|eot|ttf|otf)$/i,`);
    lines.push(`${indent(4)}type: 'asset/resource',`);
    lines.push(`${indent(3)}},`);
  }

  lines.push(`${indent(2)}],`);
  lines.push(`${indent(1)}},`);

  // Plugins
  const hasPlugins = opts.useHtmlPlugin || opts.useMiniCssExtract;
  if (hasPlugins) {
    lines.push(`${indent(1)}plugins: [`);
    if (opts.useHtmlPlugin) {
      lines.push(`${indent(2)}new HtmlWebpackPlugin({`);
      lines.push(`${indent(3)}template: './src/index.html',`);
      lines.push(`${indent(3)}title: 'My App',`);
      lines.push(`${indent(2)}},),`);
    }
    if (opts.useMiniCssExtract) {
      lines.push(`${indent(2)}new MiniCssExtractPlugin({`);
      lines.push(`${indent(3)}filename: '${opts.mode === 'production' ? '[name].[contenthash].css' : '[name].css'}',`);
      lines.push(`${indent(2)}},),`);
    }
    lines.push(`${indent(1)}],`);
  }

  // Dev server hint
  if (opts.mode === 'development') {
    lines.push(`${indent(1)}// devServer: { port: 3000, hot: true },`);
  }

  lines.push('};');

  return lines.join('\n');
}

export function getRequiredPackages(opts: WebpackOptions): { dev: string[]; prod: string[] } {
  const dev: string[] = ['webpack', 'webpack-cli'];
  const prod: string[] = [];

  if (opts.useTypeScript) dev.push('typescript', 'ts-loader');
  if (opts.useBabel || (opts.useReact && !opts.useTypeScript)) {
    dev.push('babel-loader', '@babel/core', '@babel/preset-env');
  }
  if (opts.useReact && !opts.useTypeScript) dev.push('@babel/preset-react');
  if (opts.useReact && opts.useTypeScript) dev.push('@types/react', '@types/react-dom');
  if (opts.useReact) { prod.push('react', 'react-dom'); }
  if (opts.useCssModules || opts.useSass) dev.push('css-loader', 'style-loader');
  if (opts.useSass) dev.push('sass-loader', 'sass');
  if (opts.useMiniCssExtract) dev.push('mini-css-extract-plugin');
  if (opts.useHtmlPlugin) dev.push('html-webpack-plugin');

  return { dev, prod };
}
