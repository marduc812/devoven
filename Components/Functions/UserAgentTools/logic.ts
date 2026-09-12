// ─── User-Agent breakdown ─────────────────────────────────────────────────────
// parseUserAgent (NetworkTools/logic.ts) answers "what is this?" and is what the
// Blocks operation calls. This module answers the more interesting question the
// tool page asks: what does each piece of the string actually say, and which
// pieces are thirty years of compatibility lies that mean nothing at all.

import { ParsedUserAgent, parseUserAgent } from '../NetworkTools/logic';

export type { ParsedUserAgent };
export { parseUserAgent };

export type UaToken = {
  /** The piece as it appears in the string. */
  text: string;
  /** A product token like `Chrome/120.0.0.0`, or one `;`-separated part of a comment. */
  kind: 'product' | 'comment';
  /** What it says, or why it is there when it says nothing. */
  note: string;
  /**
   * Boilerplate the browser sends whatever it is: the Mozilla prefix, a Safari
   * token on a browser that is not Safari, a frozen version number.
   */
  legacy: boolean;
};

type Rule = { match: RegExp; note: (m: RegExpMatchArray) => string; legacy?: boolean };

const productRules: Rule[] = [
  {
    match: /^Mozilla\/(.+)$/i,
    note: () => 'Every browser claims to be Netscape. It has meant nothing since 1998',
    legacy: true,
  },
  { match: /^Chrome\/(.+)$/i, note: (m) => `Chromium ${m[1]}. Everything after the major version reads 0` },
  { match: /^Chromium\/(.+)$/i, note: (m) => `Chromium ${m[1]}, built by someone other than Google` },
  { match: /^CriOS\/(.+)$/i, note: (m) => `Chrome ${m[1]} on iOS, which is WebKit underneath` },
  { match: /^FxiOS\/(.+)$/i, note: (m) => `Firefox ${m[1]} on iOS, which is WebKit underneath` },
  { match: /^Edg\/(.+)$/i, note: (m) => `Edge ${m[1]}. The token lost its final "e" so old sniffers miss it` },
  { match: /^EdgA\/(.+)$/i, note: (m) => `Edge ${m[1]} on Android` },
  { match: /^EdgiOS\/(.+)$/i, note: (m) => `Edge ${m[1]} on iOS` },
  { match: /^OPR\/(.+)$/i, note: (m) => `Opera ${m[1]}. It dropped the name "Opera" in 2013` },
  { match: /^Vivaldi\/(.+)$/i, note: (m) => `Vivaldi ${m[1]}` },
  { match: /^SamsungBrowser\/(.+)$/i, note: (m) => `Samsung Internet ${m[1]}` },
  { match: /^Firefox\/(.+)$/i, note: (m) => `Firefox ${m[1]}` },
  { match: /^Version\/(.+)$/i, note: (m) => `Safari ${m[1]}. This is the real version, not the Safari token` },
  {
    match: /^Safari\/(.+)$/i,
    note: (m) => `WebKit build ${m[1]}, not a Safari version`,
  },
  {
    match: /^AppleWebKit\/(.+)$/i,
    note: (m) => `WebKit build ${m[1]}. Chromium reports 537.36 forever`,
  },
  { match: /^Gecko\/(.+)$/i, note: () => 'Firefox freezes this build date at 20100101', legacy: true },
  { match: /^Trident\/(.+)$/i, note: (m) => `Internet Explorer's engine, version ${m[1]}` },
  { match: /^Mobile\/(.+)$/i, note: (m) => `iOS build ${m[1]}` },
  { match: /^Mobile$/i, note: () => 'A phone. Chrome on Android says this instead of a device name' },
  { match: /^curl\/(.+)$/i, note: (m) => `curl ${m[1]}, not a browser` },
  { match: /^Wget\/(.+)$/i, note: (m) => `Wget ${m[1]}, not a browser` },
  { match: /^python-requests\/(.+)$/i, note: (m) => `The Python requests library, version ${m[1]}` },
  { match: /^Go-http-client\/(.+)$/i, note: (m) => `Go's standard HTTP client, protocol ${m[1]}` },
  { match: /^PostmanRuntime\/(.+)$/i, note: (m) => `Postman ${m[1]}` },
  { match: /^Googlebot\/(.+)$/i, note: (m) => `Google's crawler, version ${m[1]}` },
  { match: /^bingbot\/(.+)$/i, note: (m) => `Microsoft's crawler, version ${m[1]}` },
];

