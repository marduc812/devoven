'use client';

import React from 'react';

// A labelled sketch of the shape currently being measured. Every drawing is built
// from the real parameters, so a 10×2 rectangle looks like a 10×2 rectangle and it
// is obvious which input is which edge.

const VIEW_W = 260;
const VIEW_H = 170;
// Wider side margins than top and bottom: the edge labels sit outside the shape
// and read horizontally, so they need the room on the left and right.
const PAD_X = 60;
const PAD_Y = 28;

const STROKE = '#111827';
const FILL = '#f3f4f6';
const GUIDE = '#9ca3af';

type Pt = [number, number];

/** Scales a shape described in real units (y up) into the SVG box (y down). */
function fit(points: Pt[]): Pt[] {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = Math.max(...xs) - minX || 1;
  const height = Math.max(...ys) - minY || 1;

  const k = Math.min((VIEW_W - PAD_X * 2) / width, (VIEW_H - PAD_Y * 2) / height);
  const ox = (VIEW_W - width * k) / 2 - minX * k;
  const oy = (VIEW_H - height * k) / 2 - minY * k;

  return points.map(([x, y]) => [x * k + ox, VIEW_H - (y * k + oy)]);
}

function centroid(points: Pt[]): Pt {
  const n = points.length;
  return [points.reduce((s, p) => s + p[0], 0) / n, points.reduce((s, p) => s + p[1], 0) / n];
}

const Label = ({ x, y, text }: { x: number; y: number; text: string }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    dominantBaseline="middle"
    fontSize="10"
    fontFamily="ui-monospace, monospace"
    fill="#4b5563"
  >
    {text}
  </text>
);

/** Draws a closed outline and pushes each labelled edge's text outwards. */
function Polygon({ points, edges }: { points: Pt[]; edges?: Record<number, string> }) {
  const fitted = fit(points);
  const [cx, cy] = centroid(fitted);

  return (
    <>
      <polygon
        points={fitted.map((p) => p.join(',')).join(' ')}
        fill={FILL}
        stroke={STROKE}
        strokeWidth="1.5"
      />
      {Object.entries(edges ?? {}).map(([index, text]) => {
        const from = fitted[Number(index)];
        const to = fitted[(Number(index) + 1) % fitted.length];
        const mx = (from[0] + to[0]) / 2;
        const my = (from[1] + to[1]) / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const len = Math.hypot(dx, dy) || 1;
        // Sideways the label has to clear its own width, not just the outline, or
        // a label on a vertical edge lands on top of that edge.
        const clearance = 14 + text.length * 3;
        return (
          <Label
            key={index}
            x={mx + (dx / len) * clearance}
            y={my + (dy / len) * 16}
            text={text}
          />
        );
      })}
    </>
  );
}

/** A dashed measurement line with its label at the midpoint. */
const Guide = ({ x1, y1, x2, y2, text, dx = 0, dy = 0 }: {
  x1: number; y1: number; x2: number; y2: number; text: string; dx?: number; dy?: number;
}) => (
  <>
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3" />
    <Label x={(x1 + x2) / 2 + dx} y={(y1 + y2) / 2 + dy} text={text} />
  </>
);

const num = (n: number) => parseFloat(n.toPrecision(4)).toString();

