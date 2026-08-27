export function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) throw new Error('Enter a phone number');

  const results: string[] = [];

  // US/Canada (NANP): 10 or 11 digits (1 + 10)
  if (digits.length === 10) {
    const [area, exchange, subscriber] = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)];
    results.push(`Format:         US/Canada (NANP) — 10 digits`);
    results.push(`National:       (${area}) ${exchange}-${subscriber}`);
    results.push(`Dashes:         ${area}-${exchange}-${subscriber}`);
    results.push(`Dots:           ${area}.${exchange}.${subscriber}`);
    results.push(`E.164:          +1${digits}`);
    results.push(`RFC 3966:       tel:+1-${area}-${exchange}-${subscriber}`);
  } else if (digits.length === 11 && digits[0] === '1') {
    const d = digits.slice(1);
    const [area, exchange, subscriber] = [d.slice(0, 3), d.slice(3, 6), d.slice(6)];
    results.push(`Format:         US/Canada (NANP) — 11 digits`);
    results.push(`National:       +1 (${area}) ${exchange}-${subscriber}`);
    results.push(`E.164:          +${digits}`);
  } else {
    // International
    results.push(`Digits:         ${digits}`);
    results.push(`E.164 guess:    +${digits}`);
    results.push(`Groups of 3:    ${digits.match(/.{1,3}/g)?.join('-') ?? digits}`);
  }

  results.push(``, `Digit count:    ${digits.length}`);
  return results.join('\n');
}