const WINDOWS_NT: Record<string, string> = {
  '10.0': 'Windows 10 or 11. Microsoft never raised the NT version for 11',
  '6.3': 'Windows 8.1',
  '6.2': 'Windows 8',
  '6.1': 'Windows 7',
  '6.0': 'Windows Vista',
  '5.1': 'Windows XP',
};

const commentRules: Rule[] = [
  { match: /^Windows NT ([\d.]+)$/i, note: (m) => WINDOWS_NT[m[1]] ?? `Windows NT ${m[1]}` },
  { match: /^Windows Phone ([\d.]+)$/i, note: (m) => `Windows Phone ${m[1]}` },
  { match: /^(Win64|WOW64|x64|x86_64|amd64)$/i, note: () => '64-bit' },
  { match: /^Macintosh$/i, note: () => 'A Mac, or an iPad asking for the desktop site' },
  {
    match: /^Intel Mac OS X ([\d._]+)$/i,
    note: (m) =>
      m[1].startsWith('10_15') || m[1].startsWith('10.15')
        ? 'macOS, frozen at 10.15.7 since Safari 14 whatever the real version is'
        : `macOS ${m[1].replace(/_/g, '.')}`,
  },
  { match: /^iPhone$/i, note: () => 'An iPhone' },
  { match: /^iPad$/i, note: () => 'An iPad asking for the mobile site' },
  { match: /^CPU (?:iPhone )?OS ([\d_]+) like Mac OS X$/i, note: (m) => `iOS ${m[1].replace(/_/g, '.')}` },
  { match: /^Android ([\d.]+)$/i, note: (m) => `Android ${m[1]}` },
  { match: /^Linux(?: (.+))?$/i, note: (m) => (m[1] ? `Linux on ${m[1]}` : 'Linux') },
  { match: /^X11$/i, note: () => 'A desktop Unix running X11, said whether or not it is', legacy: true },
  { match: /^rv:([\d.]+)$/i, note: (m) => `Gecko revision ${m[1]}, which is Firefox's real version` },
  { match: /^KHTML, like Gecko$/i, note: () => "KHTML is WebKit's ancestor. \"like Gecko\" was aimed at 2003 servers", legacy: true },
  { match: /^compatible$/i, note: () => 'A claim to be compatible with whatever comes next', legacy: true },
  { match: /^Build\/(.+)$/i, note: (m) => `Android build ${m[1]}` },
  { match: /^\+?(https?:\/\/\S+)$/i, note: (m) => `Where the operator documents this bot: ${m[1]}` },
  { match: /^Ubuntu$/i, note: () => 'Ubuntu, which patches Firefox to say so' },
];

function describe(text: string, rules: Rule[]): { note: string; legacy: boolean } {
  for (const rule of rules) {
    const m = text.match(rule.match);
    if (m) return { note: rule.note(m), legacy: rule.legacy ?? false };
  }
  // A comment part shaped like Name/Version is a product token that happens to
  // sit inside the brackets, which is exactly where crawlers put theirs.
  if (rules === commentRules && /^[\w.-]+\/\S+$/.test(text)) return describe(text, productRules);
  return { note: '', legacy: false };
}

/**
 * Split a user agent into its product tokens and the parts of its comments,
 * in the order they appear. Comments are the parenthesised groups; RFC 9110
 * allows them to nest, so the depth is tracked rather than matching the first
 * closing bracket.
 */
