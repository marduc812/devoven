import {
    Rgb,
    pixelAt,
    guessBackgroundColor,
    colorDistance,
    alphaForDistance,
    removeBackground,
    transparentName,
    rgbToHex,
    hexToRgb,
} from '@/Components/Functions/BackgroundRemoverTools/logic';

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };
const RED: Rgb = { r: 255, g: 0, b: 0 };

/** Build RGBA data from a grid of colours, fully opaque. */
function makeImage(grid: Rgb[][]): { data: Uint8ClampedArray; width: number; height: number } {
    const height = grid.length;
    const width = grid[0].length;
    const data = new Uint8ClampedArray(width * height * 4);

    grid.forEach((row, y) =>
        row.forEach((color, x) => {
            const offset = (y * width + x) * 4;
            data[offset] = color.r;
            data[offset + 1] = color.g;
            data[offset + 2] = color.b;
            data[offset + 3] = 255;
        }),
    );

    return { data, width, height };
}

const alphaAt = (data: Uint8ClampedArray, width: number, x: number, y: number) =>
    data[(y * width + x) * 4 + 3];

/** A 5×5 red square inside a white border, with a white hole at the centre. */
function subjectWithHole() {
    const grid: Rgb[][] = [];
    for (let y = 0; y < 5; y++) {
        const row: Rgb[] = [];
        for (let x = 0; x < 5; x++) {
            const onBorder = x === 0 || y === 0 || x === 4 || y === 4;
            const isHole = x === 2 && y === 2;
            row.push(onBorder || isHole ? WHITE : RED);
        }
        grid.push(row);
    }
    return makeImage(grid);
}

describe('pixelAt', () => {
    it('reads the right pixel', () => {
        const { data, width } = makeImage([[RED, WHITE], [BLACK, RED]]);
        expect(pixelAt(data, width, 1, 0)).toEqual(WHITE);
        expect(pixelAt(data, width, 0, 1)).toEqual(BLACK);
    });
});

describe('guessBackgroundColor', () => {
    it('picks the dominant border colour, not the subject', () => {
        const { data, width, height } = subjectWithHole();
        expect(guessBackgroundColor(data, width, height)).toEqual(WHITE);
    });

    it('ignores a subject that fills the interior', () => {
        const grid = [
            [BLACK, BLACK, BLACK],
            [BLACK, RED, BLACK],
            [BLACK, BLACK, BLACK],
        ];
        const { data, width, height } = makeImage(grid);
        expect(guessBackgroundColor(data, width, height)).toEqual(BLACK);
    });

    it('averages near-identical shades into one key', () => {
        // A noisy near-white border: every pixel differs slightly.
        const noisy = (i: number): Rgb => ({ r: 250 + (i % 4), g: 250 + (i % 3), b: 251 });
        const grid = [
            [noisy(0), noisy(1), noisy(2)],
            [noisy(3), RED, noisy(4)],
            [noisy(5), noisy(6), noisy(7)],
        ];
        const { data, width, height } = makeImage(grid);
        const key = guessBackgroundColor(data, width, height);

        expect(key.r).toBeGreaterThanOrEqual(250);
        expect(key.r).toBeLessThanOrEqual(253);
        expect(colorDistance(key, WHITE)).toBeLessThan(0.02);
    });

    it('rejects an empty image', () => {
        expect(() => guessBackgroundColor(new Uint8ClampedArray(0), 0, 0)).toThrow('empty');
    });
});

describe('colorDistance', () => {
    it('is zero for identical colours', () => {
        expect(colorDistance(RED, RED)).toBe(0);
    });

    it('is one for the furthest possible pair', () => {
        expect(colorDistance(BLACK, WHITE)).toBeCloseTo(1, 10);
    });

    it('is symmetric', () => {
        expect(colorDistance(RED, WHITE)).toBeCloseTo(colorDistance(WHITE, RED), 10);
    });
});

describe('alphaForDistance', () => {
    it('clears anything within the tolerance', () => {
        expect(alphaForDistance(0, 0.1, 0.1)).toBe(0);
        expect(alphaForDistance(0.1, 0.1, 0.1)).toBe(0);
    });

    it('keeps anything past the feather ramp', () => {
        expect(alphaForDistance(0.3, 0.1, 0.1)).toBe(255);
    });

    it('ramps linearly across the feather band', () => {
        // Half way up the ramp, give or take a rounding step.
        expect(alphaForDistance(0.15, 0.1, 0.1)).toBeCloseTo(127.5, -0.5);
        expect(alphaForDistance(0.125, 0.1, 0.1)).toBeCloseTo(63.75, -0.5);
        // Monotonic across the band.
        expect(alphaForDistance(0.12, 0.1, 0.1)).toBeLessThan(alphaForDistance(0.18, 0.1, 0.1));
    });

    it('is a hard cut when the feather is zero', () => {
        expect(alphaForDistance(0.1, 0.1, 0)).toBe(0);
        expect(alphaForDistance(0.11, 0.1, 0)).toBe(255);
    });
});

