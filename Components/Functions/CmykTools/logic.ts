// Pure CMYK maths shared by the RGB ↔ CMYK pages and the Blocks builder.

export type Cmyk = { c: number; m: number; y: number; k: number };
export type Rgb = { r: number; g: number; b: number };

/** RGB channels (0–255) to CMYK percentages (0–100), rounded to whole numbers. */
export function rgbToCmyk(r: number, g: number, b: number): Cmyk {
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  const k = Math.min(c, Math.min(m, y));

  c = (c - k) / (1 - k);
  m = (m - k) / (1 - k);
  y = (y - k) / (1 - k);

  // Pure black divides by zero above; every ink then reads as 0% plus full key.
  const pct = (v: number) => (isNaN(v) ? 0 : Math.round(v * 100));
  return { c: pct(c), m: pct(m), y: pct(y), k: Math.round(k * 100) };
}

/** CMYK percentages (0–100) to RGB channels (0–255). */
export function cmykToRgb(c: number, m: number, y: number, k: number): Rgb {
  c /= 100;
  m /= 100;
  y /= 100;
  k /= 100;

  c = c * (1 - k) + k;
  m = m * (1 - k) + k;
  y = y * (1 - k) + k;

  return {
    r: Math.round((1 - c) * 255),
    g: Math.round((1 - m) * 255),
    b: Math.round((1 - y) * 255),
  };
}
