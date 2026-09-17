import { menu } from "@/menu";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackToolError(toolName: string, errorType: string, context?: string) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'tool_error', {
      tool_name: toolName,
      error_type: errorType,
      error_context: context ?? '',
    });
  }
}

export const binaryToString = (input: string) => {
    if (input.includes(' ')) {
        return input.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join('');
    } else {
        let result = '';
        for (let i = 0; i < input.length; i += 8) {
            const byte = input.slice(i, i + 8);
            result += String.fromCharCode(parseInt(byte, 2));
        }
        return result;
    }
}

export const textToBinary = (words: string) => {
    let output = "";
    for (var i = 0; i < words.length; i++) {
        let binary = words[i].charCodeAt(0).toString(2);
        while (binary.length < 8) {
            binary = "0" + binary;
        }
        output += binary + " ";
    }
    return output.trim();
}


export type URLEncodeMode = 'standard' | 'all' | 'unicode';

export const urlEncodeModes: URLEncodeMode[] = ['standard', 'all', 'unicode'];

// Percent-encodes every character as its UTF-8 bytes, including the ones
// encodeURIComponent leaves untouched: A-Z a-z 0-9 - _ . ! ~ * ' ( )
export const urlEncodeAll = (input: string): string =>
    Array.from(new TextEncoder().encode(input))
        .map((byte) => '%' + byte.toString(16).toUpperCase().padStart(2, '0'))
        .join('');

// Non-standard %uXXXX form (legacy JScript escape(), IIS), one sequence per
// UTF-16 code unit, so characters outside the BMP become a surrogate pair.
export const urlEncodeUnicode = (input: string): string => {
    let output = '';
    for (let i = 0; i < input.length; i++) {
        output += '%u' + input.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0');
    }
    return output;
}

// Decodes %XX (UTF-8 bytes) and %uXXXX sequences in a single pass. Throws on a
// malformed sequence so callers can report it the same way decodeURIComponent does.
export const urlDecodeWithUnicode = (input: string): string => {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let output = '';
    let bytes: number[] = [];

    const flushBytes = () => {
        if (bytes.length > 0) {
            output += decoder.decode(new Uint8Array(bytes));
            bytes = [];
        }
    }

    for (let i = 0; i < input.length; i++) {
        if (input[i] !== '%') {
            flushBytes();
            output += input[i];
        } else if (/^u[0-9a-fA-F]{4}$/.test(input.slice(i + 1, i + 6))) {
            flushBytes();
            output += String.fromCharCode(parseInt(input.slice(i + 2, i + 6), 16));
            i += 5;
        } else if (/^[0-9a-fA-F]{2}$/.test(input.slice(i + 1, i + 3))) {
            bytes.push(parseInt(input.slice(i + 1, i + 3), 16));
            i += 2;
        } else {
            throw new URIError('URI malformed');
        }
    }

    flushBytes();
    return output;
}


export const hexToRgb = (hex: string): { r: number, g: number, b: number } | null => {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

export const rgbToHex = (r: number, g: number, b: number) => '#' + [r, g, b].map(x => {
    const hex = x.toString(16).toUpperCase()
    return hex.length === 1 ? '0' + hex : hex
}).join('')


export const resultContrastRatio = (inputLight: string, inputDark: string) => {

    const backInput = calculateRelLuminance(inputLight);
    const foreInput = calculateRelLuminance(inputDark);

    if (backInput > foreInput) {
        return ((backInput + 0.05) / (foreInput + 0.05))
    } else
        return ((foreInput + 0.05) / (backInput + 0.05))
}

export const calculateRelLuminance = (inputHex: string) => {
    const rgb = hexToRgb(inputHex);

    if (!rgb) {
        return 0
    }

    var RsRGB = rgb.r / 255;
    var GsRGB = rgb.g / 255;
    var BsRGB = rgb.b / 255;

    var R = (RsRGB <= 0.03928) ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    var G = (GsRGB <= 0.03928) ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    var B = (BsRGB <= 0.03928) ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);

    var L = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    return L;
}

