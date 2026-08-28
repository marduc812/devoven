import {
  parseEmailHeaders,
  formatDelay,
  SAMPLE_HEADERS,
} from '../Components/Functions/EmailHeaderTools/logic';

const MINIMAL = `From: sender@example.com
To: recipient@example.com
Subject: Hello World
Date: Thu, 10 Apr 2025 12:00:00 +0000
Message-ID: <abc123@example.com>`;

const WITH_AUTH = `${MINIMAL}
Authentication-Results: mx.example.com;
 spf=pass; dkim=fail; dmarc=pass`;

const WITH_RECEIVED = `${MINIMAL}
Received: from mail.sender.com (mail.sender.com [203.0.113.1])
  by mx.example.com with ESMTPS;
  Thu, 10 Apr 2025 12:00:05 +0000
Received: from [192.168.1.10] (unknown [192.168.1.10])
  by mail.sender.com;
  Thu, 10 Apr 2025 12:00:01 +0000`;

describe('parseEmailHeaders', () => {
  it('parses basic headers', () => {
    const result = parseEmailHeaders(MINIMAL);
    expect(result.from).toBe('sender@example.com');
    expect(result.to).toBe('recipient@example.com');
    expect(result.subject).toBe('Hello World');
    expect(result.messageId).toBe('<abc123@example.com>');
  });

  it('returns empty result for empty input', () => {
    const result = parseEmailHeaders('');
    expect(result.headers).toHaveLength(0);
  });

  it('parses authentication results', () => {
    const result = parseEmailHeaders(WITH_AUTH);
    expect(result.authResults).not.toBeNull();
    expect(result.authResults!.spf).toBe('pass');
    expect(result.authResults!.dkim).toBe('fail');
    expect(result.authResults!.dmarc).toBe('pass');
  });

  it('parses received headers', () => {
    const result = parseEmailHeaders(WITH_RECEIVED);
    expect(result.received.length).toBeGreaterThan(0);
    expect(result.received[0].from).toBeTruthy();
    expect(result.received[0].by).toBeTruthy();
  });

  it('assigns categories to headers', () => {
    const result = parseEmailHeaders(MINIMAL);
    const fromHeader = result.headers.find(h => h.name === 'From');
    expect(fromHeader).toBeDefined();
    expect(fromHeader!.category).toBe('identity');
  });

  it('parses sample headers without throwing', () => {
    expect(() => parseEmailHeaders(SAMPLE_HEADERS)).not.toThrow();
  });

  it('handles folded headers', () => {
    const folded = 'Subject: This is a very\n long subject line';
    const result = parseEmailHeaders(folded);
    const subj = result.headers.find(h => h.name === 'Subject');
    expect(subj).toBeDefined();
    expect(subj!.value).toContain('This is a very');
  });
});

describe('formatDelay', () => {
  it('formats milliseconds', () => expect(formatDelay(500)).toBe('500 ms'));
  it('formats seconds', () => expect(formatDelay(2500)).toBe('2.5 s'));
  it('formats minutes', () => expect(formatDelay(120000)).toBe('2 min'));
  it('formats hours', () => expect(formatDelay(7200000)).toBe('2.0 h'));
});
