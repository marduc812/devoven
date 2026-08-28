export type PrintWidth = 80 | 100 | 120 | 140;
export type TabWidth = 2 | 4;
export type TrailingComma = 'none' | 'es5' | 'all';
export type QuoteType = 'single' | 'double';
export type EndOfLine = 'lf' | 'crlf' | 'auto';
export type ProseWrap = 'preserve' | 'always' | 'never';

export interface PrettierOptions {
  printWidth: PrintWidth;
  tabWidth: TabWidth;
  useTabs: boolean;
  semi: boolean;
  singleQuote: boolean;
  quoteProps: 'as-needed' | 'consistent' | 'preserve';
  jsxSingleQuote: boolean;
  trailingComma: TrailingComma;
  bracketSpacing: boolean;
  bracketSameLine: boolean;
  arrowParens: 'always' | 'avoid';
  endOfLine: EndOfLine;
  proseWrap: ProseWrap;
}

export const DEFAULT_OPTIONS: PrettierOptions = {
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: false,
  quoteProps: 'as-needed',
  jsxSingleQuote: false,
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  proseWrap: 'preserve',
};

export interface OptionMeta {
  key: keyof PrettierOptions;
  label: string;
  description: string;
  default: string;
  effect: string;
}

export function generatePrettierConfig(opts: PrettierOptions): string {
  const config: Record<string, unknown> = {};

  if (opts.printWidth !== DEFAULT_OPTIONS.printWidth) config.printWidth = opts.printWidth;
  if (opts.tabWidth !== DEFAULT_OPTIONS.tabWidth) config.tabWidth = opts.tabWidth;
  if (opts.useTabs !== DEFAULT_OPTIONS.useTabs) config.useTabs = opts.useTabs;
  if (opts.semi !== DEFAULT_OPTIONS.semi) config.semi = opts.semi;
  if (opts.singleQuote !== DEFAULT_OPTIONS.singleQuote) config.singleQuote = opts.singleQuote;
  if (opts.quoteProps !== DEFAULT_OPTIONS.quoteProps) config.quoteProps = opts.quoteProps;
  if (opts.jsxSingleQuote !== DEFAULT_OPTIONS.jsxSingleQuote) config.jsxSingleQuote = opts.jsxSingleQuote;
  if (opts.trailingComma !== DEFAULT_OPTIONS.trailingComma) config.trailingComma = opts.trailingComma;
  if (opts.bracketSpacing !== DEFAULT_OPTIONS.bracketSpacing) config.bracketSpacing = opts.bracketSpacing;
  if (opts.bracketSameLine !== DEFAULT_OPTIONS.bracketSameLine) config.bracketSameLine = opts.bracketSameLine;
  if (opts.arrowParens !== DEFAULT_OPTIONS.arrowParens) config.arrowParens = opts.arrowParens;
  if (opts.endOfLine !== DEFAULT_OPTIONS.endOfLine) config.endOfLine = opts.endOfLine;
  if (opts.proseWrap !== DEFAULT_OPTIONS.proseWrap) config.proseWrap = opts.proseWrap;

  if (Object.keys(config).length === 0) {
    return JSON.stringify(config, null, 2) + '\n// All values are Prettier defaults';
  }

  return JSON.stringify(config, null, 2);
}

export function generateFullConfig(opts: PrettierOptions): string {
  const config: Record<string, unknown> = {
    printWidth: opts.printWidth,
    tabWidth: opts.tabWidth,
    useTabs: opts.useTabs,
    semi: opts.semi,
    singleQuote: opts.singleQuote,
    quoteProps: opts.quoteProps,
    jsxSingleQuote: opts.jsxSingleQuote,
    trailingComma: opts.trailingComma,
    bracketSpacing: opts.bracketSpacing,
    bracketSameLine: opts.bracketSameLine,
    arrowParens: opts.arrowParens,
    endOfLine: opts.endOfLine,
    proseWrap: opts.proseWrap,
  };
  return JSON.stringify(config, null, 2);
}

export function getExampleCode(opts: PrettierOptions): string {
  const quote = opts.singleQuote ? "'" : '"';
  const semi = opts.semi ? ';' : '';
  const indent = opts.useTabs ? '\t' : ' '.repeat(opts.tabWidth);
  const trailing = opts.trailingComma !== 'none' ? ',' : '';
  const spacing = opts.bracketSpacing ? ' ' : '';

  return `const greet = (name${opts.arrowParens === 'avoid' ? '' : ''}) => {
${indent}return ${quote}Hello, ${quote} + name${semi}
}${semi}

const config = {${spacing}host: ${quote}localhost${quote}, port: 3000${trailing}${spacing}}${semi}

const items = [
${indent}${quote}alpha${quote},
${indent}${quote}beta${quote}${trailing}
]${semi}`;
}
