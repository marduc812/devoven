// All functions are pure (no browser APIs).

export type SvgCommand = {
  command: string;
  params: number[];
  description: string;
  absolute: boolean;
};

export type SvgPathResult = {
  commands: SvgCommand[];
  totalSegments: number;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
  pathLengthEstimate: number;
  summary: string;
};

// ─── Parser ───────────────────────────────────────────────────────────────────

function tokenizePath(d: string): Array<{ cmd: string; params: number[] }> {
  const tokens: Array<{ cmd: string; params: number[] }> = [];
  // Split on command letters
  const re = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    const cmd = m[1];
    const paramStr = m[2].trim();
    const params = paramStr.length > 0
      ? paramStr.split(/[\s,]+/).filter(function(s) { return s.length > 0; }).map(Number)
      : [];
    tokens.push({ cmd, params });
  }
  return tokens;
}

function describeCommand(cmd: string, params: number[]): string {
  const isAbs = cmd === cmd.toUpperCase();
  const rel = isAbs ? '' : ' (relative)';
  const upper = cmd.toUpperCase();

  switch (upper) {
    case 'M':
      if (params.length >= 2) {
        return 'Move to (' + params[0] + ', ' + params[1] + ')' + rel;
      }
      return 'Move' + rel;
    case 'L':
      if (params.length >= 2) {
        return 'Line to (' + params[0] + ', ' + params[1] + ')' + rel;
      }
      return 'Line' + rel;
    case 'H':
      if (params.length >= 1) {
        return 'Horizontal line to x=' + params[0] + rel;
      }
      return 'Horizontal line' + rel;
    case 'V':
      if (params.length >= 1) {
        return 'Vertical line to y=' + params[0] + rel;
      }
      return 'Vertical line' + rel;
    case 'C':
      if (params.length >= 6) {
        return 'Cubic Bezier curve: cp1=(' + params[0] + ',' + params[1] + ') cp2=(' + params[2] + ',' + params[3] + ') end=(' + params[4] + ',' + params[5] + ')' + rel;
      }
      return 'Cubic Bezier curve' + rel;
    case 'S':
      if (params.length >= 4) {
        return 'Smooth cubic Bezier: cp2=(' + params[0] + ',' + params[1] + ') end=(' + params[2] + ',' + params[3] + ')' + rel;
      }
      return 'Smooth cubic Bezier' + rel;
    case 'Q':
      if (params.length >= 4) {
        return 'Quadratic Bezier: cp=(' + params[0] + ',' + params[1] + ') end=(' + params[2] + ',' + params[3] + ')' + rel;
      }
      return 'Quadratic Bezier curve' + rel;
    case 'T':
      if (params.length >= 2) {
        return 'Smooth quadratic Bezier to (' + params[0] + ', ' + params[1] + ')' + rel;
      }
      return 'Smooth quadratic Bezier' + rel;
    case 'A':
      if (params.length >= 7) {
        return 'Arc: rx=' + params[0] + ' ry=' + params[1] + ' x-rotation=' + params[2] + ' large-arc=' + params[3] + ' sweep=' + params[4] + ' end=(' + params[5] + ',' + params[6] + ')' + rel;
      }
      return 'Arc' + rel;
    case 'Z':
      return 'Close path (line to start point)';
    default:
      return 'Unknown command: ' + cmd;
  }
}

// ─── Bounding box estimation ───────────────────────────────────────────────────

function estimateBoundingBox(commands: SvgCommand[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  function track(px: number, py: number) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }

  track(0, 0);

  for (const cmd of commands) {
    const abs = cmd.absolute;
    const p = cmd.params;
    const upper = cmd.command.toUpperCase();

    switch (upper) {
      case 'M':
        x = abs ? p[0] : x + p[0];
        y = abs ? p[1] : y + p[1];
        startX = x; startY = y;
        track(x, y);
        break;
      case 'L':
        x = abs ? p[0] : x + p[0];
        y = abs ? p[1] : y + p[1];
        track(x, y);
        break;
      case 'H':
        x = abs ? p[0] : x + p[0];
        track(x, y);
        break;
      case 'V':
        y = abs ? p[0] : y + p[0];
        track(x, y);
        break;
      case 'C':
        if (p.length >= 6) {
          track(abs ? p[0] : x + p[0], abs ? p[1] : y + p[1]);
          track(abs ? p[2] : x + p[2], abs ? p[3] : y + p[3]);
          x = abs ? p[4] : x + p[4];
          y = abs ? p[5] : y + p[5];
          track(x, y);
        }
        break;
      case 'S':
        if (p.length >= 4) {
          track(abs ? p[0] : x + p[0], abs ? p[1] : y + p[1]);
          x = abs ? p[2] : x + p[2];
          y = abs ? p[3] : y + p[3];
          track(x, y);
        }
        break;
      case 'Q':
        if (p.length >= 4) {
          track(abs ? p[0] : x + p[0], abs ? p[1] : y + p[1]);
          x = abs ? p[2] : x + p[2];
          y = abs ? p[3] : y + p[3];
          track(x, y);
        }
        break;
      case 'T':
        if (p.length >= 2) {
          x = abs ? p[0] : x + p[0];
          y = abs ? p[1] : y + p[1];
          track(x, y);
        }
        break;
      case 'A':
        if (p.length >= 7) {
          x = abs ? p[5] : x + p[5];
          y = abs ? p[6] : y + p[6];
          track(x, y);
        }
        break;
      case 'Z':
        x = startX;
        y = startY;
        break;
      default:
        break;
    }
  }

  if (minX === Infinity) { minX = 0; maxX = 0; minY = 0; maxY = 0; }

  return {
    minX: Math.round(minX * 100) / 100,
    minY: Math.round(minY * 100) / 100,
    maxX: Math.round(maxX * 100) / 100,
    maxY: Math.round(maxY * 100) / 100,
  };
}

