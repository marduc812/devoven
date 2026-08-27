// ─── Email Header Analyzer ────────────────────────────────────────────────────

export interface ParsedHeader {
  name: string;
  value: string;
  category: HeaderCategory;
  explanation: string;
}

export type HeaderCategory =
  | 'routing'
  | 'identity'
  | 'authentication'
  | 'content'
  | 'spam'
  | 'other';

export interface ReceivedHop {
  raw: string;
  from: string;
  by: string;
  date: string;
  timestamp: number | null;
  delay: number | null; // milliseconds since previous hop
}

export interface AuthResult {
  spf: string | null;
  dkim: string | null;
  dmarc: string | null;
  raw: string;
}

export interface EmailHeaderAnalysis {
  headers: ParsedHeader[];
  received: ReceivedHop[];
  authResults: AuthResult | null;
  deliveryMs: number | null;
  subject: string;
  from: string;
  to: string;
  date: string;
  messageId: string;
  errors: string[];
}

const HEADER_EXPLANATIONS: Record<string, { category: HeaderCategory; explanation: string }> = {
  from: { category: 'identity', explanation: 'The display name and email address of the sender.' },
  to: { category: 'identity', explanation: 'The primary recipient(s) of the email.' },
  cc: { category: 'identity', explanation: 'Carbon copy recipients visible to all recipients.' },
  bcc: { category: 'identity', explanation: 'Blind carbon copy recipients (should not appear in delivered headers).' },
  subject: { category: 'identity', explanation: 'The subject line of the email message.' },
  date: { category: 'identity', explanation: 'The date and time the message was composed.' },
  'message-id': { category: 'identity', explanation: 'A globally unique identifier for this message, used for threading.' },
  'reply-to': { category: 'identity', explanation: 'Address to send replies to, if different from From.' },
  'return-path': { category: 'routing', explanation: 'The bounce address — where delivery failure notices are sent.' },
  received: { category: 'routing', explanation: 'Added by each mail server that handles the message, showing the delivery path.' },
  'x-spam-score': { category: 'spam', explanation: 'Spam score assigned by the spam filter. Higher values indicate more likely spam.' },
  'x-spam-status': { category: 'spam', explanation: 'Whether the message was classified as spam and the score/tests used.' },
  'x-spam-flag': { category: 'spam', explanation: 'YES/NO indicator of whether the message was flagged as spam.' },
  'dkim-signature': { category: 'authentication', explanation: 'DKIM cryptographic signature allowing the recipient to verify the message was not altered and came from an authorized sender.' },
  'authentication-results': { category: 'authentication', explanation: 'Summary of SPF, DKIM, and DMARC authentication checks performed by the receiving mail server.' },
  'x-mailer': { category: 'other', explanation: 'The email client or software that composed and sent the message.' },
  'user-agent': { category: 'other', explanation: 'The mail client used to compose the message (alternative to X-Mailer).' },
  'mime-version': { category: 'content', explanation: 'Indicates this is a MIME-formatted message. Value should be 1.0.' },
  'content-type': { category: 'content', explanation: 'Describes the format of the message body (e.g. text/plain, text/html, multipart/mixed).' },
  'content-transfer-encoding': { category: 'content', explanation: 'The encoding used for the message body (e.g. quoted-printable, base64, 7bit).' },
  'x-originating-ip': { category: 'routing', explanation: 'The IP address of the original sender (may be the user\'s client IP).' },
  'x-google-dkim-signature': { category: 'authentication', explanation: 'Google\'s internal DKIM signature for Gmail messages.' },
  'list-unsubscribe': { category: 'other', explanation: 'URL or email address to use for unsubscribing from a mailing list.' },
  'in-reply-to': { category: 'identity', explanation: 'The Message-ID of the message this is a reply to, used for email threading.' },
  references: { category: 'identity', explanation: 'List of Message-IDs of related messages in the conversation thread.' },
};

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseEmailHeaders(raw: string): EmailHeaderAnalysis {
  const errors: string[] = [];
  const headers: ParsedHeader[] = [];
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  // Unfold headers (RFC 2822: continuation lines start with whitespace)
  const unfolded: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += ' ' + line.trim();
    } else {
      unfolded.push(line);
    }
  }

  // Parse key: value
  for (const line of unfolded) {
    if (!line.trim()) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx < 1) continue;
    const name = line.substring(0, colonIdx).trim();
    const value = line.substring(colonIdx + 1).trim();
    const lower = name.toLowerCase();
    const meta = HEADER_EXPLANATIONS[lower] || { category: 'other' as HeaderCategory, explanation: 'Custom or vendor-specific header.' };
    headers.push({ name, value, category: meta.category, explanation: meta.explanation });
  }

  // Extract key fields
  const get = (name: string) => {
    const h = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return h ? h.value : '';
  };

  const subject = get('Subject');
  const from = get('From');
  const to = get('To');
  const date = get('Date');
  const messageId = get('Message-ID');

  // Parse Received headers
  const receivedHeaders = headers
    .filter(h => h.name.toLowerCase() === 'received')
    .map(h => h.value);

  const received = receivedHeaders.map(raw => parseReceivedHeader(raw));

  // Calculate delays between hops
  for (let i = 1; i < received.length; i++) {
    const prev = received[i - 1];
    const curr = received[i];
    if (prev.timestamp !== null && curr.timestamp !== null) {
      curr.delay = Math.abs(curr.timestamp - prev.timestamp);
    }
  }

  // Calculate total delivery time (first to last received)
  let deliveryMs: number | null = null;
  const timestamps = received.filter(r => r.timestamp !== null).map(r => r.timestamp as number);
  if (timestamps.length >= 2) {
    deliveryMs = Math.abs(timestamps[0] - timestamps[timestamps.length - 1]);
  }

  // Parse Authentication-Results
  const authRaw = get('Authentication-Results');
  const authResults = authRaw ? parseAuthResults(authRaw) : null;

  return { headers, received, authResults, deliveryMs, subject, from, to, date, messageId, errors };
}

