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


export const getSuggestions = (url: string, numberOfSuggestions: number = 5) => {
    let suggestions: Array<{ name: string; link: string; type: string; tag: string }> = [];
    let linkType: string | null = null;
  
    // Find the type associated with the provided URL
    for (const group of menu) {
      for (const link of group.links) {
        if (link.link === url) {
          linkType = link.type;
          break;
        }
      }
      if (linkType) break; // Stop searching if we found the type
    }
  
    // Filter for similar links if the type was found
    if (linkType) {
      suggestions = menu.flatMap(group =>
        group.links.filter(link => link.type === linkType && link.link !== url)
      );
    }
  
    // Shuffle the array to ensure randomness
    const shuffleArray = (array: any[]): any[] => {
      return array.sort(() => Math.random() - 0.5);
    };
  
    // Fill in with random suggestions if not enough similar links
    if (suggestions.length < numberOfSuggestions) {
      let allLinks = menu.flatMap(group => group.links);
      allLinks = shuffleArray(allLinks); // Shuffle to pick random links
  
      // Add random links until the suggestions array has the desired length
      while (suggestions.length < numberOfSuggestions && allLinks.length > 0) {
        const randomLink = allLinks.pop();
        if (randomLink && !suggestions.includes(randomLink)) {
          suggestions.push(randomLink);
        }
      }
    }
  
    // Return the requested number of suggestions
    return shuffleArray(suggestions).slice(0, numberOfSuggestions);
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