// ─── Path length estimation ────────────────────────────────────────────────────

function estimatePathLength(commands: SvgCommand[]): number {
  let length = 0;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  function dist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
  }

  for (const cmd of commands) {
    const abs = cmd.absolute;
    const p = cmd.params;
    const upper = cmd.command.toUpperCase();

    switch (upper) {
      case 'M': {
        const nx = abs ? p[0] : x + p[0];
        const ny = abs ? p[1] : y + p[1];
        x = nx; y = ny; startX = x; startY = y;
        break;
      }
      case 'L': {
        const nx = abs ? p[0] : x + p[0];
        const ny = abs ? p[1] : y + p[1];
        length += dist(x, y, nx, ny);
        x = nx; y = ny;
        break;
      }
      case 'H': {
        const nx = abs ? p[0] : x + p[0];
        length += Math.abs(nx - x);
        x = nx;
        break;
      }
      case 'V': {
        const ny = abs ? p[0] : y + p[0];
        length += Math.abs(ny - y);
        y = ny;
        break;
      }
      case 'C': {
        if (p.length >= 6) {
          const nx = abs ? p[4] : x + p[4];
          const ny = abs ? p[5] : y + p[5];
          // Rough approximation: chord length + control point distances / 2
          length += dist(x, y, nx, ny) * 1.2;
          x = nx; y = ny;
        }
        break;
      }
      case 'S': {
        if (p.length >= 4) {
          const nx = abs ? p[2] : x + p[2];
          const ny = abs ? p[3] : y + p[3];
          length += dist(x, y, nx, ny) * 1.1;
          x = nx; y = ny;
        }
        break;
      }
      case 'Q': {
        if (p.length >= 4) {
          const nx = abs ? p[2] : x + p[2];
          const ny = abs ? p[3] : y + p[3];
          length += dist(x, y, nx, ny) * 1.1;
          x = nx; y = ny;
        }
        break;
      }
      case 'T': {
        if (p.length >= 2) {
          const nx = abs ? p[0] : x + p[0];
          const ny = abs ? p[1] : y + p[1];
          length += dist(x, y, nx, ny) * 1.05;
          x = nx; y = ny;
        }
        break;
      }
      case 'A': {
        if (p.length >= 7) {
          const nx = abs ? p[5] : x + p[5];
          const ny = abs ? p[6] : y + p[6];
          const rx = Math.abs(p[0]);
          const ry = Math.abs(p[1]);
          // Approximate arc length as ellipse arc
          const approx = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry))) / 2;
          length += Math.min(approx, dist(x, y, nx, ny) * 1.5);
          x = nx; y = ny;
        }
        break;
      }
      case 'Z': {
        length += dist(x, y, startX, startY);
        x = startX; y = startY;
        break;
      }
      default:
        break;
    }
  }

  return Math.round(length * 100) / 100;
}

// ─── Main parse function ───────────────────────────────────────────────────────

export function parseSvgPath(d: string): SvgPathResult {
  if (!d.trim()) {
    return {
      commands: [],
      totalSegments: 0,
      boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 },
      pathLengthEstimate: 0,
      summary: '',
    };
  }

  const tokens = tokenizePath(d.trim());
  const commands: SvgCommand[] = tokens.map(function(t) {
    return {
      command: t.cmd,
      params: t.params,
      description: describeCommand(t.cmd, t.params),
      absolute: t.cmd === t.cmd.toUpperCase(),
    };
  });

  const bb = estimateBoundingBox(commands);
  const pathLength = estimatePathLength(commands);
  const width = Math.round((bb.maxX - bb.minX) * 100) / 100;
  const height = Math.round((bb.maxY - bb.minY) * 100) / 100;

  const summary = [
    'Total segments: ' + commands.length,
    'Bounding box:   x=' + bb.minX + ' y=' + bb.minY + ' width=' + width + ' height=' + height,
    'Path length:    ~' + pathLength + ' units (estimated)',
  ].join('\n');

  return { commands, totalSegments: commands.length, boundingBox: bb, pathLengthEstimate: pathLength, summary };
}

export function formatPathOutput(result: SvgPathResult): string {
  if (!result.totalSegments) return '';

  const lines: string[] = [result.summary, '', '--- Segment Breakdown ---'];
  result.commands.forEach(function(cmd, i) {
    const paramStr = cmd.params.length > 0 ? ' [' + cmd.params.join(', ') + ']' : '';
    lines.push((i + 1) + '. ' + cmd.command + paramStr);
    lines.push('   ' + cmd.description);
  });
  return lines.join('\n');
}
