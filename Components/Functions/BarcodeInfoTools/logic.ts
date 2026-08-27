export type BarcodeType = 'EAN-13' | 'UPC-A' | 'ISBN-13' | 'ISSN' | 'ISMN' | 'Unknown';

export interface CheckDigitStep {
  index: number;
  digit: number;
  multiplier: number;
  product: number;
}

export interface BarcodeResult {
  raw: string;
  normalized: string;
  valid: boolean;
  type: BarcodeType;
  checkDigit: number;
  computedCheck: number;
  gs1Prefix: string;
  gs1Description: string;
  checkSteps: CheckDigitStep[];
  formatted: string;
}

// GS1 prefix ranges (first 2-3 digits of EAN-13)
const GS1_PREFIXES: Array<{ min: number; max: number; description: string }> = [
  { min: 0,   max: 19,  description: 'GS1 US / Canada' },
  { min: 20,  max: 29,  description: 'In-store (restricted circulation)' },
  { min: 30,  max: 39,  description: 'GS1 France' },
  { min: 40,  max: 49,  description: 'GS1 Germany' },
  { min: 50,  max: 59,  description: 'GS1 UK' },
  { min: 60,  max: 69,  description: 'GS1 US' },
  { min: 70,  max: 79,  description: 'GS1 Norway' },
  { min: 80,  max: 83,  description: 'GS1 Italy' },
  { min: 84,  max: 84,  description: 'GS1 Spain' },
  { min: 85,  max: 85,  description: 'GS1 Spain (special)' },
  { min: 87,  max: 87,  description: 'GS1 Netherlands' },
  { min: 90,  max: 91,  description: 'GS1 Austria' },
  { min: 93,  max: 93,  description: 'GS1 Australia' },
  { min: 94,  max: 94,  description: 'GS1 New Zealand' },
  { min: 99,  max: 99,  description: 'GS1 US (coupons)' },
  { min: 100, max: 139, description: 'GS1 US' },
  { min: 200, max: 299, description: 'Restricted distribution' },
  { min: 300, max: 379, description: 'GS1 France' },
  { min: 380, max: 380, description: 'GS1 Bulgaria' },
  { min: 383, max: 383, description: 'GS1 Slovenia' },
  { min: 385, max: 385, description: 'GS1 Croatia' },
  { min: 387, max: 387, description: 'GS1 Bosnia-Herzegovina' },
  { min: 389, max: 389, description: 'GS1 Montenegro' },
  { min: 400, max: 440, description: 'GS1 Germany' },
  { min: 450, max: 459, description: 'GS1 Japan' },
  { min: 460, max: 469, description: 'GS1 Russia' },
  { min: 470, max: 470, description: 'GS1 Kyrgyzstan' },
  { min: 471, max: 471, description: 'GS1 Taiwan' },
  { min: 474, max: 474, description: 'GS1 Estonia' },
  { min: 475, max: 475, description: 'GS1 Latvia' },
  { min: 476, max: 476, description: 'GS1 Azerbaijan' },
  { min: 477, max: 477, description: 'GS1 Lithuania' },
  { min: 478, max: 478, description: 'GS1 Uzbekistan' },
  { min: 479, max: 479, description: 'GS1 Sri Lanka' },
  { min: 480, max: 480, description: 'GS1 Philippines' },
  { min: 481, max: 481, description: 'GS1 Belarus' },
  { min: 482, max: 482, description: 'GS1 Ukraine' },
  { min: 484, max: 484, description: 'GS1 Moldova' },
  { min: 485, max: 485, description: 'GS1 Armenia' },
  { min: 486, max: 486, description: 'GS1 Georgia' },
  { min: 487, max: 487, description: 'GS1 Kazakhstan' },
  { min: 488, max: 488, description: 'GS1 Tajikistan' },
  { min: 489, max: 489, description: 'GS1 Hong Kong' },
  { min: 490, max: 499, description: 'GS1 Japan' },
  { min: 500, max: 509, description: 'GS1 UK' },
  { min: 520, max: 521, description: 'GS1 Greece' },
  { min: 528, max: 528, description: 'GS1 Lebanon' },
  { min: 529, max: 529, description: 'GS1 Cyprus' },
  { min: 530, max: 530, description: 'GS1 Albania' },
  { min: 531, max: 531, description: 'GS1 North Macedonia' },
  { min: 535, max: 535, description: 'GS1 Malta' },
  { min: 539, max: 539, description: 'GS1 Ireland' },
  { min: 540, max: 549, description: 'GS1 Belgium & Luxembourg' },
  { min: 560, max: 560, description: 'GS1 Portugal' },
  { min: 569, max: 569, description: 'GS1 Iceland' },
  { min: 570, max: 579, description: 'GS1 Denmark / Faroe Islands' },
  { min: 590, max: 590, description: 'GS1 Poland' },
  { min: 594, max: 594, description: 'GS1 Romania' },
  { min: 599, max: 599, description: 'GS1 Hungary' },
  { min: 600, max: 601, description: 'GS1 South Africa' },
  { min: 603, max: 603, description: 'GS1 Ghana' },
  { min: 604, max: 604, description: 'GS1 Senegal' },
  { min: 608, max: 608, description: 'GS1 Bahrain' },
  { min: 609, max: 609, description: 'GS1 Mauritius' },
  { min: 611, max: 611, description: 'GS1 Morocco' },
  { min: 613, max: 613, description: 'GS1 Algeria' },
  { min: 615, max: 615, description: 'GS1 Nigeria' },
  { min: 616, max: 616, description: 'GS1 Kenya' },
  { min: 618, max: 618, description: 'GS1 Ivory Coast' },
  { min: 619, max: 619, description: 'GS1 Tunisia' },
  { min: 621, max: 621, description: 'GS1 Syria' },
  { min: 622, max: 622, description: 'GS1 Egypt' },
  { min: 624, max: 624, description: 'GS1 Libya' },
  { min: 625, max: 625, description: 'GS1 Jordan' },
  { min: 626, max: 626, description: 'GS1 Iran' },
  { min: 627, max: 627, description: 'GS1 Kuwait' },
  { min: 628, max: 628, description: 'GS1 Saudi Arabia' },
  { min: 629, max: 629, description: 'GS1 UAE' },
  { min: 640, max: 649, description: 'GS1 Finland' },
  { min: 690, max: 699, description: 'GS1 China' },
  { min: 700, max: 709, description: 'GS1 Norway' },
  { min: 729, max: 729, description: 'GS1 Israel' },
  { min: 730, max: 739, description: 'GS1 Sweden' },
  { min: 740, max: 740, description: 'GS1 Guatemala' },
  { min: 741, max: 741, description: 'GS1 El Salvador' },
  { min: 742, max: 742, description: 'GS1 Honduras' },
  { min: 743, max: 743, description: 'GS1 Nicaragua' },
  { min: 744, max: 744, description: 'GS1 Costa Rica' },
  { min: 745, max: 745, description: 'GS1 Panama' },
  { min: 746, max: 746, description: 'GS1 Dominican Republic' },
  { min: 750, max: 750, description: 'GS1 Mexico' },
  { min: 754, max: 755, description: 'GS1 Canada' },
  { min: 759, max: 759, description: 'GS1 Venezuela' },
  { min: 760, max: 769, description: 'GS1 Switzerland / Liechtenstein' },
  { min: 770, max: 771, description: 'GS1 Colombia' },
  { min: 773, max: 773, description: 'GS1 Uruguay' },
  { min: 775, max: 775, description: 'GS1 Peru' },
  { min: 777, max: 777, description: 'GS1 Bolivia' },
  { min: 778, max: 779, description: 'GS1 Argentina' },
  { min: 780, max: 780, description: 'GS1 Chile' },
  { min: 784, max: 784, description: 'GS1 Paraguay' },
  { min: 786, max: 786, description: 'GS1 Ecuador' },
  { min: 789, max: 790, description: 'GS1 Brazil' },
  { min: 800, max: 839, description: 'GS1 Italy' },
  { min: 840, max: 849, description: 'GS1 Spain' },
  { min: 850, max: 850, description: 'GS1 Cuba' },
  { min: 858, max: 858, description: 'GS1 Slovakia' },
  { min: 859, max: 859, description: 'GS1 Czech Republic' },
  { min: 860, max: 860, description: 'GS1 Serbia' },
  { min: 865, max: 865, description: 'GS1 Mongolia' },
  { min: 867, max: 867, description: 'GS1 North Korea' },
  { min: 868, max: 869, description: 'GS1 Turkey' },
  { min: 870, max: 879, description: 'GS1 Netherlands' },
  { min: 880, max: 880, description: 'GS1 South Korea' },
  { min: 884, max: 884, description: 'GS1 Cambodia' },
  { min: 885, max: 885, description: 'GS1 Thailand' },
  { min: 888, max: 888, description: 'GS1 Singapore' },
  { min: 890, max: 890, description: 'GS1 India' },
  { min: 893, max: 893, description: 'GS1 Vietnam' },
  { min: 896, max: 896, description: 'GS1 Pakistan' },
  { min: 899, max: 899, description: 'GS1 Indonesia' },
  { min: 900, max: 919, description: 'GS1 Austria' },
  { min: 930, max: 939, description: 'GS1 Australia' },
  { min: 940, max: 949, description: 'GS1 New Zealand' },
  { min: 950, max: 950, description: 'GS1 Global Office' },
  { min: 955, max: 955, description: 'GS1 Malaysia' },
  { min: 958, max: 958, description: 'GS1 Macao' },
  { min: 960, max: 969, description: 'GS1 Global Office (GTIN-8)' },
  { min: 977, max: 977, description: 'ISSN (serial publications)' },
  { min: 978, max: 978, description: 'ISBN (books)' },
  { min: 979, max: 979, description: 'ISBN / ISMN (music scores: 979-0)' },
  { min: 980, max: 980, description: 'Refund receipts' },
  { min: 981, max: 984, description: 'Common currency coupons' },
  { min: 990, max: 999, description: 'Coupon codes' },
];

