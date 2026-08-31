'use client';

import { useState, useEffect, useMemo } from 'react';
import Panel from '@/Components/MainView/MainPanel/Panel';
import {
  btnSecondaryClass,
  hintClass,
  inputClass,
  labelClass,
  sectionClass,
  segOff,
  segOn,
} from '@/Components/MainView/MainPanel/formControls';
import {
  compassPoint,
  haversineDistance,
  initialBearing,
  latError,
  lonError,
  parseCoordPair,
  toDms,
  KM_TO_MILES,
  KM_TO_NAUTICAL_MILES,
} from './logic';

interface Point { lat: string; lon: string }

const PRESETS: Array<{ label: string; a: Point; b: Point }> = [
  {
    label: 'London → Paris',
    a: { lat: '51.5074', lon: '-0.1278' },
    b: { lat: '48.8566', lon: '2.3522' },
  },
  {
    label: 'New York → Tokyo',
    a: { lat: '40.7128', lon: '-74.0060' },
    b: { lat: '35.6762', lon: '139.6503' },
  },
  {
    label: 'Sydney → Cape Town',
    a: { lat: '-33.8688', lon: '151.2093' },
    b: { lat: '-33.9249', lon: '18.4241' },
  },
];

const Stat = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
  <div className="border border-gray-200 bg-gray-50 p-4">
    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{label}</p>
    <p className="text-2xl font-black text-gray-900 tracking-tight font-mono">
      {value} <span className="text-sm font-bold text-gray-500">{unit}</span>
    </p>
  </div>
);

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export function HaversineDistance() {
  const [a, setA] = useState<Point>(PRESETS[0].a);
  const [b, setB] = useState<Point>(PRESETS[0].b);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // ?from= still accepts the old two-lines-of-"lat,lon" payload.
    const from = params.get('from');
    const pair = from ? parseCoordPair(from) : null;
    let nextA = pair ? { lat: String(pair[0].lat), lon: String(pair[0].lon) } : null;
    let nextB = pair ? { lat: String(pair[1].lat), lon: String(pair[1].lon) } : null;

    const read = (key: string, point: Point | null, field: 'lat' | 'lon'): Point | null => {
      const value = params.get(key);
      if (value === null) return point;
      return { ...(point ?? { lat: '', lon: '' }), [field]: value };
    };
    nextA = read('lat1', nextA, 'lat');
    nextA = read('lon1', nextA, 'lon');
    nextB = read('lat2', nextB, 'lat');
    nextB = read('lon2', nextB, 'lon');

    if (nextA) setA(nextA);
    if (nextB) setB(nextB);
  }, []);

  const errors = {
    aLat: latError(parseFloat(a.lat)),
    aLon: lonError(parseFloat(a.lon)),
    bLat: latError(parseFloat(b.lat)),
    bLon: lonError(parseFloat(b.lon)),
  };
  const valid = Object.values(errors).every(e => e === '');

  const result = useMemo(() => {
    if (!valid) return null;
    const lat1 = parseFloat(a.lat), lon1 = parseFloat(a.lon);
    const lat2 = parseFloat(b.lat), lon2 = parseFloat(b.lon);
    const km = haversineDistance(lat1, lon1, lat2, lon2);
    const bearing = initialBearing(lat1, lon1, lat2, lon2);
    return {
      km,
      miles: km * KM_TO_MILES,
      nm: km * KM_TO_NAUTICAL_MILES,
      meters: km * 1000,
      bearing,
      compass: compassPoint(bearing),
      dms: {
        a: `${toDms(lat1, 'lat')} ${toDms(lon1, 'lon')}`,
        b: `${toDms(lat2, 'lat')} ${toDms(lon2, 'lon')}`,
      },
    };
  }, [a.lat, a.lon, b.lat, b.lon, valid]);

  const matchesPreset = (preset: (typeof PRESETS)[number]) =>
    preset.a.lat === a.lat && preset.a.lon === a.lon && preset.b.lat === b.lat && preset.b.lon === b.lon;

  const swap = () => { setA(b); setB(a); };

  const renderPoint = (
    name: string,
    prefix: string,
    point: Point,
    setPoint: (p: Point) => void,
    latErr: string,
    lonErr: string,
  ) => (
    <div>
      <p className={sectionClass}>{name}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
        <div>
          <label className={labelClass} htmlFor={`${prefix}-lat`}>Latitude</label>
          <input
            id={`${prefix}-lat`}
            className={`${inputClass} font-mono`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="51.5074"
            value={point.lat}
            onChange={e => setPoint({ ...point, lat: e.target.value })}
          />
          {latErr && <p className="text-xs text-red-700 mt-1">{latErr}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor={`${prefix}-lon`}>Longitude</label>
          <input
            id={`${prefix}-lon`}
            className={`${inputClass} font-mono`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="-0.1278"
            value={point.lon}
            onChange={e => setPoint({ ...point, lon: e.target.value })}
          />
          {lonErr && <p className="text-xs text-red-700 mt-1">{lonErr}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <Panel
      title="Haversine Distance Calculator"
      description="Great-circle distance between two points, straight over the surface of the sphere — no roads, no flight paths. Enter decimal degrees, or paste a pair into the URL, e.g. [1 ?lat1=51.5074&lon1=-0.1278&lat2=48.8566&lon2=2.3522 2]."
      backColor="lime"
      extraElements={
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          {/* Input */}
          <div className="flex flex-col gap-8">
            {renderPoint('Point 1', 'hav-a', a, setA, errors.aLat, errors.aLon)}
            {renderPoint('Point 2', 'hav-b', b, setB, errors.bLat, errors.bLon)}

            <div>
              <p className={sectionClass}>Examples</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(preset => (
                  <button
                    key={preset.label}
                    className={matchesPreset(preset) ? segOn : segOff}
                    onClick={() => { setA(preset.a); setB(preset.b); }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className={btnSecondaryClass} onClick={swap}>Swap points</button>
            </div>
          </div>

          {/* Result */}
          <div className="flex flex-col gap-8">
            <div>
              <p className={sectionClass}>Distance</p>
              {result ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Stat label="Kilometres" value={fmt(result.km)} unit="km" />
                  <Stat label="Miles" value={fmt(result.miles)} unit="mi" />
                  <Stat label="Nautical miles" value={fmt(result.nm)} unit="nm" />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Enter valid coordinates for both points.</p>
              )}
            </div>

            {result && (
              <>
                <div>
                  <p className={sectionClass}>Initial bearing</p>
                  <div className="border border-gray-200 bg-gray-50 p-4">
                    <p className="text-2xl font-black text-gray-900 tracking-tight font-mono">
                      {result.bearing.toFixed(2)}° <span className="text-sm font-bold text-gray-500">{result.compass}</span>
                    </p>
                  </div>
                  <p className={hintClass}>
                    The heading at Point 1. It shifts along a great circle, so it is not the heading you hold for the
                    whole route.
                  </p>
                </div>

                <div>
                  <p className={sectionClass}>Details</p>
                  <table className="w-full text-sm">
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Metres</td>
                        <td className="py-2 text-right font-mono text-gray-900">
                          {result.meters.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Point 1 (DMS)</td>
                        <td className="py-2 text-right font-mono text-gray-900">{result.dms.a}</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-gray-600">Point 2 (DMS)</td>
                        <td className="py-2 text-right font-mono text-gray-900">{result.dms.b}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className={hintClass}>
                    Computed on a sphere of radius 6371.0088 km. Against the WGS-84 ellipsoid the error is up to
                    about 0.5%.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      }
    />
  );
}
