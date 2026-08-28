import { NextRequest, NextResponse } from 'next/server';

// Each accepted request fans out to one outbound Google call per check below,
// so this endpoint is far more expensive than the request that triggers it.
// Throttling it is deliberately not done here: on the hosted site it belongs at
// the edge (Vercel WAF rate-limit rules), and a local checkout does not need it.

type CheckResult = {
  name: string;
  status: 'vulnerable' | 'restricted' | 'error';
  detail: string;
};

type CheckDef = {
  name: string;
  run: (key: string) => Promise<CheckResult>;
};

async function checkJson(
  name: string,
  url: string,
  errorField: string,
): Promise<CheckResult> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const data = await res.json();
    if (data[errorField]) {
      const raw = data[errorField];
      return { name, status: 'restricted', detail: typeof raw === 'string' ? raw : JSON.stringify(raw) };
    }
    return { name, status: 'vulnerable', detail: 'API key is not restricted for this API' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { name, status: 'error', detail: msg };
  }
}

async function checkImage(
  name: string,
  url: string,
): Promise<CheckResult> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('image')) {
      return { name, status: 'vulnerable', detail: 'API key is not restricted for this API' };
    }
    return { name, status: 'restricted', detail: `Response: ${res.status}` };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { name, status: 'error', detail: msg };
  }
}

async function checkPost(
  name: string,
  url: string,
  body: object,
  errorField: string,
  headers?: Record<string, string>,
): Promise<CheckResult> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json();
    if (data[errorField]) {
      return { name, status: 'restricted', detail: typeof data[errorField] === 'string' ? data[errorField] : JSON.stringify(data[errorField]) };
    }
    if (!res.ok) {
      return { name, status: 'restricted', detail: `HTTP ${res.status}` };
    }
    return { name, status: 'vulnerable', detail: 'API key is not restricted for this API' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { name, status: 'error', detail: msg };
  }
}

