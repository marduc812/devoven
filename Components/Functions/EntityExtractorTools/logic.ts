export interface ExtractedEntities {
  emails: string[];
  urls: string[];
  phones: string[];
  ipv4s: string[];
  ipv6s: string[];
  dates: string[];
  creditCards: string[];
  hashtags: string[];
  mentions: string[];
  numbers: string[];
}

function unique(arr: string[]): string[] {
  const seen = new Set<string>();
  return arr.filter(x => { if (seen.has(x)) return false; seen.add(x); return true; });
}

function maskCC(cc: string): string {
  const digits = cc.replace(/\D/g, '');
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

export function extractEntities(text: string): ExtractedEntities {
  // Emails
  const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const emails = unique((text.match(emailRegex) || []).map(s => s.toLowerCase()));

  // URLs
  const urlRegex = /https?:\/\/[^\s<>"'{}|\\^`\[\]]+/g;
  const urls = unique(text.match(urlRegex) || []);

  // Phone numbers (various formats)
  const phoneRegex = /(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{4})/g;
  const phones = unique(text.match(phoneRegex) || []);

  // IPv4
  const ipv4Regex = /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;
  const ipv4s = unique(text.match(ipv4Regex) || []);

  // IPv6 (simplified)
  const ipv6Regex = /(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::(?:[fF]{4}:)?(?:25[0-5]|2[0-4]\d|[01]?\d\d?)(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}/g;
  const ipv6s = unique(text.match(ipv6Regex) || []);

  // Dates (various formats)
  const dateRegex = /(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}|\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4})/gi;
  const dates = unique(text.match(dateRegex) || []);

  // Credit card numbers (masked)
  const ccRegex = /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b|\b\d{4}[-\s]\d{6}[-\s]\d{5}\b/g;
  const ccMatches = text.match(ccRegex) || [];
  const creditCards = unique(ccMatches.map(cc => maskCC(cc)));

  // Hashtags
  const hashtagRegex = /#[a-zA-Z]\w*/g;
  const hashtags = unique(text.match(hashtagRegex) || []);

  // Mentions
  const mentionRegex = /@[a-zA-Z]\w*/g;
  const mentions = unique(text.match(mentionRegex) || []);

  // Numbers (integers and decimals, excluding those in emails/urls)
  const numberRegex = /\b-?\d+(?:\.\d+)?\b/g;
  const numbers = unique(text.match(numberRegex) || []);

  return { emails, urls, phones, ipv4s, ipv6s, dates, creditCards, hashtags, mentions, numbers };
}

export function formatEntities(entities: ExtractedEntities): string {
  const sections: string[] = [];

  function addSection(label: string, items: string[]) {
    if (items.length === 0) return;
    sections.push(`${label} (${items.length}):`);
    items.forEach(item => sections.push(`  ${item}`));
    sections.push('');
  }

  addSection('Emails', entities.emails);
  addSection('URLs', entities.urls);
  addSection('Phone Numbers', entities.phones);
  addSection('IPv4 Addresses', entities.ipv4s);
  addSection('IPv6 Addresses', entities.ipv6s);
  addSection('Dates', entities.dates);
  addSection('Credit Cards (masked)', entities.creditCards);
  addSection('Hashtags', entities.hashtags);
  addSection('@Mentions', entities.mentions);
  addSection('Numbers', entities.numbers);

  if (sections.length === 0) return 'No entities found.';
  return sections.join('\n').trimEnd();
}