function getGs1Prefix(code: string): { prefix: string; description: string } {
  // Try 3-digit prefix first
  const p3 = parseInt(code.slice(0, 3), 10);
  const match3 = GS1_PREFIXES.find(r => p3 >= r.min && p3 <= r.max);
  if (match3) return { prefix: code.slice(0, 3), description: match3.description };

  const p2 = parseInt(code.slice(0, 2), 10);
  const match2 = GS1_PREFIXES.find(r => p2 >= r.min && p2 <= r.max);
  if (match2) return { prefix: code.slice(0, 2), description: match2.description };

  return { prefix: code.slice(0, 3), description: 'Unknown GS1 prefix' };
}

function computeEanCheckDigit(digits: string): { check: number; steps: CheckDigitStep[] } {
  const steps: CheckDigitStep[] = [];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const d = parseInt(digits[i], 10);
    const mult = i % 2 === 0 ? 1 : 3;
    const product = d * mult;
    steps.push({ index: i + 1, digit: d, multiplier: mult, product });
    sum += product;
  }
  const check = (10 - (sum % 10)) % 10;
  return { check, steps };
}

function detectType(code: string): BarcodeType {
  const prefix3 = parseInt(code.slice(0, 3), 10);
  if (code.length === 12) return 'UPC-A';
  if (code.length === 13) {
    if (prefix3 === 977) return 'ISSN';
    if (prefix3 === 978) return 'ISBN-13';
    if (prefix3 === 979) {
      // 979-0 = ISMN
      if (code[3] === '0') return 'ISMN';
      return 'ISBN-13';
    }
    return 'EAN-13';
  }
  return 'Unknown';
}

