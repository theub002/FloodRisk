'use client';

import { useEffect, useRef, useState, useTransition, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Locate, AlertTriangle, MapPin, Search, X, Loader2 } from 'lucide-react';

// Create classic standard location map pin pointer (Google / Leaflet teardrop style)
const createStandardLocationPin = () => {
  return L.divIcon({
    className: 'custom-location-pin',
    html: `
      <div style="
        position: relative;
        width: 30px;
        height: 42px;
        filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));
        cursor: grab;
      ">
        <svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 0C6.71573 0 0 6.71573 0 15C0 25.5 15 42 15 42C15 42 30 25.5 30 15C30 6.71573 23.2843 0 15 0Z" fill="#EF4444" stroke="#FFFFFF" stroke-width="1.8"/>
          <circle cx="15" cy="14" r="5" fill="#FFFFFF"/>
        </svg>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

interface SearchResultItem {
  place_id: string | number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  bounds?: [[number, number], [number, number]];
  type?: string;
}

interface ReportMapPickerProps {
  latitude: number;
  longitude: number;
  onChangeLocation: (lat: number, lng: number, placeName?: string) => void;
  theme: 'light' | 'dark';
  readOnly?: boolean;
  onAddressDetected?: (address: string) => void;
}

// Controller to handle clicks on the map and map center updates
function MapClickWatcher({
  onChangeLocation,
  readOnly,
}: {
  onChangeLocation: (lat: number, lng: number) => void;
  readOnly?: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!readOnly) {
        onChangeLocation(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function PanToLocation({ lat, lng, preview }: { lat: number; lng: number; preview: SearchResultItem | null }) {
  const map = useMap();
  useEffect(() => {
    if (preview) {
      const point: [number, number] = [Number(preview.lat), Number(preview.lon)];
      if (preview.bounds) map.flyToBounds(preview.bounds, { padding: [30, 30], maxZoom: 16, duration: 0.7 });
      else map.flyTo(point, ['country', 'state'].includes(preview.type || '') ? 6 : ['city', 'town', 'village'].includes(preview.type || '') ? 12 : 16, { duration: 0.7 });
    } else if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.flyTo([lat, lng], map.getZoom() < 14 ? 15 : map.getZoom(), {
        duration: 0.8,
      });
    }
  }, [lat, lng, preview, map]);
  return null;
}

export default function ReportMapPicker({
  latitude,
  longitude,
  onChangeLocation,
  readOnly = false,
  onAddressDetected,
}: ReportMapPickerProps) {
  const [pinIcon] = useState(createStandardLocationPin);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [gpsFix, setGpsFix] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const markerRef = useRef<L.Marker>(null);
  const [, startTransition] = useTransition();

  // Location address name state
  const [resolvedAddress, setResolvedAddress] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const locationName = resolvedAddress?.lat === latitude && resolvedAddress?.lng === longitude ? resolvedAddress.name : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  const [isResolvingAddress, setIsResolvingAddress] = useState<boolean>(false);

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [preview, setPreview] = useState<SearchResultItem | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const [searchError, setSearchError] = useState('');
  const addressCallback = useRef(onAddressDetected);
  useEffect(() => { addressCallback.current = onAddressDetected; }, [onAddressDetected]);

  // Cancel old lookups so an earlier address cannot overwrite a newer pin.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsResolvingAddress(true);
      try {
        const response = await fetch(`/api/geocode?mode=reverse&lat=${latitude}&lon=${longitude}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Address unavailable');
        const data = await response.json();
        if (!controller.signal.aborted) {
          const name = data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setResolvedAddress({ lat: latitude, lng: longitude, name });
          addressCallback.current?.(name);
        }
      } catch {
        // Coordinates remain usable when the address provider is unavailable.
      } finally {
        if (!controller.signal.aborted) setIsResolvingAddress(false);
      }
    }, 700);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [latitude, longitude]);

  useEffect(() => () => searchAbort.current?.abort(), []);
  // Photon supports search-as-you-type; Nominatim remains for reverse addresses.
  const runSearch = useCallback(async (text: string) => {
    const query = text.trim();
    searchAbort.current?.abort();
    if (query.length < 3) { setSearchError('Enter at least 3 characters, such as a street or landmark.'); return; }
    const controller = new AbortController();
    searchAbort.current = controller;
    setIsSearching(true); setIsSearchOpen(true); setSearchError(''); setSearchResults([]);
    try {
      const params = new URLSearchParams({ mode: 'suggest', q: query });
      const response = await fetch(`/api/geocode?${params}`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Search is unavailable.');
      if (!controller.signal.aborted) {
        setSearchResults(data);
        setPreview(data[0] || null);
        if (!data.length) setSearchError('No matching places found. Try a fuller address or another landmark, or click the map.');
      }
    } catch (error) {
      if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : 'Search failed. Try again.');
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      searchTimer.current = setTimeout(() => { void runSearch(searchQuery); }, 650);
    }
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, runSearch]);

  const handleSearch = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    void runSearch(searchQuery);
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (item: SearchResultItem) => {
    const newLat = parseFloat(item.lat);
    const newLng = parseFloat(item.lon);

    if (!isNaN(newLat) && !isNaN(newLng)) {
      startTransition(() => {
        onChangeLocation(newLat, newLng, item.display_name);
      });
      setResolvedAddress({ lat: newLat, lng: newLng, name: item.display_name });
      setIsSearchOpen(false);
      setPreview(null);
      setSearchQuery('');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    searchAbort.current?.abort();
    if (searchTimer.current) clearTimeout(searchTimer.current);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setIsSearchOpen(false);
    setPreview(null);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude: userLat, longitude: userLng, accuracy } = position.coords;
        setGpsFix({ lat: userLat, lng: userLng, accuracy });
        startTransition(() => {
          onChangeLocation(userLat, userLng);
        });
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        setLocateError(
          err.code === 1
            ? 'Location permission denied. Please click on the map to set the location.'
            : 'Could not fetch current GPS location. Please pinpoint the location on the map.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const apiKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;

  // Select tile layer based on active mapStyle preference
  const getTileConfig = () => {
    if (mapStyle === 'satellite') {
      return {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        subdomains: 'abc',
        maxZoom: 19,
      };
    }

    if (mapStyle === 'dark') {
      return {
        url: apiKey
          ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${apiKey}`
          : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        subdomains: apiKey ? 'abcd' : 'abc',
        maxZoom: 20,
      };
    }

    // Default 'streets': Vibrant natural colors with blue water bodies and clear roads
    return {
      url: apiKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${apiKey}`
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: apiKey ? 'abcd' : 'abc',
      maxZoom: 20,
    };
  };

  const tileConfig = getTileConfig();

  return (
    <div className="reports-map relative w-full rounded-2xl border border-[var(--border)] shadow-md bg-[var(--card)]">
      {/* Floating Location Search Bar */}
      {!readOnly && (
        <div ref={searchContainerRef} className="relative z-30 p-3 border-b border-[var(--border)]">
          <div className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none text-[var(--muted-foreground)]">
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <Search className="w-3.5 h-3.5" />}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchAbort.current?.abort();
                setIsSearching(false); setSearchResults([]); setSearchError(''); setIsSearchOpen(false);
                if (e.target.value.trim().length < 3) setPreview(null);
              }}
              onFocus={() => {
                if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                  setIsSearchOpen(true);
                }
              }}
              aria-label="Search incident location"
              onKeyDown={(event) => {
                if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); void handleSearch(); }
                if (event.key === 'Escape') { searchAbort.current?.abort(); if (searchTimer.current) clearTimeout(searchTimer.current); setIsSearching(false); setIsSearchOpen(false); setPreview(null); }
              }}
              placeholder="Search any city, street or landmark worldwide…"
              className="w-full pl-9 pr-24 py-3 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)]/70 shadow-lg focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  searchAbort.current?.abort();
                  setIsSearching(false);
                  setSearchError('');
                  setPreview(null);
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearchOpen(false);
                }}
                aria-label="Clear location search"
                className="absolute right-20 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button type="button" onClick={() => void handleSearch()} disabled={isSearching} className="absolute right-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Search</button>
          </div>
          <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">Type at least 3 characters to preview a place. Choose a result or click the map to set the incident pin.</p>
          <div aria-live="polite" className="text-xs mt-1 text-[var(--muted-foreground)]">{isSearching ? 'Searching places…' : searchError}</div>

          {/* Search results */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] rounded-xl shadow-2xl max-h-56 overflow-y-auto py-1 z-40 divide-y divide-[var(--border)]/50">
              {searchResults.map((item) => (
                <button
                  type="button"
                  key={item.place_id}
                  onClick={() => handleSelectSearchResult(item)}
                  onMouseEnter={() => setPreview(item)}
                  onFocus={() => setPreview(item)}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--secondary)] cursor-pointer transition-colors flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--foreground)] truncate">
                      {item.display_name.split(',')[0]}
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                      {item.display_name.split(',').slice(1).join(',')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {preview && <div role="status" className="px-3 py-2 border-b border-blue-200 bg-blue-500/10 text-xs text-[var(--foreground)]">Previewing: <strong>{preview.display_name}</strong>. Your incident pin has not moved.</div>}
      <MapContainer
        center={[latitude, longitude]}
        zoom={14}
        scrollWheelZoom={true}
        attributionControl={true}
        style={{ height: '440px', width: '100%', zIndex: 10 }}
      >
        <TileLayer
          key={mapStyle}
          url={tileConfig.url}
          subdomains={tileConfig.subdomains}
          maxZoom={tileConfig.maxZoom}
          maxNativeZoom={mapStyle === 'streets' && !apiKey ? 19 : tileConfig.maxZoom}
          attribution={mapStyle === 'satellite' ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap contributors &copy; CARTO'}
        />

        <MapClickWatcher onChangeLocation={(lat, lng) => { searchAbort.current?.abort(); if (searchTimer.current) clearTimeout(searchTimer.current); setIsSearching(false); setPreview(null); setIsSearchOpen(false); setSearchQuery(''); onChangeLocation(lat, lng); }} readOnly={readOnly} />
        <PanToLocation lat={latitude} lng={longitude} preview={preview} />

        {pinIcon && (
          <Marker
            ref={markerRef}
            position={[latitude, longitude]}
            icon={pinIcon}
            draggable={!readOnly}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                onChangeLocation(pos.lat, pos.lng);
              },
            }}
          >
            <Popup className="custom-report-popup">
              <div className="p-1 text-xs space-y-1">
                <p className="font-bold text-red-600 flex items-center gap-1">
                   Selected Incident Location
                </p>
                <p className="font-semibold text-[var(--foreground)]">{locationName}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] font-mono">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
                {!readOnly && (
                  <p className="text-[10px] text-slate-400 italic">Drag pin or click map to reposition</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Top-Right Controls: Map Style Switcher & GPS Button */}
      <div className="relative flex-wrap p-3 border-t border-[var(--border)] z-20 flex items-center gap-2">
        {/* Style Switcher Pills */}
        <div className="flex bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] rounded-xl p-0.5 shadow-lg text-[11px]">
          <button
            type="button"
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mapStyle === 'streets'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mapStyle === 'satellite'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mapStyle === 'dark'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Dark
          </button>
        </div>

        {/* GPS Button */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="px-3.5 py-2 rounded-xl bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--secondary)] active:scale-95 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Detect My Location via GPS"
          >
            <Locate className={`w-3.5 h-3.5 text-blue-500 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">{isLocating ? 'Locating…' : 'My Location'}</span>
          </button>
        )}
      </div>

      {/* Bottom-Left Location Name Badge (Human-Readable Address Name) */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="px-3.5 py-2 rounded-xl bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] shadow-xl flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold leading-tight">
              {isResolvingAddress ? (
                <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                  <Loader2 className="w-3 h-3 animate-spin" /> Detecting address name…
                </span>
              ) : (
                locationName
              )}
            </p>
            <p className="text-[10px] text-[var(--muted-foreground)] font-mono font-normal">
              {latitude.toFixed(5)}, {longitude.toFixed(5)} {!readOnly && '• (Click or drag pin to adjust)'}
            </p>
            {gpsFix?.lat === latitude && gpsFix?.lng === longitude && <p className="text-[11px] font-normal text-[var(--muted-foreground)]">GPS accuracy: approximately ±{Math.round(gpsFix.accuracy)} m. Check the pin before reporting.</p>}
          </div>
        </div>
      </div>

      {/* Geolocation error notification banner */}
      {locateError && (
        <div className="absolute top-16 right-3 max-w-xs z-30 bg-amber-500/90 text-white text-xs px-3 py-2 rounded-xl shadow-lg animate-fade-in flex items-start gap-2 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{locateError}</p>
            <button
              type="button"
              onClick={() => setLocateError(null)}
              className="text-[10px] underline font-bold mt-1 text-white/90"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
