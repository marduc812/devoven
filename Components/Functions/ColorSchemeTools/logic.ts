function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0,2),16)/255, g = parseInt(h.slice(2,4),16)/255, b = parseInt(h.slice(4,6),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let hue = 0, sat = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: hue = ((g-b)/d + (g<b?6:0)) / 6; break;
      case g: hue = ((b-r)/d + 2) / 6; break;
      case b: hue = ((r-g)/d + 4) / 6; break;
    }
  }
  return [Math.round(hue*360), Math.round(sat*100), Math.round(l*100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const sl = s/100, ll = l/100;
  const a = sl * Math.min(ll, 1 - ll);
  const f = (n: number) => {
    const k = (n + h/30) % 12;
    const color = ll - a * Math.max(Math.min(k-3, 9-k, 1), -1);
    return Math.round(255*color).toString(16).padStart(2,'0').toUpperCase();
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function generateColorScheme(hex: string): string {
  const h = hex.replace('#','');
  if (!/^[0-9A-Fa-f]{6}$/.test(h)) throw new Error('Invalid hex color');
  const [hue, sat, lig] = hexToHsl('#'+h);

  const schemes: Record<string, string[]> = {
    Complementary: [hslToHex(hue, sat, lig), hslToHex((hue+180)%360, sat, lig)],
    Triadic: [hslToHex(hue,sat,lig), hslToHex((hue+120)%360,sat,lig), hslToHex((hue+240)%360,sat,lig)],
    Tetradic: [hslToHex(hue,sat,lig), hslToHex((hue+90)%360,sat,lig), hslToHex((hue+180)%360,sat,lig), hslToHex((hue+270)%360,sat,lig)],
    Analogous: [hslToHex((hue-30+360)%360,sat,lig), hslToHex(hue,sat,lig), hslToHex((hue+30)%360,sat,lig)],
    'Split-Complementary': [hslToHex(hue,sat,lig), hslToHex((hue+150)%360,sat,lig), hslToHex((hue+210)%360,sat,lig)],
    Monochromatic: [
      hslToHex(hue,sat,Math.max(0,lig-30)), hslToHex(hue,sat,Math.max(0,lig-15)),
      hslToHex(hue,sat,lig), hslToHex(hue,sat,Math.min(100,lig+15)), hslToHex(hue,sat,Math.min(100,lig+30))
    ],
  };

  const lines = [`Base color: #${h.toUpperCase()} (hsl(${hue}, ${sat}%, ${lig}%))\n`];
  for (const [name, colors] of Object.entries(schemes)) {
    lines.push(`=== ${name} ===`);
    lines.push(colors.join('  '));
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}