describe('removeBackground', () => {
    const base = { tolerance: 0.1, feather: 0, contiguous: false };

    it('clears the background and keeps the subject opaque', () => {
        const { data, width, height } = subjectWithHole();
        removeBackground(data, width, height, { ...base, key: WHITE });

        expect(alphaAt(data, width, 0, 0)).toBe(0);
        expect(alphaAt(data, width, 1, 1)).toBe(255);
    });

    it('clears an interior hole when contiguous is off', () => {
        const { data, width, height } = subjectWithHole();
        removeBackground(data, width, height, { ...base, key: WHITE, contiguous: false });

        expect(alphaAt(data, width, 2, 2)).toBe(0);
    });

    it('protects an interior hole when contiguous is on', () => {
        const { data, width, height } = subjectWithHole();
        removeBackground(data, width, height, { ...base, key: WHITE, contiguous: true });

        // The enclosed white pixel is not reachable from the border.
        expect(alphaAt(data, width, 2, 2)).toBe(255);
        // The outer background still goes.
        expect(alphaAt(data, width, 0, 0)).toBe(0);
    });

    it('reports how many pixels it changed', () => {
        const { data, width, height } = subjectWithHole();
        const stats = removeBackground(data, width, height, { ...base, key: WHITE });

        expect(stats.total).toBe(25);
        // 16 border pixels plus the centre hole.
        expect(stats.cleared).toBe(17);
        expect(stats.softened).toBe(0);
    });

    it('counts feathered pixels as softened, not cleared', () => {
        const edge: Rgb = { r: 200, g: 200, b: 200 };
        const { data, width, height } = makeImage([[WHITE, edge], [edge, RED]]);
        const stats = removeBackground(data, width, height, {
            key: WHITE, tolerance: 0.05, feather: 0.4, contiguous: false,
        });

        expect(stats.cleared).toBe(1);
        expect(stats.softened).toBe(2);
        expect(alphaAt(data, width, 1, 0)).toBeGreaterThan(0);
        expect(alphaAt(data, width, 1, 0)).toBeLessThan(255);
    });

    it('leaves everything opaque when nothing matches the key', () => {
        const { data, width, height } = makeImage([[RED, RED], [RED, RED]]);
        const stats = removeBackground(data, width, height, { ...base, key: BLACK });

        expect(stats.cleared).toBe(0);
        expect(alphaAt(data, width, 0, 0)).toBe(255);
    });

    it('clears everything when the tolerance covers the whole space', () => {
        const { data, width, height } = makeImage([[RED, BLACK], [WHITE, RED]]);
        const stats = removeBackground(data, width, height, { ...base, key: WHITE, tolerance: 1 });

        expect(stats.cleared).toBe(4);
    });

    it('preserves existing transparency instead of overwriting it', () => {
        const { data, width, height } = makeImage([[RED, RED], [RED, RED]]);
        data[3] = 100; // first pixel is already half transparent
        removeBackground(data, width, height, { ...base, key: BLACK });

        expect(alphaAt(data, width, 0, 0)).toBe(100);
        expect(alphaAt(data, width, 1, 0)).toBe(255);
    });

    it('handles a single-pixel image', () => {
        const { data, width, height } = makeImage([[WHITE]]);
        const stats = removeBackground(data, width, height, { ...base, key: WHITE, contiguous: true });

        expect(stats.cleared).toBe(1);
        expect(stats.total).toBe(1);
    });

    it('rejects an empty image', () => {
        expect(() =>
            removeBackground(new Uint8ClampedArray(0), 0, 0, { ...base, key: WHITE }),
        ).toThrow('empty');
    });

    it('does not overflow the stack on a large uniform image', () => {
        const width = 400;
        const height = 400;
        const data = new Uint8ClampedArray(width * height * 4).fill(255);
        const stats = removeBackground(data, width, height, { ...base, key: WHITE, contiguous: true });

        expect(stats.cleared).toBe(width * height);
    });
});

describe('transparentName', () => {
    it('always lands on .png', () => {
        expect(transparentName('photo.jpg')).toBe('photo-no-bg.png');
        expect(transparentName('logo.png')).toBe('logo-no-bg.png');
    });

    it('handles a name with dots or none at all', () => {
        expect(transparentName('v1.2.shot.webp')).toBe('v1.2.shot-no-bg.png');
        expect(transparentName('screenshot')).toBe('screenshot-no-bg.png');
    });
});

describe('hex conversion', () => {
    it('round-trips', () => {
        expect(hexToRgb(rgbToHex({ r: 18, g: 52, b: 86 }))).toEqual({ r: 18, g: 52, b: 86 });
    });

    it('formats with a leading zero per channel', () => {
        expect(rgbToHex({ r: 0, g: 8, b: 255 })).toBe('#0008ff');
    });

    it('expands shorthand hex', () => {
        expect(hexToRgb('#fff')).toEqual(WHITE);
        expect(hexToRgb('f00')).toEqual(RED);
    });

    it('falls back to white on junk', () => {
        expect(hexToRgb('nope')).toEqual(WHITE);
        expect(hexToRgb('')).toEqual(WHITE);
    });
});