function parseReceivedHeader(raw: string): ReceivedHop {
  const fromMatch = raw.match(/from\s+([^\s;]+)/i);
  const byMatch = raw.match(/by\s+([^\s;]+)/i);
  const semicolonIdx = raw.lastIndexOf(';');
  let dateStr = '';
  let timestamp: number | null = null;

  if (semicolonIdx !== -1) {
    dateStr = raw.substring(semicolonIdx + 1).trim();
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) timestamp = d.getTime();
  }

  return {
    raw,
    from: fromMatch ? fromMatch[1] : '(unknown)',
    by: byMatch ? byMatch[1] : '(unknown)',
    date: dateStr,
    timestamp,
    delay: null,
  };
}

function parseAuthResults(raw: string): AuthResult {
  const spfMatch = raw.match(/spf=(\S+)/i);
  const dkimMatch = raw.match(/dkim=(\S+)/i);
  const dmarcMatch = raw.match(/dmarc=(\S+)/i);

  return {
    spf: spfMatch ? spfMatch[1].replace(/;$/, '') : null,
    dkim: dkimMatch ? dkimMatch[1].replace(/;$/, '') : null,
    dmarc: dmarcMatch ? dmarcMatch[1].replace(/;$/, '') : null,
    raw,
  };
}

export function formatDelay(ms: number): string {
  if (ms < 1000) return ms + ' ms';
  if (ms < 60000) return (ms / 1000).toFixed(1) + ' s';
  if (ms < 3600000) return Math.round(ms / 60000) + ' min';
  return (ms / 3600000).toFixed(1) + ' h';
}

export const CATEGORY_LABELS: Record<HeaderCategory, string> = {
  routing: 'Routing',
  identity: 'Identity',
  authentication: 'Authentication',
  content: 'Content',
  spam: 'Spam',
  other: 'Other',
};

export const SAMPLE_HEADERS = `From: Sender Name <sender@example.com>
To: recipient@example.com
Subject: Test Email
Date: Thu, 10 Apr 2025 12:00:00 +0000
Message-ID: <unique-id@mail.example.com>
MIME-Version: 1.0
Content-Type: text/plain; charset=UTF-8
Return-Path: <bounce@example.com>
Received: from mail.sender.com (mail.sender.com [203.0.113.1])
  by mx.example.com with ESMTPS id abc123
  for <recipient@example.com>;
  Thu, 10 Apr 2025 12:00:05 +0000
Received: from [192.168.1.10] (unknown [192.168.1.10])
  by mail.sender.com with ESMTP id xyz789;
  Thu, 10 Apr 2025 12:00:01 +0000
Authentication-Results: mx.example.com;
  spf=pass smtp.mailfrom=example.com;
  dkim=pass header.d=example.com;
  dmarc=pass
DKIM-Signature: v=1; a=rsa-sha256; d=example.com; s=default;
  b=Base64EncodedSignatureHere==
X-Spam-Score: 0.5
X-Mailer: Thunderbird 115.0`;
