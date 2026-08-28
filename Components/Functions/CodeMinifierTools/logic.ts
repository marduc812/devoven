export type CodeLanguage = 'js' | 'css' | 'auto';

export interface MinifyResult {
  language: CodeLanguage;
  original: string;
  minified: string;
  originalSize: number;
  minifiedSize: number;
  savings: number;
  savingsPercent: number;
  formatted: string;
}

function removeBlockComments(code: string): string {
  // Remove /* ... */ comments (non-greedy)
  return code.replace(/\/\*[\s\S]*?\*\//g, '');
}

function removeLineComments(code: string): string {
  // Remove // ... comments — be careful inside strings
  // Simple approach: process line by line, track string state
  const lines = code.split('\n');
  const result: string[] = [];
  for (const line of lines) {
    let inStr = false;
    let strChar = '';
    let i = 0;
    let out = '';
    while (i < line.length) {
      const ch = line[i];
      if (inStr) {
        out += ch;
        if (ch === '\\') {
          i++;
          if (i < line.length) { out += line[i]; }
        } else if (ch === strChar) {
          inStr = false;
        }
      } else {
        if (ch === '"' || ch === "'" || ch === '`') {
          inStr = true;
          strChar = ch;
          out += ch;
        } else if (ch === '/' && line[i + 1] === '/') {
          // Rest of line is a comment
          break;
        } else {
          out += ch;
        }
      }
      i++;
    }
    result.push(out);
  }
  return result.join('\n');
}

function minifyJS(code: string): string {
  let result = code;

  // Remove block comments
  result = removeBlockComments(result);

  // Remove line comments
  result = removeLineComments(result);

  // Collapse newlines and tabs to spaces
  result = result.replace(/[\r\n\t]+/g, ' ');

  // Collapse multiple spaces
  result = result.replace(/  +/g, ' ');

  // Remove spaces around operators and punctuation (safe subset)
  result = result.replace(/ *([{}()\[\];,]) */g, '$1');
  result = result.replace(/ *([=+\-*/<>!&|^%?:]) */g, '$1');

  // Remove semicolons before closing braces
  result = result.replace(/;}/g, '}');

  // Remove trailing/leading spaces
  result = result.trim();

  return result;
}

function minifyCSS(code: string): string {
  let result = code;

  // Remove block comments
  result = removeBlockComments(result);

  // Collapse newlines and tabs to spaces
  result = result.replace(/[\r\n\t]+/g, ' ');

  // Collapse multiple spaces
  result = result.replace(/  +/g, ' ');

  // Remove spaces around CSS punctuation
  result = result.replace(/ *\{ */g, '{');
  result = result.replace(/ *\} */g, '}');
  result = result.replace(/ *: */g, ':');
  result = result.replace(/ *; */g, ';');
  result = result.replace(/ *, */g, ',');

  // Remove trailing semicolons before closing brace
  result = result.replace(/;}/g, '}');

  // Remove leading/trailing whitespace
  result = result.trim();

  return result;
}

function detectLanguage(code: string): 'js' | 'css' {
  // Heuristics: CSS tends to have selector { property: value } patterns
  const cssScore =
    (code.match(/\{[^}]*:[^}]*\}/g) || []).length * 2 +
    (code.match(/^\s*[.#][\w-]+\s*\{/m) ? 3 : 0) +
    (code.match(/@media|@keyframes|@import/g) || []).length * 2;

  const jsScore =
    (code.match(/\bfunction\b|\bconst\b|\blet\b|\bvar\b/g) || []).length * 2 +
    (code.match(/=>/g) || []).length +
    (code.match(/\/\//g) || []).length;

  return jsScore >= cssScore ? 'js' : 'css';
}

export function minifyCode(code: string, lang: CodeLanguage = 'auto'): MinifyResult {
  if (!code.trim()) throw new Error('Enter code to minify');

  const language: 'js' | 'css' = lang === 'auto' ? detectLanguage(code) : lang;

  const minified = language === 'css' ? minifyCSS(code) : minifyJS(code);

  const originalSize = code.length;
  const minifiedSize = minified.length;
  const savings = originalSize - minifiedSize;
  const savingsPercent = originalSize > 0 ? (savings / originalSize) * 100 : 0;

  const formatted = [
    `Language:      ${language.toUpperCase()} (${lang === 'auto' ? 'auto-detected' : 'manual'})`,
    `Original size: ${originalSize} bytes`,
    `Minified size: ${minifiedSize} bytes`,
    `Savings:       ${savings} bytes (${savingsPercent.toFixed(1)}%)`,
    ``,
    `=== Minified Output ===`,
    minified,
  ].join('\n');

  return {
    language,
    original: code,
    minified,
    originalSize,
    minifiedSize,
    savings,
    savingsPercent,
    formatted,
  };
}

export function formatMinify(code: string, lang: CodeLanguage = 'auto'): string {
  return minifyCode(code, lang).formatted;
}
