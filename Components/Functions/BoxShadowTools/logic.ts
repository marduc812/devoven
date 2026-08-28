// All functions are pure (no browser APIs).

export type BoxShadowConfig = {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset: boolean;
};

export type BoxShadowPreset = {
  name: string;
  description: string;
  css: string;
};

export function parseBoxShadowInput(input: string): BoxShadowConfig[] {
  if (!input.trim()) return [];

  const shadows: BoxShadowConfig[] = [];
  const parts = input.split(';');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const config: BoxShadowConfig = {
      x: 0,
      y: 4,
      blur: 6,
      spread: 0,
      color: 'rgba(0,0,0,0.3)',
      inset: false,
    };

    // Split on commas that are NOT inside parentheses
    const pairs: string[] = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (ch === '(') { depth++; current += ch; }
      else if (ch === ')') { depth--; current += ch; }
      else if (ch === ',' && depth === 0) { pairs.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    if (current.trim()) pairs.push(current.trim());

    for (const pair of pairs) {
      const eqIdx = pair.indexOf('=');
      if (eqIdx === -1) continue;
      const key = pair.slice(0, eqIdx).trim().toLowerCase();
      const val = pair.slice(eqIdx + 1).trim();
      if (key === 'x') config.x = parseFloat(val) || 0;
      else if (key === 'y') config.y = parseFloat(val) || 0;
      else if (key === 'blur') config.blur = parseFloat(val) || 0;
      else if (key === 'spread') config.spread = parseFloat(val) || 0;
      else if (key === 'color') config.color = val;
      else if (key === 'inset') config.inset = val.toLowerCase() === 'true' || val === '1';
    }

    shadows.push(config);
  }

  return shadows;
}

export function shadowToString(shadow: BoxShadowConfig): string {
  const parts: string[] = [];
  if (shadow.inset) parts.push('inset');
  parts.push(shadow.x + 'px');
  parts.push(shadow.y + 'px');
  parts.push(shadow.blur + 'px');
  parts.push(shadow.spread + 'px');
  parts.push(shadow.color);
  return parts.join(' ');
}

export function generateBoxShadowCSS(shadows: BoxShadowConfig[]): string {
  if (shadows.length === 0) return '';
  const value = shadows.map(shadowToString).join(',\n  ');
  return 'box-shadow: ' + value + ';';
}

export function getBoxShadowPresets(): BoxShadowPreset[] {
  return [
    {
      name: 'Subtle',
      description: 'Very soft, barely visible shadow',
      css: 'box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);',
    },
    {
      name: 'Material (Low)',
      description: 'Material Design elevation 2',
      css: 'box-shadow: 0 2px 4px rgba(0,0,0,0.14), 0 1px 5px rgba(0,0,0,0.12), 0 3px 1px rgba(0,0,0,0.2);',
    },
    {
      name: 'Material (Mid)',
      description: 'Material Design elevation 8',
      css: 'box-shadow: 0 8px 10px rgba(0,0,0,0.14), 0 3px 14px rgba(0,0,0,0.12), 0 5px 5px rgba(0,0,0,0.2);',
    },
    {
      name: 'Sharp',
      description: 'Hard, no blur shadow',
      css: 'box-shadow: 4px 4px 0px rgba(0,0,0,0.8);',
    },
    {
      name: 'Soft Glow',
      description: 'Large diffused soft shadow',
      css: 'box-shadow: 0 20px 60px rgba(0,0,0,0.3);',
    },
    {
      name: 'Neumorphic Light',
      description: 'Neumorphism on light background',
      css: 'box-shadow: 6px 6px 12px #b8b9be, -6px -6px 12px #ffffff;',
    },
    {
      name: 'Neumorphic Dark',
      description: 'Neumorphism on dark background',
      css: 'box-shadow: 6px 6px 12px #1a1a1a, -6px -6px 12px #2e2e2e;',
    },
    {
      name: 'Inset',
      description: 'Inner shadow effect',
      css: 'box-shadow: inset 0 2px 6px rgba(0,0,0,0.4);',
    },
    {
      name: 'Layered',
      description: 'Multiple stacked shadows for depth',
      css: 'box-shadow: 0 1px 1px rgba(0,0,0,0.08), 0 2px 2px rgba(0,0,0,0.08), 0 4px 4px rgba(0,0,0,0.08), 0 8px 8px rgba(0,0,0,0.08);',
    },
    {
      name: 'Colored Glow',
      description: 'Blue glowing shadow',
      css: 'box-shadow: 0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3);',
    },
  ];
}

export function formatBoxShadowOutput(input: string): string {
  try {
    const shadows = parseBoxShadowInput(input);
    if (shadows.length === 0) return '';
    const css = generateBoxShadowCSS(shadows);
    const lines: string[] = [css, ''];
    if (shadows.length > 1) {
      lines.push('/* Individual shadows: */');
      shadows.forEach(function(s, i) {
        lines.push('/* Layer ' + (i + 1) + ': ' + shadowToString(s) + ' */');
      });
    }
    return lines.join('\n');
  } catch (e) {
    return e instanceof Error ? 'Error: ' + e.message : 'Invalid input';
  }
}
