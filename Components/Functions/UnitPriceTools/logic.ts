export type UnitType =
  | 'kg' | 'g' | 'oz' | 'lb'
  | 'L' | 'mL' | 'fl oz'
  | 'count';

export interface Product {
  name: string;
  price: number;
  quantity: number;
  unit: UnitType;
}

export interface ProductResult {
  name: string;
  price: number;
  quantity: number;
  unit: UnitType;
  pricePerBaseUnit: number;
  baseUnit: string;
  rank: number;
  savingsVsMostExpensive: number;
  savingsPct: number;
}

// Normalize everything to a base unit within the same category
// weight → grams, volume → mL, count → count
const WEIGHT_UNITS: UnitType[] = ['kg', 'g', 'oz', 'lb'];
const VOLUME_UNITS: UnitType[] = ['L', 'mL', 'fl oz'];

const TO_BASE: Record<UnitType, number> = {
  kg: 1000,
  g: 1,
  oz: 28.3495,
  lb: 453.592,
  L: 1000,
  mL: 1,
  'fl oz': 29.5735,
  count: 1,
};

const BASE_UNIT_LABEL: Record<string, string> = {
  weight: '100g',
  volume: '100mL',
  count: 'item',
};

function getCategory(unit: UnitType): string {
  if (WEIGHT_UNITS.includes(unit)) return 'weight';
  if (VOLUME_UNITS.includes(unit)) return 'volume';
  return 'count';
}

export function compareProducts(products: Product[]): ProductResult[] {
  if (products.length < 2) throw new Error('Enter at least 2 products to compare');
  if (products.length > 5) throw new Error('Maximum 5 products supported');

  const categories = products.map(p => getCategory(p.unit));
  const uniqueCategories = Array.from(new Set(categories));
  if (uniqueCategories.length > 1) {
    throw new Error(
      `Cannot mix unit types: found ${uniqueCategories.join(', ')}. All products must use the same unit category (weight, volume, or count).`
    );
  }

  const category = categories[0];
  const baseUnitLabel = BASE_UNIT_LABEL[category];
  // For weight/volume we normalise per 100 base units; for count it's per item
  const perN = category === 'count' ? 1 : 100;

  const results: ProductResult[] = products.map(p => {
    if (p.price < 0) throw new Error(`Price for "${p.name}" cannot be negative`);
    if (p.quantity <= 0) throw new Error(`Quantity for "${p.name}" must be positive`);

    const baseQuantity = p.quantity * TO_BASE[p.unit];
    const pricePerBaseUnit = (p.price / baseQuantity) * perN;
    return {
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      unit: p.unit,
      pricePerBaseUnit,
      baseUnit: baseUnitLabel,
      rank: 0,
      savingsVsMostExpensive: 0,
      savingsPct: 0,
    };
  });

  results.sort((a, b) => a.pricePerBaseUnit - b.pricePerBaseUnit);
  const mostExpensive = results[results.length - 1].pricePerBaseUnit;

  results.forEach((r, i) => {
    r.rank = i + 1;
    r.savingsVsMostExpensive = mostExpensive - r.pricePerBaseUnit;
    r.savingsPct = mostExpensive > 0 ? (r.savingsVsMostExpensive / mostExpensive) * 100 : 0;
  });

  return results;
}

export function formatComparisonResult(products: Product[]): string {
  const results = compareProducts(products);
  const fmt = (n: number) => n.toFixed(4);
  const fmtPct = (n: number) => n.toFixed(1);
  const baseUnit = results[0].baseUnit;

  const lines: string[] = [
    '=== Unit Price Comparison ===',
    `Ranked by price per ${baseUnit} (cheapest first)`,
    '',
    'Rank | Product                       | Price    | Qty    | Unit   | Per ' + baseUnit,
    '-----+-------------------------------+----------+--------+--------+----------',
  ];

  for (const r of results) {
    const rank = String(r.rank).padStart(4);
    const name = r.name.substring(0, 29).padEnd(29);
    const price = ('$' + r.price.toFixed(2)).padStart(8);
    const qty = String(r.quantity).padStart(6);
    const unit = r.unit.padEnd(6);
    const ppu = ('$' + fmt(r.pricePerBaseUnit)).padStart(9);
    lines.push(`${rank} | ${name} | ${price} | ${qty} | ${unit} | ${ppu}`);
  }

  lines.push('');
  lines.push('=== Savings vs Most Expensive ===');
  const cheapest = results[0];
  for (const r of results) {
    if (r.rank === results.length) {
      lines.push(`  ${r.name}: most expensive`);
    } else {
      lines.push(
        `  ${r.name}: save $${fmt(r.savingsVsMostExpensive)}/${baseUnit} (${fmtPct(r.savingsPct)}% cheaper than most expensive)`
      );
    }
  }

  lines.push('');
  lines.push(`Best value: ${cheapest.name} at $${fmt(cheapest.pricePerBaseUnit)}/${baseUnit}`);

  return lines.join('\n');
}

export function parseProductsInput(input: string): Product[] {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) throw new Error('Enter at least 2 products, one per line: Name, Price, Quantity, Unit');

  const VALID_UNITS: UnitType[] = ['kg', 'g', 'oz', 'lb', 'L', 'mL', 'fl oz', 'count'];

  return lines.map((line, i) => {
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 4) {
      throw new Error(`Line ${i + 1}: expected "Name, Price, Quantity, Unit" (e.g. "Oats, 2.99, 500, g")`);
    }

    const name = parts[0];
    const price = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
    const quantity = parseFloat(parts[2].replace(/[^0-9.]/g, ''));
    const unitRaw = parts.slice(3).join(',').trim().toLowerCase();

    // normalise unit aliases
    const unitAliasMap: Record<string, UnitType> = {
      kg: 'kg', kilogram: 'kg', kilograms: 'kg',
      g: 'g', gram: 'g', grams: 'g',
      oz: 'oz', ounce: 'oz', ounces: 'oz',
      lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb',
      l: 'L', liter: 'L', litre: 'L', liters: 'L', litres: 'L',
      ml: 'mL', milliliter: 'mL', millilitre: 'mL', milliliters: 'mL',
      'fl oz': 'fl oz', 'fluid oz': 'fl oz', 'fluid ounce': 'fl oz',
      count: 'count', pack: 'count', piece: 'count', pieces: 'count', each: 'count', item: 'count',
    };

    const unit = unitAliasMap[unitRaw];
    if (!unit) {
      throw new Error(`Line ${i + 1}: unknown unit "${unitRaw}". Valid units: ${VALID_UNITS.join(', ')}`);
    }
    if (isNaN(price) || isNaN(quantity)) {
      throw new Error(`Line ${i + 1}: price and quantity must be valid numbers`);
    }

    return { name, price, quantity, unit };
  });
}