const checks: CheckDef[] = [
  {
    name: 'Static Map',
    run: (key) =>
      checkImage('Static Map', `https://maps.googleapis.com/maps/api/staticmap?center=45,10&zoom=7&size=400x400&key=${key}`),
  },
  {
    name: 'Street View',
    run: (key) =>
      checkImage('Street View', `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=46.414382,10.013988&fov=80&heading=70&pitch=0&key=${key}`),
  },
  {
    name: 'Directions',
    run: (key) =>
      checkJson('Directions', `https://maps.googleapis.com/maps/api/directions/json?origin=Disneyland&destination=Universal+Studios+Hollywood&key=${key}`, 'error_message'),
  },
  {
    name: 'Geocoding',
    run: (key) =>
      checkJson('Geocoding', `https://maps.googleapis.com/maps/api/geocode/json?latlng=40,30&key=${key}`, 'error_message'),
  },
  {
    name: 'Distance Matrix',
    run: (key) =>
      checkJson('Distance Matrix', `https://maps.googleapis.com/maps/api/distancematrix/json?origins=40.6655101,-73.89188969999998&destinations=40.659569,-73.933783&units=imperial&key=${key}`, 'error_message'),
  },
  {
    name: 'Elevation',
    run: (key) =>
      checkJson('Elevation', `https://maps.googleapis.com/maps/api/elevation/json?locations=39.7391536,-104.9847034&key=${key}`, 'error_message'),
  },
  {
    name: 'Timezone',
    run: (key) =>
      checkJson('Timezone', `https://maps.googleapis.com/maps/api/timezone/json?location=39.6034810,-119.6822510&timestamp=1331161200&key=${key}`, 'errorMessage'),
  },
  {
    name: 'Find Place',
    run: (key) =>
      checkJson('Find Place', `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=Museum+of+Contemporary+Art+Australia&inputtype=textquery&fields=formatted_address,name&key=${key}`, 'error_message'),
  },
  {
    name: 'Autocomplete',
    run: (key) =>
      checkJson('Autocomplete', `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=Bingh&types=%28cities%29&key=${key}`, 'error_message'),
  },
  {
    name: 'Place Details',
    run: (key) =>
      checkJson('Place Details', `https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4&fields=name,rating,formatted_phone_number&key=${key}`, 'error_message'),
  },
  {
    name: 'Nearby Search',
    run: (key) =>
      checkJson('Nearby Search', `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=-33.8670522,151.1957362&radius=100&types=food&name=harbour&key=${key}`, 'error_message'),
  },
  {
    name: 'Text Search',
    run: (key) =>
      checkJson('Text Search', `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+Sydney&key=${key}`, 'error_message'),
  },
  {
    name: 'Nearest Roads',
    run: (key) =>
      checkJson('Nearest Roads', `https://roads.googleapis.com/v1/nearestRoads?points=60.170880,24.942795|60.170879,24.942796|60.170877,24.942796&key=${key}`, 'error'),
  },
  {
    name: 'Snap to Roads',
    run: (key) =>
      checkJson('Snap to Roads', `https://roads.googleapis.com/v1/snapToRoads?path=-35.27801,149.12958|-35.28032,149.12907|-35.28099,149.12929|-35.28144,149.12984|-35.28194,149.13003|-35.28282,149.12956|-35.28302,149.12881|-35.28473,149.12836&interpolate=true&key=${key}`, 'error'),
  },
  {
    name: 'Geolocation',
    run: (key) =>
      checkPost('Geolocation', `https://www.googleapis.com/geolocation/v1/geolocate?key=${key}`, { considerIp: 'true' }, 'error'),
  },
  {
    name: 'Route Directions',
    run: async (key) => {
      try {
        const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
          },
          body: JSON.stringify({
            origin: { location: { latLng: { latitude: 37.419734, longitude: -122.0827784 } } },
            destination: { location: { latLng: { latitude: 37.417670, longitude: -122.079595 } } },
            travelMode: 'DRIVE',
          }),
          signal: AbortSignal.timeout(10_000),
        });
        const data = await res.json();
        if (data.error) {
          return { name: 'Route Directions', status: 'restricted' as const, detail: typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error) };
        }
        if (data.routes) {
          return { name: 'Route Directions', status: 'vulnerable' as const, detail: 'API key is not restricted for this API' };
        }
        return { name: 'Route Directions', status: 'restricted' as const, detail: `HTTP ${res.status}` };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        return { name: 'Route Directions', status: 'error' as const, detail: msg };
      }
    },
  },
  {
    name: 'Address Validation',
    run: (key) =>
      checkPost(
        'Address Validation',
        `https://addressvalidation.googleapis.com/v1:validateAddress?key=${key}`,
        { address: { addressLines: ['1600 Amphitheatre Pkwy'], regionCode: 'US', locality: 'Mountain View' } },
        'error',
      ),
  },
  {
    name: 'Air Quality',
    run: (key) =>
      checkPost(
        'Air Quality',
        `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${key}`,
        { location: { latitude: 37.419734, longitude: -122.0827784 } },
        'error',
      ),
  },
  {
    name: 'FCM',
    run: async (key) => {
      try {
        const res = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: { Authorization: `key=${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_ids: ['test'] }),
          signal: AbortSignal.timeout(10_000),
        });
        if (res.ok) {
          return { name: 'FCM', status: 'vulnerable' as const, detail: 'API key is not restricted for this API' };
        }
        return { name: 'FCM', status: 'restricted' as const, detail: `HTTP ${res.status}` };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        return { name: 'FCM', status: 'error' as const, detail: msg };
      }
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = body.apiKey;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    const trimmed = apiKey.trim();

    if (!/^AIza[0-9A-Za-z_-]{35}$/.test(trimmed)) {
      return NextResponse.json({ error: 'Invalid Google API key format. Keys start with AIza and are 39 characters long.' }, { status: 400 });
    }

    const results = await Promise.all(checks.map((c) => c.run(trimmed)));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
