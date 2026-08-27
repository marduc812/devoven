export interface GeometryResult {
  shape: string;
  measurements: Array<{ label: string; value: string }>;
}

type Params = Record<string, number>;

function fmt(n: number): string {
  return parseFloat(n.toPrecision(8)).toString();
}

const PI = Math.PI;

function circle(p: Params): Array<{ label: string; value: string }> {
  const r = p['r'] || p['radius'];
  if (!r) throw new Error('Circle requires: r=<radius>');
  return [
    { label: 'Radius', value: fmt(r) },
    { label: 'Diameter', value: fmt(2 * r) },
    { label: 'Circumference', value: fmt(2 * PI * r) },
    { label: 'Area', value: fmt(PI * r * r) },
  ];
}

function rectangle(p: Params): Array<{ label: string; value: string }> {
  const w = p['w'] || p['width'];
  const h = p['h'] || p['height'];
  if (!w || !h) throw new Error('Rectangle requires: w=<width> h=<height>');
  return [
    { label: 'Width', value: fmt(w) },
    { label: 'Height', value: fmt(h) },
    { label: 'Perimeter', value: fmt(2 * (w + h)) },
    { label: 'Area', value: fmt(w * h) },
    { label: 'Diagonal', value: fmt(Math.sqrt(w * w + h * h)) },
  ];
}

function triangle(p: Params): Array<{ label: string; value: string }> {
  const a = p['a'];
  const b = p['b'];
  const c = p['c'];
  const base = p['base'];
  const height = p['height'] || p['h'];

  if (base && height) {
    const area = 0.5 * base * height;
    return [
      { label: 'Base', value: fmt(base) },
      { label: 'Height', value: fmt(height) },
      { label: 'Area', value: fmt(area) },
    ];
  }

  if (!a || !b || !c) throw new Error('Triangle requires: a=<side> b=<side> c=<side>  OR  base=<b> h=<height>');
  const s = (a + b + c) / 2;
  const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
  return [
    { label: 'Side a', value: fmt(a) },
    { label: 'Side b', value: fmt(b) },
    { label: 'Side c', value: fmt(c) },
    { label: 'Perimeter', value: fmt(a + b + c) },
    { label: 'Area (Heron)', value: fmt(area) },
    { label: 'Semi-perimeter', value: fmt(s) },
  ];
}

function trapezoid(p: Params): Array<{ label: string; value: string }> {
  const a = p['a'];
  const b = p['b'];
  const h = p['h'] || p['height'];
  if (!a || !b || !h) throw new Error('Trapezoid requires: a=<base1> b=<base2> h=<height>');
  return [
    { label: 'Base 1', value: fmt(a) },
    { label: 'Base 2', value: fmt(b) },
    { label: 'Height', value: fmt(h) },
    { label: 'Area', value: fmt(0.5 * (a + b) * h) },
  ];
}

function ellipse(p: Params): Array<{ label: string; value: string }> {
  const a = p['a'];
  const b = p['b'];
  if (!a || !b) throw new Error('Ellipse requires: a=<semi-major> b=<semi-minor>');
  const perim = 2 * PI * Math.sqrt((a * a + b * b) / 2);
  return [
    { label: 'Semi-major axis (a)', value: fmt(a) },
    { label: 'Semi-minor axis (b)', value: fmt(b) },
    { label: 'Area', value: fmt(PI * a * b) },
    { label: 'Approximate Circumference', value: fmt(perim) },
  ];
}

function parallelogram(p: Params): Array<{ label: string; value: string }> {
  const b = p['b'] || p['base'];
  const h = p['h'] || p['height'];
  const s = p['s'] || p['side'];
  if (!b || !h) throw new Error('Parallelogram requires: b=<base> h=<height> [s=<side>]');
  const perim = s ? 2 * (b + s) : undefined;
  const result: Array<{ label: string; value: string }> = [
    { label: 'Base', value: fmt(b) },
    { label: 'Height', value: fmt(h) },
    { label: 'Area', value: fmt(b * h) },
  ];
  if (perim !== undefined) result.push({ label: 'Perimeter', value: fmt(perim) });
  return result;
}

function regularPolygon(p: Params): Array<{ label: string; value: string }> {
  const n = p['n'] || p['sides'];
  const s = p['s'] || p['side'];
  if (!n || !s || n < 3) throw new Error('Regular polygon requires: n=<sides> s=<side length> (n>=3)');
  const perimeter = n * s;
  const area = (n * s * s) / (4 * Math.tan(PI / n));
  const inradius = s / (2 * Math.tan(PI / n));
  const circumradius = s / (2 * Math.sin(PI / n));
  return [
    { label: 'Sides (n)', value: String(n) },
    { label: 'Side length', value: fmt(s) },
    { label: 'Perimeter', value: fmt(perimeter) },
    { label: 'Area', value: fmt(area) },
    { label: 'Inradius (apothem)', value: fmt(inradius) },
    { label: 'Circumradius', value: fmt(circumradius) },
    { label: 'Interior angle', value: fmt(((n - 2) * 180) / n) + '°' },
  ];
}

