export const MAX_ROTATION_INPUT = 10_000;

export function bruteForceRot47(text: string): string {
  if (text.length > MAX_ROTATION_INPUT) {
    throw new Error(`Brute force accepts at most ${MAX_ROTATION_INPUT.toLocaleString('en-US')} characters.`);
  }
  if (!text) return '';
  return Array.from({ length: 94 }, (_, shift) => {
    const rotated = text.replace(/[!-~]/g, (letter) =>
      String.fromCharCode(33 + (letter.charCodeAt(0) - 33 + shift) % 94),
    );
    return `Shift ${String(shift).padStart(2, ' ')}: ${rotated}`;
  }).join('\n');
}
