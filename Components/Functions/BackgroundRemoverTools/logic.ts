/**
 * Colour-key background removal.
 *
 * Pure pixel arithmetic over RGBA data, so the whole module is unit-tested in
 * Node without a canvas. The component supplies the ImageData from a canvas and
 * writes the result back.
 */

export interface Rgb {
    r: number;
    g: number;
    b: number;
}

/** Sample the pixel at (x, y) from RGBA data. */
export function pixelAt(data: Uint8ClampedArray, width: number, x: number, y: number): Rgb {
    const offset = (y * width + x) * 4;
    return { r: data[offset], g: data[offset + 1], b: data[offset + 2] };
}

/**
 * The colour most likely to be the background: the most common colour among the
 * image's border pixels, quantised so near-identical shades count as one.
 */
export function guessBackgroundColor(data: Uint8ClampedArray, width: number, height: number): Rgb {
    if (width <= 0 || height <= 0) throw new Error('The image is empty.');

    const counts = new Map<number, { count: number; r: number; g: number; b: number }>();

    const sample = (x: number, y: number) => {
        const { r, g, b } = pixelAt(data, width, x, y);
        // 5-bit buckets per channel: tolerant of JPEG noise, still distinct.
        const key = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
        const entry = counts.get(key);
        if (entry) {
            entry.count++;
            entry.r += r;
            entry.g += g;
            entry.b += b;
        } else {
            counts.set(key, { count: 1, r, g, b });
        }
    };

    for (let x = 0; x < width; x++) {
        sample(x, 0);
        sample(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
        sample(0, y);
        sample(width - 1, y);
    }

    let best = { count: 0, r: 255, g: 255, b: 255 };
    for (const entry of counts.values()) {
        if (entry.count > best.count) best = entry;
    }

    // Average the bucket's members so the key isn't snapped to a bucket edge.
    return {
        r: Math.round(best.r / best.count),
        g: Math.round(best.g / best.count),
        b: Math.round(best.b / best.count),
    };
}

/**
 * Euclidean distance between two colours, normalised to 0–1 against the longest
 * possible distance in RGB space.
 */
export function colorDistance(a: Rgb, b: Rgb): number {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3 * 255 * 255);
}

/**
 * Alpha for one pixel given its distance from the key colour.
 *
 * Inside `tolerance` the pixel is fully transparent; beyond `tolerance +
 * feather` it is fully opaque; between the two it ramps, which is what keeps
 * anti-aliased edges from turning into a hard jagged cutout.
 */
export function alphaForDistance(distance: number, tolerance: number, feather: number): number {
    if (distance <= tolerance) return 0;
    if (feather <= 0 || distance >= tolerance + feather) return 255;
    return Math.round(((distance - tolerance) / feather) * 255);
}

export interface RemoveOptions {
    key: Rgb;
    /** 0–1 share of colour space treated as background. */
    tolerance: number;
    /** 0–1 ramp width above the tolerance. */
    feather: number;
    /**
     * Only clear background-coloured pixels connected to the image border, so a
     * white shirt inside the subject survives a white-background removal.
     */
    contiguous: boolean;
}

export interface RemoveStats {
    /** Pixels made fully transparent. */
    cleared: number;
    /** Pixels left partly transparent by the feather ramp. */
    softened: number;
    total: number;
}

/**
 * Clear the background in place and report what changed.
 *
 * `data` is mutated, matching how ImageData is handed back to a canvas.
 */
export function removeBackground(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options: RemoveOptions,
): RemoveStats {
    const total = width * height;
    if (total === 0) throw new Error('The image is empty.');

    const alpha = new Uint8Array(total);
    for (let i = 0; i < total; i++) {
        const offset = i * 4;
        const distance = colorDistance(
            { r: data[offset], g: data[offset + 1], b: data[offset + 2] },
            options.key,
        );
        alpha[i] = alphaForDistance(distance, options.tolerance, options.feather);
    }

    if (options.contiguous) keepBorderConnected(alpha, width, height);

    let cleared = 0;
    let softened = 0;
    for (let i = 0; i < total; i++) {
        const next = alpha[i];
        if (next === 0) cleared++;
        else if (next < 255) softened++;
        // Multiply so an image that already had transparency keeps it.
        data[i * 4 + 3] = Math.round((data[i * 4 + 3] * next) / 255);
    }

    return { cleared, softened, total };
}

/**
 * Restore every non-opaque pixel that is *not* reachable from the border,
 * leaving only the outer background transparent.
 *
 * Flood fill from the edges over pixels the colour test already marked, using
 * an explicit stack so a large image cannot blow the call stack.
 */
function keepBorderConnected(alpha: Uint8Array, width: number, height: number): void {
    const reachable = new Uint8Array(alpha.length);
    const stack: number[] = [];

    const push = (index: number) => {
        if (alpha[index] === 255 || reachable[index]) return;
        reachable[index] = 1;
        stack.push(index);
    };

    for (let x = 0; x < width; x++) {
        push(x);
        push((height - 1) * width + x);
    }
    for (let y = 0; y < height; y++) {
        push(y * width);
        push(y * width + width - 1);
    }

    while (stack.length > 0) {
        const index = stack.pop() as number;
        const x = index % width;
        const y = (index - x) / width;

        if (x > 0) push(index - 1);
        if (x < width - 1) push(index + 1);
        if (y > 0) push(index - width);
        if (y < height - 1) push(index + width);
    }

    for (let i = 0; i < alpha.length; i++) {
        if (!reachable[i]) alpha[i] = 255;
    }
}

/** `photo.jpg` → `photo-no-bg.png`; the output is always PNG for the alpha. */
export function transparentName(sourceName: string): string {
    const base = sourceName.replace(/\.[^./\\]+$/, '') || 'image';
    return `${base}-no-bg.png`;
}

/** `{r,g,b}` → `#rrggbb`. */
export function rgbToHex({ r, g, b }: Rgb): string {
    const hex = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** `#rrggbb` (or `#rgb`) → `{r,g,b}`; falls back to white on junk input. */
export function hexToRgb(hex: string): Rgb {
    const cleaned = hex.trim().replace(/^#/, '');
    const full =
        cleaned.length === 3 ? cleaned.split('').map(c => c + c).join('')
        : cleaned.length === 6 ? cleaned
        : null;

    if (full === null || !/^[0-9a-f]{6}$/i.test(full)) return { r: 255, g: 255, b: 255 };

    const int = parseInt(full, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}