function sphere(p: Params): Array<{ label: string; value: string }> {
  const r = p['r'] || p['radius'];
  if (!r) throw new Error('Sphere requires: r=<radius>');
  return [
    { label: 'Radius', value: fmt(r) },
    { label: 'Diameter', value: fmt(2 * r) },
    { label: 'Surface Area', value: fmt(4 * PI * r * r) },
    { label: 'Volume', value: fmt((4 / 3) * PI * r * r * r) },
  ];
}

function cube(p: Params): Array<{ label: string; value: string }> {
  const s = p['s'] || p['side'];
  if (!s) throw new Error('Cube requires: s=<side>');
  return [
    { label: 'Side', value: fmt(s) },
    { label: 'Surface Area', value: fmt(6 * s * s) },
    { label: 'Volume', value: fmt(s * s * s) },
    { label: 'Space Diagonal', value: fmt(s * Math.sqrt(3)) },
  ];
}

function cylinder(p: Params): Array<{ label: string; value: string }> {
  const r = p['r'] || p['radius'];
  const h = p['h'] || p['height'];
  if (!r || !h) throw new Error('Cylinder requires: r=<radius> h=<height>');
  return [
    { label: 'Radius', value: fmt(r) },
    { label: 'Height', value: fmt(h) },
    { label: 'Lateral Surface Area', value: fmt(2 * PI * r * h) },
    { label: 'Total Surface Area', value: fmt(2 * PI * r * (r + h)) },
    { label: 'Volume', value: fmt(PI * r * r * h) },
  ];
}

function cone(p: Params): Array<{ label: string; value: string }> {
  const r = p['r'] || p['radius'];
  const h = p['h'] || p['height'];
  if (!r || !h) throw new Error('Cone requires: r=<radius> h=<height>');
  const slant = Math.sqrt(r * r + h * h);
  return [
    { label: 'Radius', value: fmt(r) },
    { label: 'Height', value: fmt(h) },
    { label: 'Slant Height', value: fmt(slant) },
    { label: 'Lateral Surface Area', value: fmt(PI * r * slant) },
    { label: 'Total Surface Area', value: fmt(PI * r * (r + slant)) },
    { label: 'Volume', value: fmt((1 / 3) * PI * r * r * h) },
  ];
}

function pyramid(p: Params): Array<{ label: string; value: string }> {
  const b = p['b'] || p['base'];
  const h = p['h'] || p['height'];
  if (!b || !h) throw new Error('Pyramid (square base) requires: b=<base side> h=<height>');
  const slant = Math.sqrt(h * h + (b / 2) * (b / 2));
  const lateralArea = 2 * b * slant;
  const totalArea = b * b + lateralArea;
  const volume = (1 / 3) * b * b * h;
  return [
    { label: 'Base side', value: fmt(b) },
    { label: 'Height', value: fmt(h) },
    { label: 'Slant Height', value: fmt(slant) },
    { label: 'Base Area', value: fmt(b * b) },
    { label: 'Lateral Surface Area', value: fmt(lateralArea) },
    { label: 'Total Surface Area', value: fmt(totalArea) },
    { label: 'Volume', value: fmt(volume) },
  ];
}

const SHAPE_HANDLERS: Record<string, (p: Params) => Array<{ label: string; value: string }>> = {
  circle,
  rectangle,
  square: (p) => {
    const s = p['s'] || p['side'];
    if (!s) throw new Error('Square requires: s=<side>');
    return rectangle({ w: s, h: s });
  },
  triangle,
  trapezoid,
  ellipse,
  parallelogram,
  polygon: regularPolygon,
  'regular-polygon': regularPolygon,
  ngon: regularPolygon,
  sphere,
  cube,
  cylinder,
  cone,
  pyramid,
};

// ─── Shape catalogue (drives the picker, the input fields and the diagram) ────

export interface ShapeField {
  key: string;
  label: string;
}

export interface ShapeDef {
  /** Key into the handler table — several defs can share one. */
  id: string;
  /** Unique id for the picker, since a shape can be solved more than one way. */
  variant: string;
  name: string;
  group: '2D' | '3D';
  fields: ShapeField[];
  defaults: Record<string, number>;
}

