import { NextRequest, NextResponse } from 'next/server';
import { sanitizeAnalyticsUrl } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  let body: { message?: unknown; email?: unknown; website?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot: bots fill this; silently accept and drop.
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ ok: false, error: 'Message is required.' }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ ok: false, error: 'Message is too long.' }, { status: 400 });
  }
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : '';

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // The expected state for a local checkout, not a fault. Say so plainly
    // rather than telling the sender to try again at something that cannot work.
    console.warn('Feedback: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID unset; form disabled');
    return NextResponse.json(
      { ok: false, error: 'Feedback is not configured on this instance.' },
      { status: 503 },
    );
  }

  // Cap attacker-controllable headers so the assembled message stays well under
  // Telegram's 4096-char sendMessage limit (message itself is already capped at 2000).
  // The referer is a tool page, and tool state travels in the query string, so
  // the raw header can carry whatever the sender pasted into the tool. Only the
  // page they were on is useful here.
  const referer = sanitizeAnalyticsUrl(
    (request.headers.get('referer') || 'unknown').slice(0, 300),
  );
  const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 300);
  const text =
    `🛎️ New DevOven feedback\n\n` +
    `${message}\n\n` +
    `✉️ ${email || '(no email)'}\n` +
    `🔗 ${referer}\n` +
    `🖥️ ${userAgent}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!tgRes.ok) {
      console.error('Feedback: Telegram returned', tgRes.status);
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  } catch (err) {
    // The request URL embeds the bot token, and a thrown error is free to carry
    // that URL in its message, so strip the token before it reaches a log.
    const detail = err instanceof Error ? err.message : 'unknown error';
    console.error('Feedback: delivery failed:', detail.split(token).join('<redacted>'));
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
