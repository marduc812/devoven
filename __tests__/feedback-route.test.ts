import { POST } from '@/app/api/feedback/route';
import { NextRequest } from 'next/server';

const FAKE_TOKEN = '1234567890:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const FAKE_CHAT_ID = '-1001234567890';

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

const originalToken = process.env.TELEGRAM_BOT_TOKEN;
const originalChatId = process.env.TELEGRAM_CHAT_ID;

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

beforeEach(() => {
  global.fetch = jest.fn();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  restore('TELEGRAM_BOT_TOKEN', originalToken);
  restore('TELEGRAM_CHAT_ID', originalChatId);
});

describe('POST /api/feedback – validation', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = FAKE_TOKEN;
    process.env.TELEGRAM_CHAT_ID = FAKE_CHAT_ID;
  });

  it('rejects a body that is not JSON', async () => {
    const req = new NextRequest('http://localhost/api/feedback', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });
    expect((await POST(req)).status).toBe(400);
  });

  it('rejects an empty message', async () => {
    const res = await POST(makeRequest({ message: '   ' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/required/i);
  });

  it('rejects a message over 2000 characters', async () => {
    const res = await POST(makeRequest({ message: 'a'.repeat(2001) }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/too long/i);
  });

  it('drops honeypot submissions without calling Telegram', async () => {
    const res = await POST(makeRequest({ message: 'hi', website: 'spam.example' }));
    expect(res.status).toBe(200);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /api/feedback – unconfigured instance', () => {
  it('answers 503 with a clear reason when the credentials are unset', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    const res = await POST(makeRequest({ message: 'hello' }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/not configured/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('needs both credentials, not just one', async () => {
    process.env.TELEGRAM_BOT_TOKEN = FAKE_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;

    expect((await POST(makeRequest({ message: 'hello' }))).status).toBe(503);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /api/feedback – delivery', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = FAKE_TOKEN;
    process.env.TELEGRAM_CHAT_ID = FAKE_CHAT_ID;
  });

  it('posts the message to Telegram and reports success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, text: async () => '' });

    const res = await POST(makeRequest(
      { message: 'found a bug', email: 'someone@example.com' },
      { referer: 'http://localhost/encoding/base64-encode', 'user-agent': 'Firefox/141' },
    ));

    expect(res.status).toBe(200);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe(`https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage`);
    const sent = JSON.parse(init.body);
    expect(sent.chat_id).toBe(FAKE_CHAT_ID);
    expect(sent.text).toContain('found a bug');
    expect(sent.text).toContain('someone@example.com');
  });

  it('caps referer and user-agent so the Telegram message cannot be blown past its limit', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, text: async () => '' });

    await POST(makeRequest(
      { message: 'a'.repeat(2000) },
      { referer: 'r'.repeat(5000), 'user-agent': 'u'.repeat(5000) },
    ));

    const sent = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sent.text.length).toBeLessThan(4096);
  });

  it('returns 502 when Telegram rejects the send', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' });
    expect((await POST(makeRequest({ message: 'hi' }))).status).toBe(502);
  });

  it('returns 502 when the request to Telegram throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('getaddrinfo ENOTFOUND'));
    expect((await POST(makeRequest({ message: 'hi' }))).status).toBe(502);
  });
});

describe('POST /api/feedback – the bot token never reaches a log', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = FAKE_TOKEN;
    process.env.TELEGRAM_CHAT_ID = FAKE_CHAT_ID;
  });

  function loggedText() {
    const calls = [
      ...(console.warn as jest.Mock).mock.calls,
      ...(console.error as jest.Mock).mock.calls,
    ];
    return calls.flat().map((a) => (a instanceof Error ? a.stack ?? a.message : String(a))).join('\n');
  }

  it('keeps the token out of the log when Telegram returns an error status', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401, text: async () => `bot${FAKE_TOKEN} is invalid` });

    await POST(makeRequest({ message: 'hi' }));
    expect(loggedText()).not.toContain(FAKE_TOKEN);
  });

  it('keeps the token out of the log when the thrown error carries the request URL', async () => {
    // undici is free to attach the URL it was called with, and that URL embeds
    // the token. The route must log the message only, never the error object.
    const err = new Error(`request to https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage failed`);
    (err as Error & { url?: string }).url = `https://api.telegram.org/bot${FAKE_TOKEN}/sendMessage`;
    (global.fetch as jest.Mock).mockRejectedValue(err);

    await POST(makeRequest({ message: 'hi' }));
    expect(loggedText()).not.toContain(FAKE_TOKEN);
  });

  it('never puts the token in a response body', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error(`bot${FAKE_TOKEN} unreachable`));

    const res = await POST(makeRequest({ message: 'hi' }));
    expect(await res.text()).not.toContain(FAKE_TOKEN);
  });
});
