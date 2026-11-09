import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
// Queue public-service requests within this server process; cache repeated lookups.
let queue: Promise<unknown> = Promise.resolve();
let lastRequest = 0;
const cache = new Map<string, { expires: number; data: unknown }>();

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams;
  const params = new URLSearchParams({ format: 'jsonv2', 'accept-language': 'en' });
  const reverse = input.get('mode') === 'reverse';
  const suggest = input.get('mode') === 'suggest';
  if (reverse) {
    const lat = Number(input.get('lat'));
    const lon = Number(input.get('lon'));
    if (!input.has('lat') || !input.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });
    }
    params.set('lat', String(lat)); params.set('lon', String(lon));
  } else {
    const query = input.get('q')?.trim() || '';
    if (query.length < 3 || query.length > 200) return NextResponse.json({ error: 'Enter a place name between 3 and 200 characters.' }, { status: 400 });
    params.set('q', query); params.set('limit', '6');

  }
  const providerParams = suggest ? new URLSearchParams({ q: input.get('q')!.trim(), limit: '6', lang: 'en' }) : params;
  const endpoint = `${suggest ? 'suggest' : reverse ? 'reverse' : 'search'}?${providerParams}`;
  const saved = cache.get(endpoint);
  if (saved && saved.expires > Date.now()) return NextResponse.json(saved.data);
  const job = queue.then(async () => {
    const repeated = cache.get(endpoint);
    if (repeated && repeated.expires > Date.now()) return repeated.data;
    await new Promise(resolve => setTimeout(resolve, Math.max(0, 1100 - (Date.now() - lastRequest))));
    lastRequest = Date.now();
    const providerUrl = suggest
      ? `${process.env.PHOTON_API_URL || 'https://photon.komoot.io/api/'}?${providerParams}`
      : `https://nominatim.openstreetmap.org/${endpoint}`;
    const response = await fetch(providerUrl, {
      headers: { 'User-Agent': 'FloodRisk/1.1.5 (https://github.com/theub002/FloodRisk)', Accept: 'application/json' },
      signal: AbortSignal.timeout(10000), cache: 'no-store',
    });
    if (!response.ok) throw new Error('Location search is temporarily unavailable. Try again or place the pin on the map.');
    const raw = await response.json();
    if (raw.error) throw new Error('No address found at this point.');
    const data = suggest ? (raw.features || []).map((feature: {
      geometry: { coordinates: number[] };
      properties: { osm_type?: string; osm_id?: number; name?: string; street?: string; city?: string; state?: string; country?: string; extent?: number[]; type?: string };
    }) => {
      const p = feature.properties;
      return {
        place_id: `${p.osm_type}-${p.osm_id}`,
        display_name: [...new Set([p.name, p.street, p.city, p.state, p.country].filter(Boolean))].join(', '),
        lat: String(feature.geometry.coordinates[1]), lon: String(feature.geometry.coordinates[0]),
        // Photon extent: west, north, east, south. Leaflet bounds: south/west, north/east.
        bounds: p.extent ? [[p.extent[3], p.extent[0]], [p.extent[1], p.extent[2]]] : undefined,
        type: p.type,
      };
    }) : raw;
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(endpoint, { data, expires: Date.now() + 3600000 });
    return data;
  });
  queue = job.catch(() => undefined);
  try { return NextResponse.json(await job); }
  catch { return NextResponse.json({ error: 'Location service unavailable. Try again or click the map to place your pin.' }, { status: 502 }); }
}