export function tokenizeUserAgent(ua: string): UaToken[] {
  const tokens: UaToken[] = [];
  const push = (raw: string, kind: UaToken['kind']) => {
    const text = raw.trim();
    if (!text) return;
    const { note, legacy } = describe(text, kind === 'product' ? productRules : commentRules);
    tokens.push({ text, kind, note, legacy });
  };

  let buffer = '';
  let depth = 0;
  for (const char of ua) {
    if (char === '(' && depth === 0) {
      push(buffer, 'product');
      buffer = '';
      depth = 1;
    } else if (char === '(') {
      depth++;
      buffer += char;
    } else if (char === ')' && depth === 1) {
      for (const part of buffer.split(';')) push(part, 'comment');
      buffer = '';
      depth = 0;
    } else if (char === ')') {
      depth--;
      buffer += char;
    } else if (/\s/.test(char) && depth === 0) {
      push(buffer, 'product');
      buffer = '';
    } else {
      buffer += char;
    }
  }
  if (depth === 0) push(buffer, 'product');
  else for (const part of buffer.split(';')) push(part, 'comment');

  // A Safari token on something that is not Safari is the oldest lie in the
  // string, but only once the rest of the tokens say who is really talking.
  const impostor = tokens.some((t) => /^(Chrome|Chromium|Edg|EdgA|OPR|Vivaldi|SamsungBrowser)\//i.test(t.text));
  for (const token of tokens) {
    if (impostor && /^Safari\//i.test(token.text)) {
      token.note = 'Not Safari. The token is kept so old sniffers serve the WebKit page';
      token.legacy = true;
    }
  }
  return tokens;
}

/**
 * The crawlers people actually paste in, keyed by the token they send. Naming
 * one is usually the whole reason a user agent gets looked at: parseUserAgent
 * says "Chrome" for most of them, because most of them really do claim to be
 * Chrome in every token but this one.
 */
const CRAWLERS: [RegExp, string][] = [
  [/Googlebot/i, 'Googlebot'],
  [/Google-Extended/i, 'Google-Extended'],
  [/AdsBot-Google/i, 'AdsBot-Google'],
  [/bingbot/i, 'Bingbot'],
  [/DuckDuckBot/i, 'DuckDuckBot'],
  [/Baiduspider/i, 'Baiduspider'],
  [/YandexBot/i, 'YandexBot'],
  [/Applebot/i, 'Applebot'],
  [/GPTBot/i, 'GPTBot'],
  [/ClaudeBot|Claude-Web|anthropic-ai/i, 'ClaudeBot'],
  [/PerplexityBot/i, 'PerplexityBot'],
  [/Amazonbot/i, 'Amazonbot'],
  [/Bytespider/i, 'Bytespider'],
  [/AhrefsBot/i, 'AhrefsBot'],
  [/SemrushBot/i, 'SemrushBot'],
  [/MJ12bot/i, 'MJ12bot'],
  [/facebookexternalhit/i, 'Facebook link preview'],
  [/Twitterbot/i, 'Twitterbot'],
  [/Slackbot/i, 'Slackbot'],
  [/LinkedInBot/i, 'LinkedInBot'],
  [/Discordbot/i, 'Discordbot'],
  [/TelegramBot/i, 'TelegramBot'],
  [/WhatsApp/i, 'WhatsApp link preview'],
];

/** The crawler this string names, or null when nothing recognisable does. */
export function crawlerName(ua: string): string | null {
  for (const [pattern, name] of CRAWLERS) if (pattern.test(ua)) return name;
  return null;
}

/** Caveats worth saying out loud next to the answer. */
export function userAgentWarnings(ua: string, parsed: ParsedUserAgent): string[] {
  const warnings: string[] = [];
  const crawler = crawlerName(ua);

  if (crawler) {
    warnings.push(
      `Anything can put "${crawler}" in a header. Confirm it with a reverse DNS lookup on the requesting IP, not with this string.`,
    );
    // The rest is about which browser a person is using, which is not the
    // question when a crawler is on the line.
    return warnings;
  }

  if (parsed.browser === 'Unknown') {
    warnings.push('No token in this string names a browser anyone would recognise.');
  }
  if (parsed.browser === 'Chrome' && /chrome\/\d+\.0\.0\.0/i.test(ua)) {
    warnings.push(
      'Chrome reports 0.0.0 after the major version on purpose, so the minor version here is not real.',
    );
  }
  if (parsed.browser === 'Chrome' && parsed.engine === 'Blink') {
    warnings.push(
      'Brave, Arc and most other Chromium browsers send this exact string, so "Chrome" may be any of them.',
    );
  }
  if (parsed.device === 'bot') {
    warnings.push('Anything can claim to be a crawler. Verify by reverse DNS, not by this string.');
  }
  return warnings;
}

export const UA_PRESETS: { label: string; value: string }[] = [
  {
    label: 'Chrome / Windows',
    value:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  {
    label: 'Safari / iPhone',
    value:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
  },
  {
    label: 'Firefox / macOS',
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  },
  {
    label: 'Samsung Internet',
    value:
      'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  },
  {
    label: 'Googlebot',
    value:
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  },
  { label: 'curl', value: 'curl/8.4.0' },
];
