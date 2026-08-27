export interface GridPattern {
  name: string;
  description: string;
  css: string;
  areas?: string;
  responsive?: string;
}

export const GRID_PATTERNS: GridPattern[] = [
  {
    name: 'Holy Grail Layout',
    description: 'Classic three-column layout with header and footer. Header and footer span full width; center has sidebar, main content, and aside.',
    css: `display: grid;
grid-template-columns: 200px 1fr 200px;
grid-template-rows: auto 1fr auto;
grid-template-areas:
  "header header header"
  "sidebar main aside"
  "footer footer footer";
min-height: 100vh;
gap: 16px;`,
    areas: `.header  { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main    { grid-area: main; }
.aside   { grid-area: aside; }
.footer  { grid-area: footer; }`,
    responsive: `@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "aside"
      "footer";
  }
}`,
  },
  {
    name: 'Sidebar + Main',
    description: 'Two-column layout with a fixed-width sidebar and a flexible main content area.',
    css: `display: grid;
grid-template-columns: 260px 1fr;
gap: 24px;
align-items: start;`,
    responsive: `@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
}`,
  },
  {
    name: 'Card Grid',
    description: 'Responsive auto-fill card grid that adjusts the number of columns based on available width.',
    css: `display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 24px;`,
  },
  {
    name: 'Magazine Layout',
    description: 'Complex editorial grid with a featured article spanning multiple columns and rows.',
    css: `display: grid;
grid-template-columns: repeat(6, 1fr);
grid-template-rows: repeat(3, auto);
gap: 16px;`,
    areas: `.featured { grid-column: 1 / 4; grid-row: 1 / 3; }
.article1 { grid-column: 4 / 7; grid-row: 1 / 2; }
.article2 { grid-column: 4 / 7; grid-row: 2 / 3; }
.article3 { grid-column: 1 / 3; grid-row: 3 / 4; }
.article4 { grid-column: 3 / 5; grid-row: 3 / 4; }
.article5 { grid-column: 5 / 7; grid-row: 3 / 4; }`,
    responsive: `@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
  .featured, .article1, .article2,
  .article3, .article4, .article5 {
    grid-column: auto;
    grid-row: auto;
  }
}`,
  },
  {
    name: 'Dashboard Grid',
    description: 'Flexible dashboard with a large main widget and smaller stat cards.',
    css: `display: grid;
grid-template-columns: repeat(4, 1fr);
grid-template-rows: 200px auto;
gap: 16px;`,
    areas: `.main-chart { grid-column: 1 / 4; }
.sidebar    { grid-column: 4 / 5; grid-row: 1 / 3; }
.stat1 { grid-column: 1 / 2; }
.stat2 { grid-column: 2 / 3; }
.stat3 { grid-column: 3 / 4; }`,
  },
];

export interface ParsedGrid {
  columns: string;
  rows: string;
  gap: string;
  extra: string;
}

export function parseGridInput(input: string): ParsedGrid {
  const lower = input.toLowerCase();
  let columns = '1fr';
  let rows = 'auto';
  let gap = '0';
  let extra = '';

  // Check for repeat(auto-fill/auto-fit, minmax())
  const repeatMatch = input.match(/repeat\(.*\)/i);
  if (repeatMatch) {
    columns = repeatMatch[0];
  } else {
    // Parse "N columns" pattern
    const colMatch = lower.match(/(\d+)\s*col(?:umn)?s?/);
    if (colMatch) {
      const count = parseInt(colMatch[1], 10);
      columns = `repeat(${count}, 1fr)`;
    }
    // Parse explicit fr/px values: "200px 1fr 1fr"
    const trackMatch = input.match(/[\d.]+(?:px|fr|em|rem|%|vw|vh)(?:\s+[\d.]+(?:px|fr|em|rem|%|vw|vh))*/);
    if (trackMatch && !colMatch) {
      columns = trackMatch[0];
    }
  }

  // Parse rows
  const rowMatch = lower.match(/(\d+)\s*rows?/);
  if (rowMatch) {
    const count = parseInt(rowMatch[1], 10);
    rows = `repeat(${count}, auto)`;
  }
  const rowHeightMatch = lower.match(/row.*?height[:\s]+(\S+)/);
  if (rowHeightMatch) {
    rows = `repeat(auto, ${rowHeightMatch[1]})`;
  }

  // Parse gap
  const gapMatch = lower.match(/(\d+(?:\.\d+)?)\s*px\s*gap/);
  if (gapMatch) {
    gap = `${gapMatch[1]}px`;
  } else {
    const gapMatch2 = input.match(/gap[:\s]+(\d+(?:\.\d+)?(?:px|rem|em)?)/i);
    if (gapMatch2) {
      gap = gapMatch2[1].match(/\d+$/) ? `${gapMatch2[1]}px` : gapMatch2[1];
    }
  }

  // Check for auto-fill or auto-fit keyword
  if (lower.includes('auto-fill')) extra += ' /* auto-fill: fills as many columns as possible */';
  if (lower.includes('auto-fit')) extra += ' /* auto-fit: collapses empty tracks */';

  return { columns, rows, gap, extra };
}

export function generateGridCss(input: string): string {
  if (!input.trim()) return '';
  const { columns, rows, gap, extra } = parseGridInput(input);
  const lines: string[] = [
    'display: grid;',
    `grid-template-columns: ${columns};${extra}`,
  ];
  if (rows !== 'auto') lines.push(`grid-template-rows: ${rows};`);
  if (gap !== '0') lines.push(`gap: ${gap};`);
  return lines.join('\n');
}

export function generateResponsiveGrid(input: string): string {
  if (!input.trim()) return '';
  const { columns, gap } = parseGridInput(input);
  // Extract min column width for responsive hint
  const minMatch = columns.match(/minmax\((\d+(?:px|rem|em|%)?)/);
  const breakpoint = minMatch ? minMatch[1] : '320px';
  return `/* Base (mobile-first) */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  ${gap !== '0' ? `gap: ${gap};` : ''}
}

/* Medium screens */
@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Large screens */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: ${columns};
  }
}

/* Or use auto-fill for fully fluid grids: */
.grid-fluid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(${breakpoint}, 1fr));
  ${gap !== '0' ? `gap: ${gap};` : ''}
}`;
}
