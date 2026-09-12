import {
  UA_PRESETS,
  crawlerName,
  parseUserAgent,
  tokenizeUserAgent,
  userAgentWarnings,
} from '@/Components/Functions/UserAgentTools/logic';

const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
const SAMSUNG =
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36';
const CHROME_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1';
const GOOGLEBOT =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const textOf = (ua: string) => tokenizeUserAgent(ua).map((t) => t.text);
const noteFor = (ua: string, text: string) =>
  tokenizeUserAgent(ua).find((t) => t.text === text)?.note ?? '';

// ─── the browsers the old parser called Chrome ────────────────────────────────

describe('parseUserAgent, forks that keep the Chrome token', () => {
  it('names Samsung Internet rather than the Chrome it carries', () => {
    const r = parseUserAgent(SAMSUNG);
    expect(r.browser).toBe('Samsung Internet');
    expect(r.browserVersion).toBe('23.0');
    expect(r.os).toBe('Android');
    expect(r.device).toBe('mobile');
  });

  it('names Vivaldi', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Vivaldi/6.5';
    expect(parseUserAgent(ua).browser).toBe('Vivaldi');
  });

  it('reads Chrome on iOS as Chrome on WebKit, not Safari', () => {
    const r = parseUserAgent(CHROME_IOS);
    expect(r.browser).toBe('Chrome');
    expect(r.browserVersion).toBe('120.0.6099.119');
    expect(r.engine).toBe('WebKit');
    expect(r.os).toBe('iOS');
  });

  it('reads Firefox on iOS as Firefox', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/121.0 Mobile/15E148 Safari/605.1.15';
    expect(parseUserAgent(ua).browser).toBe('Firefox');
  });

  it('reads Edge on Android', () => {
    const ua =
      'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0';
    expect(parseUserAgent(ua).browser).toBe('Edge');
  });

  it('still reads plain desktop Chrome and Safari', () => {
    expect(parseUserAgent(CHROME_WIN).browser).toBe('Chrome');
    expect(parseUserAgent(SAFARI_IOS).browser).toBe('Safari');
    expect(parseUserAgent(SAFARI_IOS).browserVersion).toBe('17.1');
  });
});

// ─── tokenizer ────────────────────────────────────────────────────────────────

describe('tokenizeUserAgent', () => {
  it('splits products from the parts of a comment', () => {
    expect(textOf(CHROME_WIN)).toEqual([
      'Mozilla/5.0',
      'Windows NT 10.0',
      'Win64',
      'x64',
      'AppleWebKit/537.36',
      'KHTML, like Gecko',
      'Chrome/120.0.0.0',
      'Safari/537.36',
    ]);
  });

  it('keeps the comma inside "KHTML, like Gecko"', () => {
    const khtml = tokenizeUserAgent(CHROME_WIN).find((t) => t.text.startsWith('KHTML'));
    expect(khtml?.kind).toBe('comment');
    expect(khtml?.legacy).toBe(true);
  });

  it('calls the Safari token on a Chromium browser what it is', () => {
    expect(noteFor(CHROME_WIN, 'Safari/537.36')).toMatch(/Not Safari/);
    expect(tokenizeUserAgent(CHROME_WIN).find((t) => t.text === 'Safari/537.36')?.legacy).toBe(true);
  });

  it('leaves the Safari token alone on actual Safari', () => {
    expect(noteFor(SAFARI_IOS, 'Safari/604.1')).toMatch(/WebKit build/);
    expect(noteFor(SAFARI_IOS, 'Version/17.1')).toMatch(/Safari 17\.1/);
  });

  it('marks the Mozilla prefix as the fossil it is', () => {
    const mozilla = tokenizeUserAgent(SAFARI_IOS)[0];
    expect(mozilla.text).toBe('Mozilla/5.0');
    expect(mozilla.legacy).toBe(true);
  });

  it('explains a product token that is hiding inside a comment', () => {
    expect(noteFor(GOOGLEBOT, 'Googlebot/2.1')).toMatch(/crawler/);
    expect(noteFor(GOOGLEBOT, '+http://www.google.com/bot.html')).toMatch(/documents this bot/);
  });

  it('decodes the OS versions people cannot read at a glance', () => {
    expect(noteFor(CHROME_WIN, 'Windows NT 10.0')).toMatch(/Windows 10 or 11/);
    expect(noteFor(SAFARI_IOS, 'CPU iPhone OS 17_1 like Mac OS X')).toBe('iOS 17.1');
    expect(noteFor(SAMSUNG, 'Android 13')).toBe('Android 13');
  });

  it('says nothing rather than guessing at a device model', () => {
    expect(noteFor(SAMSUNG, 'SM-S918B')).toBe('');
  });

  it('survives an unbalanced bracket', () => {
    expect(textOf('Mozilla/5.0 (Windows NT 10.0; Win64')).toEqual([
      'Mozilla/5.0',
      'Windows NT 10.0',
      'Win64',
    ]);
  });

  it('handles a string with no comment at all', () => {
    expect(textOf('curl/8.4.0')).toEqual(['curl/8.4.0']);
    expect(noteFor('curl/8.4.0', 'curl/8.4.0')).toMatch(/not a browser/);
  });

  it('returns nothing for an empty string', () => {
    expect(tokenizeUserAgent('')).toEqual([]);
  });
});