export const colorValidator = (userInput: string) => {
    if (/^#(?:[0-9a-fA-F]{6})$/.test(userInput)) {
        return true
    }
    return false
}


/**
 * Related tools for a tool page, as a stable list.
 *
 * Stable matters twice over. The list is rendered on the server, so a random
 * order would mismatch on hydration; and these are the only links a tool page
 * gives a crawler, so an order that changes per request is an internal link
 * graph that never settles.
 *
 * Relevance is read off menu.ts: tools sharing the current tool's `type` come
 * first, nearest neighbours in the list before distant ones, because the menu
 * already groups related tools together. Anything left over is filled from the
 * same menu group.
 */
export const getSuggestions = (url: string, numberOfSuggestions: number = 6) => {
    type Link = { name: string; link: string; type: string; tag: string };

    let current: Link | null = null;
    let currentGroup: Link[] = [];

    for (const group of menu) {
      const found = group.links.find(link => link.link === url);
      if (found) {
        current = found;
        currentGroup = group.links;
        break;
      }
    }

    if (!current) return [];

    const self = current;
    const position = currentGroup.indexOf(self);

    // Same type, same group: rank by how close they sit in the menu.
    const sameTypeNearby = currentGroup
      .filter(link => link.type === self.type && link.link !== self.link)
      .sort((a, b) =>
        Math.abs(currentGroup.indexOf(a) - position) - Math.abs(currentGroup.indexOf(b) - position)
      );

    // Same type, elsewhere on the site: the cross-category links that tie a
    // topic together, e.g. the Morse converter to the other ciphers.
    const sameTypeElsewhere = menu
      .filter(group => group.links !== currentGroup)
      .flatMap(group => group.links)
      .filter(link => link.type === self.type);

    // Last resort, so a tool with a rare type is never a dead end.
    const groupNeighbours = currentGroup
      .filter(link => link.link !== self.link)
      .sort((a, b) =>
        Math.abs(currentGroup.indexOf(a) - position) - Math.abs(currentGroup.indexOf(b) - position)
      );

    const picked: Link[] = [];
    const seen = new Set<string>([self.link]);

    for (const link of [...sameTypeNearby, ...sameTypeElsewhere, ...groupNeighbours]) {
      if (seen.has(link.link)) continue;
      seen.add(link.link);
      picked.push(link);
      if (picked.length === numberOfSuggestions) break;
    }

    return picked;
  };


// Hex to binary, shared by the /converting/hex-to-binary tool and the Blocks
// operation of the same name. BigInt because parseInt loses precision above
// 2^53 and overflows to Infinity past 1.8e308, so anything digest-sized came
// back wrong long before the old countdown loop hung the tab on it.
export const hexToBinary = (input: string): string => {
    const hex = input.replace(/\s+/g, '').replace(/^0[xX]/, '');
    if (hex === '') return '';
    if (!/^[0-9a-fA-F]+$/.test(hex)) throw new Error('Invalid hex input');
    return BigInt('0x' + hex).toString(2);
}

/**
 * The chars / words / lines line shown above every text box. Counting is the
 * same everywhere it appears, so tools never disagree about what a word is:
 * a word is a run of non-whitespace, and an empty box has nothing in it.
 */
export const textStats = (input: string) => ({
    chars: input.length,
    words: input.trim() === '' ? 0 : input.trim().split(/\s+/).length,
    lines: input === '' ? 0 : input.split(/\r\n|\r|\n/).length,
});

/** That same line as text: `12 chars · 2 words · 1 line`. */
export const formatTextStats = (input: string) => {
    const { chars, words, lines } = textStats(input);
    const plural = (n: number, unit: string) => `${n.toLocaleString()} ${unit}${n === 1 ? '' : 's'}`;
    return `${plural(chars, 'char')} · ${plural(words, 'word')} · ${plural(lines, 'line')}`;
};
