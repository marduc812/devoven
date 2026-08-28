import {
  calculateGeometry,
  formatGeometryResult,
  measureShape,
  findShapeDef,
  SHAPE_DEFS,
} from '@/Components/Functions/GeometryCalcTools/logic';

describe('calculateGeometry - circle', () => {
  it('computes circle measurements', () => {
    const result = calculateGeometry('circle\nr=5');
    const area = result.measurements.find(m => m.label === 'Area');
    const circ = result.measurements.find(m => m.label === 'Circumference');
    expect(area).toBeDefined();
    expect(parseFloat(area!.value)).toBeCloseTo(Math.PI * 25, 3);
    expect(circ).toBeDefined();
    expect(parseFloat(circ!.value)).toBeCloseTo(2 * Math.PI * 5, 3);
  });
});

describe('calculateGeometry - rectangle', () => {
  it('computes rectangle area and perimeter', () => {
    const result = calculateGeometry('rectangle\nw=4\nh=6');
    const area = result.measurements.find(m => m.label === 'Area');
    const perim = result.measurements.find(m => m.label === 'Perimeter');
    expect(parseFloat(area!.value)).toBeCloseTo(24, 4);
    expect(parseFloat(perim!.value)).toBeCloseTo(20, 4);
  });
});

describe('calculateGeometry - triangle', () => {
  it('computes triangle area by sides (Heron)', () => {
    // 3-4-5 right triangle area = 6
    const result = calculateGeometry('triangle\na=3\nb=4\nc=5');
    const area = result.measurements.find(m => m.label.includes('Area'));
    expect(parseFloat(area!.value)).toBeCloseTo(6, 3);
  });

  it('computes triangle area by base and height', () => {
    const result = calculateGeometry('triangle\nbase=10\nheight=4');
    const area = result.measurements.find(m => m.label === 'Area');
    expect(parseFloat(area!.value)).toBeCloseTo(20, 4);
  });
});

describe('calculateGeometry - sphere', () => {
  it('computes sphere volume and surface area', () => {
    const result = calculateGeometry('sphere\nr=3');
    const vol = result.measurements.find(m => m.label === 'Volume');
    const sa = result.measurements.find(m => m.label === 'Surface Area');
    expect(parseFloat(vol!.value)).toBeCloseTo((4 / 3) * Math.PI * 27, 2);
    expect(parseFloat(sa!.value)).toBeCloseTo(4 * Math.PI * 9, 2);
  });
});

describe('calculateGeometry - cylinder', () => {
  it('computes cylinder volume', () => {
    const result = calculateGeometry('cylinder\nr=2\nh=5');
    const vol = result.measurements.find(m => m.label === 'Volume');
    expect(parseFloat(vol!.value)).toBeCloseTo(Math.PI * 4 * 5, 2);
  });
});

describe('calculateGeometry - cone', () => {
  it('computes cone volume', () => {
    const result = calculateGeometry('cone\nr=3\nh=4');
    const vol = result.measurements.find(m => m.label === 'Volume');
    expect(parseFloat(vol!.value)).toBeCloseTo((1 / 3) * Math.PI * 9 * 4, 2);
  });
});

describe('calculateGeometry - cube', () => {
  it('computes cube volume and surface area', () => {
    const result = calculateGeometry('cube\ns=3');
    const vol = result.measurements.find(m => m.label === 'Volume');
    const sa = result.measurements.find(m => m.label === 'Surface Area');
    expect(parseFloat(vol!.value)).toBeCloseTo(27, 4);
    expect(parseFloat(sa!.value)).toBeCloseTo(54, 4);
  });
});

describe('calculateGeometry - polygon', () => {
  it('computes regular hexagon area', () => {
    // Regular hexagon: n=6, s=1 → area = (6 * 1) / (4 * tan(π/6)) = 3/(4*tan(30°)) ≈ 2.598
    const result = calculateGeometry('polygon\nn=6\ns=1');
    const area = result.measurements.find(m => m.label === 'Area');
    expect(parseFloat(area!.value)).toBeCloseTo(2.598, 2);
  });
});

describe('calculateGeometry - errors', () => {
  it('throws for unknown shape', () => {
    expect(() => calculateGeometry('hexaprism\ns=5')).toThrow();
  });

  it('throws for missing parameters', () => {
    expect(() => calculateGeometry('circle')).toThrow();
  });

  it('throws for invalid key=value format', () => {
    expect(() => calculateGeometry('circle\nradius 5')).toThrow();
  });
});

describe('formatGeometryResult', () => {
  it('formats output with measurements', () => {
    const result = calculateGeometry('circle\nr=5');
    const output = formatGeometryResult(result);
    expect(output).toContain('circle Measurements');
    expect(output).toContain('Area');
    expect(output).toContain('Circumference');
  });
});

describe('measureShape', () => {
  it('measures a shape from a params object', () => {
    const result = measureShape('rectangle', { w: 8, h: 5 });
    expect(result.measurements.find((m) => m.label === 'Area')?.value).toBe('40');
  });

  it('agrees with the text entry point', () => {
    expect(measureShape('circle', { r: 5 }).measurements).toEqual(
      calculateGeometry('circle\nr=5').measurements,
    );
  });

  it('throws on an unknown shape', () => {
    expect(() => measureShape('dodecahedron', {})).toThrow();
  });
});

describe('findShapeDef', () => {
  it('finds a shape by name', () => {
    expect(findShapeDef('Circle')?.variant).toBe('circle');
  });

  it('resolves polygon aliases', () => {
    expect(findShapeDef('ngon')?.variant).toBe('polygon');
    expect(findShapeDef('regular-polygon')?.variant).toBe('polygon');
  });

  it('picks the triangle variant matching the supplied keys', () => {
    expect(findShapeDef('triangle', ['a', 'b', 'c'])?.variant).toBe('triangle-sss');
    expect(findShapeDef('triangle', ['base', 'h'])?.variant).toBe('triangle-bh');
  });

  it('returns undefined for an unknown shape', () => {
    expect(findShapeDef('blob')).toBeUndefined();
  });
});

describe('SHAPE_DEFS', () => {
  it('has a unique variant id per entry', () => {
    const variants = SHAPE_DEFS.map((d) => d.variant);
    expect(new Set(variants).size).toBe(variants.length);
  });

  it('every entry measures cleanly with its own defaults', () => {
    for (const def of SHAPE_DEFS) {
      const result = measureShape(def.id, def.defaults);
      expect(result.measurements.length).toBeGreaterThan(0);
      for (const m of result.measurements) expect(m.value).not.toContain('NaN');
    }
  });
});