// ─── warnings ─────────────────────────────────────────────────────────────────

describe('userAgentWarnings', () => {
  it('warns that Chrome could be any Chromium browser', () => {
    const warnings = userAgentWarnings(CHROME_WIN, parseUserAgent(CHROME_WIN));
    expect(warnings.join(' ')).toMatch(/Brave/);
    expect(warnings.join(' ')).toMatch(/0\.0\.0/);
  });

  it('does not blame Safari for Chrome\'s frozen version', () => {
    expect(userAgentWarnings(SAFARI_IOS, parseUserAgent(SAFARI_IOS))).toEqual([]);
  });

  it('tells you not to trust a crawler that says it is one', () => {
    expect(userAgentWarnings(GOOGLEBOT, parseUserAgent(GOOGLEBOT)).join(' ')).toMatch(/reverse DNS/);
  });

  it('says so when nothing in the string names a browser', () => {
    const ua = 'SomeInternalAgent/1.0';
    expect(userAgentWarnings(ua, parseUserAgent(ua)).join(' ')).toMatch(/names a browser/);
  });
});

// ─── presets ──────────────────────────────────────────────────────────────────

describe('UA_PRESETS', () => {
  it('every preset parses to the browser its label promises', () => {
    const expected: Record<string, string> = {
      'Chrome / Windows': 'Chrome',
      'Safari / iPhone': 'Safari',
      'Firefox / macOS': 'Firefox',
      'Samsung Internet': 'Samsung Internet',
      Googlebot: 'Chrome',
      curl: 'Unknown',
    };
    for (const preset of UA_PRESETS) {
      expect(parseUserAgent(preset.value).browser).toBe(expected[preset.label]);
    }
  });

  it('reads the Googlebot preset as a bot', () => {
    const bot = UA_PRESETS.find((p) => p.label === 'Googlebot')!;
    expect(parseUserAgent(bot.value).device).toBe('bot');
  });
});

// ─── crawlers ─────────────────────────────────────────────────────────────────

describe('crawlerName', () => {
  it('names the crawler behind a string that otherwise reads as Chrome', () => {
    expect(parseUserAgent(GOOGLEBOT).browser).toBe('Chrome');
    expect(crawlerName(GOOGLEBOT)).toBe('Googlebot');
  });

  it('names the AI and social fetchers people see in their logs', () => {
    expect(crawlerName('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko) compatible; GPTBot/1.2; +https://openai.com/gptbot')).toBe('GPTBot');
    expect(crawlerName('Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)')).toBe('ClaudeBot');
    expect(crawlerName('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)')).toBe('Facebook link preview');
    expect(crawlerName('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe('Bingbot');
  });

  it('does not see a crawler in an ordinary browser string', () => {
    expect(crawlerName(CHROME_WIN)).toBeNull();
    expect(crawlerName(SAFARI_IOS)).toBeNull();
  });

  it('drops the browser caveats once a crawler is named', () => {
    const warnings = userAgentWarnings(GOOGLEBOT, parseUserAgent(GOOGLEBOT));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/Googlebot/);
    expect(warnings[0]).toMatch(/reverse DNS/);
    expect(warnings.join(' ')).not.toMatch(/Brave/);
  });
});
