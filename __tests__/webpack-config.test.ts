import {
  DEFAULT_OPTIONS,
  generateWebpackConfig,
  getRequiredPackages,
  WebpackOptions,
} from '@/Components/Functions/WebpackConfigTools/logic';

describe('generateWebpackConfig', () => {
  it('returns a non-empty string', () => {
    const result = generateWebpackConfig({ ...DEFAULT_OPTIONS });
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains module.exports', () => {
    const result = generateWebpackConfig({ ...DEFAULT_OPTIONS });
    expect(result).toContain('module.exports');
  });

  it('includes entry point', () => {
    const result = generateWebpackConfig({ ...DEFAULT_OPTIONS });
    expect(result).toContain('./src/index.js');
  });

  it('includes output directory', () => {
    const result = generateWebpackConfig({ ...DEFAULT_OPTIONS });
    expect(result).toContain("'dist'");
  });

  it('includes ts-loader when useTypeScript is true', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, useTypeScript: true };
    const result = generateWebpackConfig(opts);
    expect(result).toContain('ts-loader');
  });

  it('includes babel-loader when useBabel is true', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, useBabel: true };
    const result = generateWebpackConfig(opts);
    expect(result).toContain('babel-loader');
  });

  it('includes css-loader when useCssModules is true', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, useCssModules: true };
    const result = generateWebpackConfig(opts);
    expect(result).toContain('css-loader');
  });

  it('includes sass-loader when useSass is true', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, useSass: true };
    const result = generateWebpackConfig(opts);
    expect(result).toContain('sass-loader');
  });

  it('includes HtmlWebpackPlugin when useHtmlPlugin is true', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, useHtmlPlugin: true };
    const result = generateWebpackConfig(opts);
    expect(result).toContain('HtmlWebpackPlugin');
  });

  it('includes MiniCssExtractPlugin when useMiniCssExtract is true', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, useMiniCssExtract: true };
    const result = generateWebpackConfig(opts);
    expect(result).toContain('MiniCssExtractPlugin');
  });

  it('includes image rule when useImages is true', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, useImages: true };
    const result = generateWebpackConfig(opts);
    expect(result).toContain('asset/resource');
  });

  it('sets mode correctly', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, mode: 'production' };
    const result = generateWebpackConfig(opts);
    expect(result).toContain("mode: 'production'");
  });

  it('uses contenthash in production mode', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, mode: 'production' };
    const result = generateWebpackConfig(opts);
    expect(result).toContain('contenthash');
  });

  it('includes .ts extension when TypeScript is enabled', () => {
    const opts: WebpackOptions = { ...DEFAULT_OPTIONS, useTypeScript: true };
    const result = generateWebpackConfig(opts);
    expect(result).toContain("'.ts'");
  });
});

describe('getRequiredPackages', () => {
  it('always includes webpack and webpack-cli', () => {
    const { dev } = getRequiredPackages({ ...DEFAULT_OPTIONS });
    expect(dev).toContain('webpack');
    expect(dev).toContain('webpack-cli');
  });

  it('includes typescript and ts-loader when useTypeScript is true', () => {
    const { dev } = getRequiredPackages({ ...DEFAULT_OPTIONS, useTypeScript: true });
    expect(dev).toContain('typescript');
    expect(dev).toContain('ts-loader');
  });

  it('includes react and react-dom in prod when useReact is true', () => {
    const { prod } = getRequiredPackages({ ...DEFAULT_OPTIONS, useReact: true });
    expect(prod).toContain('react');
    expect(prod).toContain('react-dom');
  });

  it('includes mini-css-extract-plugin when useMiniCssExtract is true', () => {
    const { dev } = getRequiredPackages({ ...DEFAULT_OPTIONS, useMiniCssExtract: true });
    expect(dev).toContain('mini-css-extract-plugin');
  });

  it('includes html-webpack-plugin when useHtmlPlugin is true', () => {
    const { dev } = getRequiredPackages({ ...DEFAULT_OPTIONS, useHtmlPlugin: true });
    expect(dev).toContain('html-webpack-plugin');
  });
});
