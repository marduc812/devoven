// Weather Calculator — pure logic, no browser APIs

export type WeatherInput = {
  tempC: number | null;
  tempF: number | null;
  windKmh: number | null;
  windMph: number | null;
  windMs: number | null;
  rhPct: number | null;
};

export type WeatherResult = {
  tempC: number;
  tempF: number;
  windKmh: number;
  windMph: number;
  windChill: number | null;
  windChillNote: string;
  heatIndex: number | null;
  heatIndexNote: string;
  dewPoint: number | null;
  dewPointNote: string;
};

function cToF(c: number): number { return c * 9 / 5 + 32; }
function fToC(f: number): number { return (f - 32) * 5 / 9; }
function kmhToMph(k: number): number { return k / 1.609344; }
function mphToKmh(m: number): number { return m * 1.609344; }
function msToKmh(ms: number): number { return ms * 3.6; }

/** NWS Wind Chill formula.
 *  Valid for T ≤ 50°F (10°C) and wind ≥ 3 mph (4.8 km/h).
 *  Returns result in °F.
 */
export function windChillF(tempF: number, windMph: number): number | null {
  if (tempF > 50 || windMph < 3) return null;
  return 35.74 + 0.6215 * tempF - 35.75 * Math.pow(windMph, 0.16) + 0.4275 * tempF * Math.pow(windMph, 0.16);
}

/** Rothfuss / NWS Heat Index formula.
 *  Valid for T ≥ 80°F (26.7°C) and RH ≥ 40%.
 *  Returns result in °F.
 */
export function heatIndexF(tempF: number, rhPct: number): number | null {
  if (tempF < 80 || rhPct < 40) return null;
  const T = tempF;
  const R = rhPct;
  return -42.379
    + 2.04901523 * T
    + 10.14333127 * R
    - 0.22475541 * T * R
    - 0.00683783 * T * T
    - 0.05481717 * R * R
    + 0.00122874 * T * T * R
    + 0.00085282 * T * R * R
    - 0.00000199 * T * T * R * R;
}

/** Magnus formula for dew point.
 *  Valid for temperature range −40°C to 60°C and RH > 0.
 *  Returns °C.
 */
export function dewPointC(tempC: number, rhPct: number): number {
  const a = 17.625;
  const b = 243.04;
  const gamma = (a * tempC) / (b + tempC) + Math.log(rhPct / 100);
  return (b * gamma) / (a - gamma);
}

/** Parse key=value lines from the user input.
 *  Keys: T (temperature), W (wind), RH (relative humidity)
 *  Values: 20°C, 72°F, 10km/h, 15mph, 5m/s, 65%
 */
export function parseWeatherInput(input: string): WeatherInput {
  const result: WeatherInput = {
    tempC: null, tempF: null,
    windKmh: null, windMph: null, windMs: null,
    rhPct: null,
  };

  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim().toUpperCase();
    const val = trimmed.slice(eqIdx + 1).trim().toLowerCase();

    const numMatch = val.match(/^([+-]?\d+(?:\.\d+)?)/);
    if (!numMatch) continue;
    const num = parseFloat(numMatch[1]);
    const rest = val.slice(numMatch[0].length).trim();

    if (key === 'T' || key === 'TEMP' || key === 'TEMPERATURE') {
      if (rest.includes('f')) { result.tempF = num; }
      else { result.tempC = num; } // default °C
    } else if (key === 'W' || key === 'WIND') {
      if (rest.includes('mph')) { result.windMph = num; }
      else if (rest.includes('m/s') || rest.includes('ms')) { result.windMs = num; }
      else { result.windKmh = num; } // default km/h
    } else if (key === 'RH' || key === 'HUMIDITY') {
      result.rhPct = num;
    }
  }

  return result;
}

export function computeWeather(inp: WeatherInput): WeatherResult {
  // Resolve temperature to both scales
  let tempC: number;
  let tempF: number;

  if (inp.tempC !== null) {
    tempC = inp.tempC;
    tempF = cToF(tempC);
  } else if (inp.tempF !== null) {
    tempF = inp.tempF;
    tempC = fToC(tempF);
  } else {
    throw new Error('Provide temperature: T=20°C or T=72°F');
  }

  // Resolve wind speed to km/h and mph
  let windKmh: number;
  let windMph: number;

  if (inp.windKmh !== null) {
    windKmh = inp.windKmh;
    windMph = kmhToMph(windKmh);
  } else if (inp.windMph !== null) {
    windMph = inp.windMph;
    windKmh = mphToKmh(windMph);
  } else if (inp.windMs !== null) {
    windKmh = msToKmh(inp.windMs);
    windMph = kmhToMph(windKmh);
  } else {
    windKmh = 0;
    windMph = 0;
  }

  const rh = inp.rhPct;

  // Wind chill
  const wcF = windChillF(tempF, windMph);
  const windChill = wcF !== null ? fToC(wcF) : null;
  const windChillNote = wcF !== null
    ? ''
    : (tempF > 50
        ? 'Wind chill is not applicable above 50°F (10°C)'
        : 'Wind chill requires wind ≥ 3 mph');

  // Heat index
  const hiF = rh !== null ? heatIndexF(tempF, rh) : null;
  const heatIndex = hiF !== null ? fToC(hiF) : null;
  const heatIndexNote = rh === null
    ? 'Provide RH=<percent> for heat index'
    : hiF !== null
      ? ''
      : (tempF < 80
          ? 'Heat index is not applicable below 80°F (26.7°C)'
          : 'Heat index requires RH ≥ 40%');

  // Dew point
  const dewPoint = rh !== null ? dewPointC(tempC, rh) : null;
  const dewPointNote = rh === null ? 'Provide RH=<percent> for dew point' : '';

  return {
    tempC,
    tempF,
    windKmh,
    windMph,
    windChill,
    windChillNote,
    heatIndex,
    heatIndexNote,
    dewPoint,
    dewPointNote,
  };
}

export function formatTemp(c: number): string {
  return `${c.toFixed(1)}°C (${cToF(c).toFixed(1)}°F)`;
}