export function decodeBarcode(input: string): BarcodeResult {
  const cleaned = input.replace(/[\s-]/g, '');
  if (!/^\d+$/.test(cleaned)) throw new Error('Barcode must contain only digits (spaces and hyphens are ignored)');

  let normalized = cleaned;

  // UPC-A: 12 digits — pad to EAN-13 with leading 0 for check computation
  if (cleaned.length === 12) {
    normalized = cleaned;
  } else if (cleaned.length === 13) {
    normalized = cleaned;
  } else {
    throw new Error(`Unsupported barcode length: ${cleaned.length} digits. Expected 12 (UPC-A) or 13 (EAN-13)`);
  }

  const checkDigit = parseInt(normalized[normalized.length - 1], 10);
  const digits12 = normalized.length === 13 ? normalized.slice(0, 12) : '0' + normalized.slice(0, 11);
  const { check: computed, steps } = computeEanCheckDigit(digits12);
  const valid = computed === checkDigit;

  const type = detectType(normalized);
  const gs1 = getGs1Prefix(normalized);

  const stepsFormatted = steps.map(s =>
    `  Position ${String(s.index).padStart(2)}: ${s.digit} × ${s.multiplier} = ${s.product}`
  );

  const sumVal = steps.reduce((acc, s) => acc + s.product, 0);
  const lines: string[] = [
    `Barcode:     ${normalized}`,
    `Type:        ${type}`,
    `Valid:       ${valid ? 'YES' : 'NO (check digit mismatch)'}`,
    ``,
    `GS1 Prefix:  ${gs1.prefix}`,
    `Country/Org: ${gs1.description}`,
    ``,
    `=== Check Digit Calculation ===`,
    `Using EAN-13 algorithm: alternate digits multiplied by 1 and 3`,
    ``,
    ...stepsFormatted,
    ``,
    `  Sum:      ${sumVal}`,
    `  10 - (${sumVal} mod 10) mod 10 = ${computed}`,
    `  Check digit in barcode: ${checkDigit}`,
    `  Result: ${valid ? 'VALID' : 'INVALID'}`,
  ];

  if (type === 'ISBN-13') {
    lines.push('');
    lines.push('ISBN-13 Note: Remove the 978/979 prefix and the check digit to get the ISBN-10 base.');
  }
  if (type === 'ISSN') {
    lines.push('');
    lines.push('ISSN Note: The 977 prefix identifies serial publications (magazines, journals).');
  }
  if (type === 'ISMN') {
    lines.push('');
    lines.push('ISMN Note: The 979-0 prefix identifies printed music scores.');
  }

  return {
    raw: input,
    normalized,
    valid,
    type,
    checkDigit,
    computedCheck: computed,
    gs1Prefix: gs1.prefix,
    gs1Description: gs1.description,
    checkSteps: steps,
    formatted: lines.join('\n'),
  };
}

export function formatBarcode(input: string): string {
  return decodeBarcode(input).formatted;
}