export const SHAPE_DEFS: ShapeDef[] = [
  {
    id: 'circle', variant: 'circle', name: 'Circle', group: '2D',
    fields: [{ key: 'r', label: 'radius' }],
    defaults: { r: 5 },
  },
  {
    id: 'ellipse', variant: 'ellipse', name: 'Ellipse', group: '2D',
    fields: [{ key: 'a', label: 'semi-major' }, { key: 'b', label: 'semi-minor' }],
    defaults: { a: 6, b: 4 },
  },
  {
    id: 'square', variant: 'square', name: 'Square', group: '2D',
    fields: [{ key: 's', label: 'side' }],
    defaults: { s: 5 },
  },
  {
    id: 'rectangle', variant: 'rectangle', name: 'Rectangle', group: '2D',
    fields: [{ key: 'w', label: 'width' }, { key: 'h', label: 'height' }],
    defaults: { w: 8, h: 5 },
  },
  {
    id: 'triangle', variant: 'triangle-sss', name: 'Triangle (3 sides)', group: '2D',
    fields: [{ key: 'a', label: 'side a' }, { key: 'b', label: 'side b' }, { key: 'c', label: 'side c' }],
    defaults: { a: 3, b: 4, c: 5 },
  },
  {
    id: 'triangle', variant: 'triangle-bh', name: 'Triangle (base × height)', group: '2D',
    fields: [{ key: 'base', label: 'base' }, { key: 'h', label: 'height' }],
    defaults: { base: 8, h: 5 },
  },
  {
    id: 'trapezoid', variant: 'trapezoid', name: 'Trapezoid', group: '2D',
    fields: [{ key: 'a', label: 'base 1' }, { key: 'b', label: 'base 2' }, { key: 'h', label: 'height' }],
    defaults: { a: 8, b: 5, h: 4 },
  },
  {
    id: 'parallelogram', variant: 'parallelogram', name: 'Parallelogram', group: '2D',
    fields: [{ key: 'b', label: 'base' }, { key: 'h', label: 'height' }, { key: 's', label: 'side' }],
    defaults: { b: 8, h: 4, s: 5 },
  },
  {
    id: 'polygon', variant: 'polygon', name: 'Regular Polygon', group: '2D',
    fields: [{ key: 'n', label: 'sides' }, { key: 's', label: 'side length' }],
    defaults: { n: 6, s: 4 },
  },
  {
    id: 'sphere', variant: 'sphere', name: 'Sphere', group: '3D',
    fields: [{ key: 'r', label: 'radius' }],
    defaults: { r: 5 },
  },
  {
    id: 'cube', variant: 'cube', name: 'Cube', group: '3D',
    fields: [{ key: 's', label: 'side' }],
    defaults: { s: 4 },
  },
  {
    id: 'cylinder', variant: 'cylinder', name: 'Cylinder', group: '3D',
    fields: [{ key: 'r', label: 'radius' }, { key: 'h', label: 'height' }],
    defaults: { r: 3, h: 8 },
  },
  {
    id: 'cone', variant: 'cone', name: 'Cone', group: '3D',
    fields: [{ key: 'r', label: 'radius' }, { key: 'h', label: 'height' }],
    defaults: { r: 3, h: 6 },
  },
  {
    id: 'pyramid', variant: 'pyramid', name: 'Pyramid (square base)', group: '3D',
    fields: [{ key: 'b', label: 'base side' }, { key: 'h', label: 'height' }],
    defaults: { b: 6, h: 8 },
  },
];

// Which def a shape name maps to. Aliases and the two triangle variants are
// resolved by looking at which keys were actually supplied.
export function findShapeDef(shapeName: string, keys: string[] = []): ShapeDef | undefined {
  const name = shapeName.toLowerCase().trim();
  const canonical = name === 'regular-polygon' || name === 'ngon' ? 'polygon' : name;

  const candidates = SHAPE_DEFS.filter((def) => def.id === canonical);
  if (candidates.length <= 1) return candidates[0];

  const best = candidates.find((def) => def.fields.every((f) => keys.includes(f.key)));
  return best ?? candidates[0];
}

export function measureShape(shapeId: string, params: Params): GeometryResult {
  const handler = SHAPE_HANDLERS[shapeId];
  if (!handler) throw new Error(`Unknown shape: "${shapeId}"`);
  return { shape: shapeId, measurements: handler(params) };
}

export function calculateGeometry(input: string): GeometryResult {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length === 0) throw new Error('Enter a shape name followed by dimensions as key=value pairs');

  const shapeName = lines[0].toLowerCase().trim();
  const handler = SHAPE_HANDLERS[shapeName];
  if (!handler) {
    throw new Error(
      `Unknown shape: "${lines[0]}". Supported: circle, rectangle, square, triangle, trapezoid, ellipse, parallelogram, polygon, sphere, cube, cylinder, cone, pyramid`
    );
  }

  const params: Params = {};
  for (let i = 1; i < lines.length; i++) {
    const match = lines[i].match(/^([a-z_]+)\s*=\s*([0-9.]+)$/i);
    if (!match) throw new Error(`Invalid parameter format on line ${i + 1}: "${lines[i]}". Use key=value (e.g. r=5)`);
    params[match[1].toLowerCase()] = parseFloat(match[2]);
  }

  const measurements = handler(params);
  return { shape: lines[0], measurements };
}

export function formatGeometryResult(result: GeometryResult): string {
  const lines: string[] = [
    `=== ${result.shape} Measurements ===`,
    '',
  ];
  for (const m of result.measurements) {
    lines.push(`${m.label.padEnd(28)}: ${m.value}`);
  }
  return lines.join('\n');
}
