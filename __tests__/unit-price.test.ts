import { compareProducts, formatComparisonResult, parseProductsInput } from '@/Components/Functions/UnitPriceTools/logic';

describe('compareProducts', () => {
  it('ranks products cheapest first', () => {
    const products = [
      { name: 'Expensive', price: 5, quantity: 100, unit: 'g' as const },
      { name: 'Cheap', price: 2, quantity: 100, unit: 'g' as const },
    ];
    const results = compareProducts(products);
    expect(results[0].name).toBe('Cheap');
    expect(results[1].name).toBe('Expensive');
    expect(results[0].rank).toBe(1);
  });

  it('normalises kg and g correctly', () => {
    const products = [
      { name: 'A', price: 1, quantity: 1, unit: 'kg' as const },   // $1/kg = $0.1/100g
      { name: 'B', price: 0.12, quantity: 100, unit: 'g' as const }, // $0.12/100g
    ];
    const results = compareProducts(products);
    // A is cheaper: $0.10/100g vs $0.12/100g
    expect(results[0].name).toBe('A');
  });

  it('calculates savings vs most expensive', () => {
    const products = [
      { name: 'Cheap', price: 1, quantity: 100, unit: 'g' as const },
      { name: 'Expensive', price: 2, quantity: 100, unit: 'g' as const },
    ];
    const results = compareProducts(products);
    const cheapResult = results.find(r => r.name === 'Cheap')!;
    expect(cheapResult.savingsPct).toBeCloseTo(50, 1);
  });

  it('throws for fewer than 2 products', () => {
    expect(() => compareProducts([{ name: 'A', price: 1, quantity: 100, unit: 'g' }])).toThrow();
  });

  it('throws for more than 5 products', () => {
    const products = Array.from({ length: 6 }, (_, i) => ({
      name: `P${i}`, price: i + 1, quantity: 100, unit: 'g' as const,
    }));
    expect(() => compareProducts(products)).toThrow();
  });

  it('throws for mixed unit categories', () => {
    const products = [
      { name: 'A', price: 1, quantity: 100, unit: 'g' as const },
      { name: 'B', price: 1, quantity: 1, unit: 'L' as const },
    ];
    expect(() => compareProducts(products)).toThrow(/mix/i);
  });

  it('handles volume units', () => {
    const products = [
      { name: 'Big Bottle', price: 2, quantity: 2, unit: 'L' as const },   // $2/2L = $1/100mL
      { name: 'Small Bottle', price: 1.5, quantity: 1000, unit: 'mL' as const }, // $1.5/100mL
    ];
    const results = compareProducts(products);
    expect(results[0].name).toBe('Big Bottle');
  });

  it('handles count units', () => {
    const products = [
      { name: 'Pack A', price: 10, quantity: 100, unit: 'count' as const },
      { name: 'Pack B', price: 8, quantity: 80, unit: 'count' as const },
    ];
    const results = compareProducts(products);
    // A: $0.10/item, B: $0.10/item - equal
    expect(results[0].rank).toBe(1);
  });
});

describe('parseProductsInput', () => {
  it('parses valid input lines', () => {
    const input = 'Oats A, 2.99, 500, g\nOats B, 3.49, 750, g';
    const products = parseProductsInput(input);
    expect(products.length).toBe(2);
    expect(products[0].name).toBe('Oats A');
    expect(products[0].price).toBeCloseTo(2.99, 2);
    expect(products[0].quantity).toBe(500);
    expect(products[0].unit).toBe('g');
  });

  it('normalises unit aliases', () => {
    const input = 'Milk, 1.99, 1, liter\nWater, 0.99, 500, ml';
    const products = parseProductsInput(input);
    expect(products[0].unit).toBe('L');
    expect(products[1].unit).toBe('mL');
  });

  it('throws for fewer than 2 lines', () => {
    expect(() => parseProductsInput('Oats, 2.99, 500, g')).toThrow();
  });

  it('throws for missing columns', () => {
    expect(() => parseProductsInput('Oats, 2.99\nBread, 1.99')).toThrow();
  });

  it('throws for unknown unit', () => {
    expect(() => parseProductsInput('A, 1, 100, cups\nB, 2, 100, cups')).toThrow(/unknown unit/i);
  });
});

describe('formatComparisonResult', () => {
  it('contains ranked output and savings section', () => {
    const products = parseProductsInput('Oats A, 2.99, 500, g\nOats B, 1.99, 400, g');
    const output = formatComparisonResult(products);
    expect(output).toContain('Unit Price Comparison');
    expect(output).toContain('Savings vs Most Expensive');
    expect(output).toContain('Best value');
  });
});