function drawing(variant: string, p: Record<string, number>): React.ReactNode {
  const v = (key: string, fallback = 1) => (isFinite(p[key]) && p[key] > 0 ? p[key] : fallback);

  switch (variant) {
    case 'circle': {
      const r = 58;
      return (
        <>
          <circle cx={VIEW_W / 2} cy={VIEW_H / 2} r={r} fill={FILL} stroke={STROKE} strokeWidth="1.5" />
          <Guide
            x1={VIEW_W / 2} y1={VIEW_H / 2} x2={VIEW_W / 2 + r} y2={VIEW_H / 2}
            text={`r = ${num(v('r'))}`} dy={-10}
          />
          <circle cx={VIEW_W / 2} cy={VIEW_H / 2} r="2" fill={STROKE} />
        </>
      );
    }

    case 'ellipse': {
      const a = v('a', 6);
      const b = v('b', 4);
      const k = Math.min((VIEW_W - PAD_X * 2) / 2 / a, (VIEW_H - PAD_Y * 2) / 2 / b);
      return (
        <>
          <ellipse
            cx={VIEW_W / 2} cy={VIEW_H / 2} rx={a * k} ry={b * k}
            fill={FILL} stroke={STROKE} strokeWidth="1.5"
          />
          <Guide
            x1={VIEW_W / 2} y1={VIEW_H / 2} x2={VIEW_W / 2 + a * k} y2={VIEW_H / 2}
            text={`a = ${num(a)}`} dy={13}
          />
          <Guide
            x1={VIEW_W / 2} y1={VIEW_H / 2} x2={VIEW_W / 2} y2={VIEW_H / 2 - b * k}
            text={`b = ${num(b)}`} dx={-20}
          />
        </>
      );
    }

    case 'square': {
      const s = v('s', 5);
      return (
        <Polygon
          points={[[0, 0], [1, 0], [1, 1], [0, 1]]}
          edges={{ 0: `s = ${num(s)}`, 1: `s = ${num(s)}` }}
        />
      );
    }

    case 'rectangle': {
      const w = v('w', 8);
      const h = v('h', 5);
      return (
        <Polygon
          points={[[0, 0], [w, 0], [w, h], [0, h]]}
          edges={{ 0: `w = ${num(w)}`, 1: `h = ${num(h)}` }}
        />
      );
    }

    case 'triangle-sss': {
      const a = v('a', 3);
      const b = v('b', 4);
      const c = v('c', 5);
      // Side a lies on the base; the apex is wherever sides b and c meet.
      const x = (a * a + c * c - b * b) / (2 * a);
      const ySquared = c * c - x * x;
      const valid = ySquared > 0;
      const apex: Pt = valid ? [x, Math.sqrt(ySquared)] : [a / 2, a * 0.7];
      return (
        <>
          <Polygon
            points={[[0, 0], [a, 0], apex]}
            edges={{ 0: `a = ${num(a)}`, 1: `b = ${num(b)}`, 2: `c = ${num(c)}` }}
          />
          {!valid && (
            <text x={VIEW_W / 2} y={VIEW_H - 8} textAnchor="middle" fontSize="9" fill="#dc2626">
              not a valid triangle — sketch is illustrative
            </text>
          )}
        </>
      );
    }

    case 'triangle-bh': {
      const base = v('base', 8);
      const h = v('h', 5);
      const fitted = fit([[0, 0], [base, 0], [base / 2, h]]);
      return (
        <>
          <Polygon points={[[0, 0], [base, 0], [base / 2, h]]} edges={{ 0: `base = ${num(base)}` }} />
          <Guide
            x1={fitted[2][0]} y1={fitted[2][1]} x2={fitted[2][0]} y2={fitted[0][1]}
            text={`h = ${num(h)}`} dx={26}
          />
        </>
      );
    }

    case 'trapezoid': {
      const a = v('a', 8);
      const b = v('b', 5);
      const h = v('h', 4);
      const points: Pt[] = [[0, 0], [a, 0], [(a + b) / 2, h], [(a - b) / 2, h]];
      const fitted = fit(points);
      return (
        <>
          <Polygon points={points} edges={{ 0: `a = ${num(a)}`, 2: `b = ${num(b)}` }} />
          <Guide
            x1={fitted[3][0]} y1={fitted[3][1]} x2={fitted[3][0]} y2={fitted[0][1]}
            text={`h = ${num(h)}`} dx={-34}
          />
        </>
      );
    }

    case 'parallelogram': {
      const b = v('b', 8);
      const h = v('h', 4);
      const s = v('s', 5);
      // The lean follows from the side and the height; a side shorter than the
      // height cannot slant, so it is drawn upright.
      const offset = Math.sqrt(Math.max(s * s - h * h, 0));
      const points: Pt[] = [[0, 0], [b, 0], [b + offset, h], [offset, h]];
      const fitted = fit(points);
      return (
        <>
          <Polygon points={points} edges={{ 0: `b = ${num(b)}`, 1: `s = ${num(s)}` }} />
          {/* The height is the vertical drop from the top-left corner, not the side. */}
          <Guide
            x1={fitted[3][0]} y1={fitted[3][1]} x2={fitted[3][0]} y2={fitted[0][1]}
            text={`h = ${num(h)}`} dx={-34}
          />
        </>
      );
    }

    case 'polygon': {
      const n = Math.max(3, Math.min(Math.round(v('n', 6)), 24));
      const s = v('s', 4);
      const points: Pt[] = Array.from({ length: n }, (_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2 + Math.PI / n;
        return [Math.cos(angle), Math.sin(angle)];
      });
      return <Polygon points={points} edges={{ 0: `s = ${num(s)}` }} />;
    }

    case 'sphere': {
      const r = 58;
      const cx = VIEW_W / 2;
      const cy = VIEW_H / 2;
      return (
        <>
          <circle cx={cx} cy={cy} r={r} fill={FILL} stroke={STROKE} strokeWidth="1.5" />
          {/* Equator: the front half solid, the hidden half dashed. */}
          <path d={`M ${cx - r} ${cy} A ${r} ${r * 0.28} 0 0 0 ${cx + r} ${cy}`} fill="none" stroke={STROKE} strokeWidth="1" />
          <path d={`M ${cx - r} ${cy} A ${r} ${r * 0.28} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3" />
          <Guide x1={cx} y1={cy} x2={cx + r * 0.72} y2={cy - r * 0.7} text={`r = ${num(v('r'))}`} dx={12} dy={-8} />
        </>
      );
    }

    case 'cube': {
      const s = 84;
      const d = 30; // depth offset for the isometric back face
      const x = (VIEW_W - s - d) / 2;
      const y = (VIEW_H - s - d) / 2 + d;
      return (
        <>
          {/* Hidden back corner */}
          <polyline
            points={`${x + d},${y - d + s} ${x + d},${y - d} ${x},${y}`}
            fill="none" stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3"
          />
          <polyline
            points={`${x + d},${y - d + s} ${x + d + s},${y - d + s}`}
            fill="none" stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3"
          />
          {/* Top face */}
          <polygon points={`${x},${y} ${x + d},${y - d} ${x + s + d},${y - d} ${x + s},${y}`} fill="#e5e7eb" stroke={STROKE} strokeWidth="1.5" />
          {/* Right face */}
          <polygon points={`${x + s},${y} ${x + s + d},${y - d} ${x + s + d},${y - d + s} ${x + s},${y + s}`} fill="#e5e7eb" stroke={STROKE} strokeWidth="1.5" />
          {/* Front face */}
          <rect x={x} y={y} width={s} height={s} fill={FILL} stroke={STROKE} strokeWidth="1.5" />
          <Label x={x + s / 2} y={y + s + 14} text={`s = ${num(v('s', 4))}`} />
        </>
      );
    }

    case 'cylinder': {
      const r = v('r', 3);
      const h = v('h', 8);
      const k = Math.min((VIEW_W - PAD_X * 2) / (2 * r), (VIEW_H - PAD_Y * 2 - 12) / h);
      const rx = r * k;
      const ry = Math.min(rx * 0.3, 18);
      const height = h * k;
      const cx = VIEW_W / 2;
      const top = (VIEW_H - height) / 2;
      return (
        <>
          <path
            d={`M ${cx - rx} ${top} L ${cx - rx} ${top + height} A ${rx} ${ry} 0 0 0 ${cx + rx} ${top + height} L ${cx + rx} ${top} Z`}
            fill={FILL} stroke={STROKE} strokeWidth="1.5"
          />
          <path d={`M ${cx - rx} ${top + height} A ${rx} ${ry} 0 0 1 ${cx + rx} ${top + height}`} fill="none" stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3" />
          <ellipse cx={cx} cy={top} rx={rx} ry={ry} fill="#e5e7eb" stroke={STROKE} strokeWidth="1.5" />
          <Guide x1={cx} y1={top} x2={cx + rx} y2={top} text={`r = ${num(r)}`} dy={-14} />
          <Guide x1={cx + rx + 16} y1={top} x2={cx + rx + 16} y2={top + height} text={`h = ${num(h)}`} dx={24} />
        </>
      );
    }

    case 'cone': {
      const r = v('r', 3);
      const h = v('h', 6);
      const k = Math.min((VIEW_W - PAD_X * 2) / (2 * r), (VIEW_H - PAD_Y * 2 - 12) / h);
      const rx = r * k;
      const ry = Math.min(rx * 0.3, 18);
      const height = h * k;
      const cx = VIEW_W / 2;
      const base = (VIEW_H + height) / 2;
      return (
        <>
          <path
            d={`M ${cx - rx} ${base} L ${cx} ${base - height} L ${cx + rx} ${base} A ${rx} ${ry} 0 0 1 ${cx - rx} ${base} Z`}
            fill={FILL} stroke={STROKE} strokeWidth="1.5"
          />
          <path d={`M ${cx - rx} ${base} A ${rx} ${ry} 0 0 0 ${cx + rx} ${base}`} fill="none" stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3" />
          <Guide x1={cx} y1={base} x2={cx + rx} y2={base} text={`r = ${num(r)}`} dy={ry + 13} />
          <Guide x1={cx} y1={base} x2={cx} y2={base - height} text={`h = ${num(h)}`} dx={24} />
        </>
      );
    }

    case 'pyramid': {
      const b = v('b', 6);
      const h = v('h', 8);
      const k = Math.min((VIEW_W - PAD_X * 2) / (b * 1.4), (VIEW_H - PAD_Y * 2) / h);
      const half = (b * k) / 2;
      const depth = half * 0.55;
      const height = h * k;
      const cx = VIEW_W / 2;
      const base = (VIEW_H + height) / 2;
      const apex = base - height;
      return (
        <>
          {/* Base square in perspective, back edges dashed */}
          <polyline
            points={`${cx - half} ${base} ${cx - half + depth} ${base - depth} ${cx + half + depth} ${base - depth} ${cx + half} ${base}`}
            fill="none" stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3"
          />
          <line x1={cx - half + depth} y1={base - depth} x2={cx} y2={apex} stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3" />
          <polygon points={`${cx - half},${base} ${cx + half},${base} ${cx},${apex}`} fill={FILL} stroke={STROKE} strokeWidth="1.5" />
          <polygon points={`${cx + half},${base} ${cx + half + depth},${base - depth} ${cx},${apex}`} fill="#e5e7eb" stroke={STROKE} strokeWidth="1.5" />
          <Guide x1={cx} y1={base} x2={cx} y2={apex} text={`h = ${num(h)}`} dx={-24} />
          <Label x={cx} y={base + 14} text={`b = ${num(b)}`} />
        </>
      );
    }

    default:
      return null;
  }
}

const Diagram = ({ variant, params }: { variant: string; params: Record<string, number> }) => (
  <svg
    viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
    className="w-full h-auto max-h-56"
    role="img"
    aria-label={`Diagram of the ${variant.replace(/-/g, ' ')} being measured`}
  >
    {drawing(variant, params)}
  </svg>
);

export default Diagram;
