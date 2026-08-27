export function luhnCheck(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
}

export function detectCardType(number: string): string {
  const digits = number.replace(/\D/g, '');
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2(2[2-9][1-9]|[3-6]\d{2}|7([01]\d|20))/.test(digits)) return 'Mastercard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  if (/^35(2[89]|[3-8]\d)/.test(digits)) return 'JCB';
  if (/^3(?:0[0-5]|[68])/.test(digits)) return 'Diners Club';
  return 'Unknown';
}

export function formatCardNumber(number: string): string {
  const digits = number.replace(/\D/g, '');
  const type = detectCardType(digits);
  // AmEx uses 4-6-5 format, others use 4-4-4-4
  if (type === 'American Express' && digits.length >= 15) {
    return digits.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
  }
  return digits.replace(/(\d{4})/g, '$1 ').trim();
}

export function validateCard(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) throw new Error('Enter a card number');
  const valid = luhnCheck(digits);
  const type = detectCardType(digits);
  const formatted = formatCardNumber(digits);
  return [
    `Card Number:   ${formatted}`,
    `Card Type:     ${type}`,
    `Luhn Valid:    ${valid ? 'Yes ✓' : 'No ✗'}`,
    `Digits:        ${digits.length}`,
    '',
    valid ? 'This number passes the Luhn algorithm check.' : 'This number fails the Luhn algorithm check.',
  ].join('\n');
}

// ─── Structured report ───────────────────────────────────────────────────────
// The string helpers above stay as they are; everything below is what the UI
// renders.

export interface CardBrand {
  name: string;
  /** Total digit counts the network issues. */
  lengths: number[];
  cvvLength: number;
  /** Digit-group sizes for display, e.g. [4, 6, 5] for American Express. */
  grouping: number[];
  /** Where the number's leading digits (the IIN) come from. */
  iin: string;
}

export const CARD_BRANDS: Record<string, CardBrand> = {
  Visa: { name: 'Visa', lengths: [13, 16, 19], cvvLength: 3, grouping: [4, 4, 4, 4], iin: 'starts with 4' },
  Mastercard: { name: 'Mastercard', lengths: [16], cvvLength: 3, grouping: [4, 4, 4, 4], iin: '51-55 or 2221-2720' },
  'American Express': { name: 'American Express', lengths: [15], cvvLength: 4, grouping: [4, 6, 5], iin: '34 or 37' },
  Discover: { name: 'Discover', lengths: [16, 19], cvvLength: 3, grouping: [4, 4, 4, 4], iin: '6011 or 65' },
  JCB: { name: 'JCB', lengths: [16, 17, 18, 19], cvvLength: 3, grouping: [4, 4, 4, 4], iin: '3528-3589' },
  'Diners Club': { name: 'Diners Club', lengths: [14, 16, 19], cvvLength: 3, grouping: [4, 6, 4], iin: '300-305, 36 or 38' },
};

/** Brand facts for a number, or null when the IIN matches no known network.
 *  Keyed off detectCardType so the two cannot drift apart. */
export function getCardBrand(number: string): CardBrand | null {
  return CARD_BRANDS[detectCardType(number)] ?? null;
}

/** Group digits by a brand's display pattern, spilling the remainder in 4s. */
export function groupDigits(digits: string, grouping: number[]): string {
  const groups: string[] = [];
  let i = 0;
  for (const size of grouping) {
    if (i >= digits.length) break;
    groups.push(digits.slice(i, i + size));
    i += size;
  }
  while (i < digits.length) {
    groups.push(digits.slice(i, i + 4));
    i += 4;
  }
  return groups.join(' ');
}

export interface LuhnStep {
  /** 1-based from the left, the order the number is written in. */
  position: number;
  /** 1-based from the right — what the algorithm actually counts. */
  fromRight: number;
  digit: number;
  doubled: boolean;
  /** The digit after doubling and casting out nines. */
  contribution: number;
  /** Sum of every contribution up to and including this digit, read left to
   *  right. Luhn runs right to left, but the sum is plain addition, so showing
   *  it in reading order costs nothing and is far easier to follow. */
  running: number;
}

export interface CardReport {
  input: string;
  digits: string;
  formatted: string;
  /** First six and last four kept, per the usual PCI display rule. */
  masked: string;
  brandName: string;
  brand: CardBrand | null;
  luhnValid: boolean;
  lengthValid: boolean;
  /** Luhn passes *and* the length is one the brand issues. */
  valid: boolean;
  steps: LuhnStep[];
  sum: number;
  checkDigit: string;
  expectedCheckDigit: string;
  issues: string[];
}

/** The Luhn check digit for a body that does not yet have one. */
export function luhnCheckDigit(body: string): string {
  let sum = 0;
  let doubleIt = true; // the check digit sits at fromRight = 1, so body ends at 2
  for (let i = body.length - 1; i >= 0; i--) {
    let digit = parseInt(body[i], 10);
    if (doubleIt) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleIt = !doubleIt;
  }
  return String((10 - (sum % 10)) % 10);
}

export function luhnSteps(digits: string): LuhnStep[] {
  const steps: LuhnStep[] = [];
  let running = 0;
  for (let i = 0; i < digits.length; i++) {
    const fromRight = digits.length - i;
    const digit = parseInt(digits[i], 10);
    // Every second digit counting from the right is doubled — so which digits
    // double depends on the length, not on the position from the left.
    const doubled = fromRight % 2 === 0;
    let contribution = digit;
    if (doubled) {
      contribution *= 2;
      if (contribution > 9) contribution -= 9;
    }
    running += contribution;
    steps.push({ position: i + 1, fromRight, digit, doubled, contribution, running });
  }
  return steps;
}

export function maskCardNumber(digits: string): string {
  if (digits.length <= 10) return digits;
  return digits.slice(0, 6) + '•'.repeat(digits.length - 10) + digits.slice(-4);
}

/** Everything the UI renders. Throws only when there is nothing to check. */
export function analyzeCard(input: string): CardReport {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 0) throw new Error('Enter a card number');

  const brandName = detectCardType(digits);
  const brand = getCardBrand(digits);
  const steps = luhnSteps(digits);
  const sum = steps.length > 0 ? steps[steps.length - 1].running : 0;
  const luhnValid = digits.length >= 13 && sum % 10 === 0;
  const lengthValid = brand ? brand.lengths.includes(digits.length) : digits.length >= 13;

  const issues: string[] = [];
  if (digits.length < 13) {
    issues.push(`Too short — card numbers are at least 13 digits (got ${digits.length}).`);
  } else if (!luhnValid) {
    issues.push(`Fails the Luhn check: the digits sum to ${sum}, which is not a multiple of 10.`);
  }
  if (brand && !lengthValid) {
    issues.push(
      `${brand.name} issues numbers of ${brand.lengths.join(' or ')} digits; this one has ${digits.length}.`
    );
  }
  if (!brand && digits.length >= 13) {
    issues.push('The leading digits match no major network, so the brand is unknown.');
  }

  return {
    input,
    digits,
    formatted: groupDigits(digits, brand?.grouping ?? [4, 4, 4, 4]),
    masked: maskCardNumber(digits),
    brandName,
    brand,
    luhnValid,
    lengthValid,
    valid: luhnValid && lengthValid,
    steps,
    sum,
    checkDigit: digits.slice(-1),
    expectedCheckDigit: digits.length > 1 ? luhnCheckDigit(digits.slice(0, -1)) : '?',
    issues,
  };
}
