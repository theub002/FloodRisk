'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet icons issues in Next.js
const fixLeafletIcon = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface MapProps {
  geojsonData: any;
  selectedWardId: number | null;
  onSelectWard: (wardId: number, wardName: string) => void;
  theme: 'light' | 'dark';
}

// Color coding based on user requirements:
// Very High: #660107
// High: #c10712
// Moderate: #FFAE19
// Low: #26ae00
// Very Low: #4da9e4
const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Very High':
      return '#660107';
    case 'High':
      return '#c10712';
    case 'Moderate':
      return '#FFAE19';
    case 'Low':
      return '#26ae00';
    case 'Very Low':
    default:
      return '#4da9e4';
  }
};

// Component to dynamically pan/zoom map when GeoJSON data is loaded
function ChangeView({ geojsonData }: { geojsonData: any }) {
  const map = useMap();
  useEffect(() => {
    if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
      try {
        const layer = L.geoJSON(geojsonData);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { animate: true, duration: 0.5 });
        }
      } catch (err) {
        console.error("Error fitting map bounds: ", err);
      }
    }
  }, [geojsonData, map]);
  return null;
}

export default function Map({ geojsonData, selectedWardId, onSelectWard, theme }: MapProps) {
  const geojsonRef = useRef<L.GeoJSON>(null);

  useEffect(() => {
    fixLeafletIcon();
  }, []);

  const borderStrokeColor = theme === 'dark' ? '#334155' : '#94a3b8';
  const selectedStrokeColor = theme === 'dark' ? '#ffffff' : '#2563eb';
  const hoverStrokeColor = theme === 'dark' ? '#94a3b8' : '#475569';

  // Dynamic style definition for GeoJSON component
  const getStyle = (feature: any) => {
    const props = feature.properties;
    const isSelected = props.ward_id === selectedWardId;
    return {
      fillColor: getCategoryColor(props.category),
      weight: isSelected ? 3.5 : 1,
      color: isSelected ? selectedStrokeColor : borderStrokeColor,
      fillOpacity: isSelected ? 0.85 : 0.6,
    };
  };

  // Update selection style when selectedWardId or theme changes
  useEffect(() => {
    if (geojsonRef.current) {
      geojsonRef.current.eachLayer((layer: any) => {
        const props = layer.feature.properties;
        const isSelected = props.ward_id === selectedWardId;
        
        layer.setStyle({
          fillColor: getCategoryColor(props.category),
          weight: isSelected ? 3.5 : 1,
          color: isSelected ? selectedStrokeColor : borderStrokeColor,
          fillOpacity: isSelected ? 0.85 : 0.6,
        });

        if (isSelected) {
          layer.bringToFront();
        }
      });
    }
  }, [selectedWardId, geojsonData, theme, borderStrokeColor, selectedStrokeColor]);

  const onEachFeature = (feature: any, layer: any) => {
    const props = feature.properties;

    // Event listeners
    layer.on({
      mouseover: (e: any) => {
        const target = e.target;
        target.setStyle({
          fillOpacity: 0.85,
          weight: props.ward_id === selectedWardId ? 3.5 : 2,
          color: props.ward_id === selectedWardId ? selectedStrokeColor : hoverStrokeColor,
        });
        target.bringToFront();
      },
      mouseout: (e: any) => {
        const target = e.target;
        geojsonRef.current?.resetStyle(target);
        
        // Re-apply explicit style for selected layer just in case resetStyle overwrites it
        const isSelected = props.ward_id === selectedWardId;
        target.setStyle({
          fillColor: getCategoryColor(props.category),
          weight: isSelected ? 3.5 : 1,
          color: isSelected ? selectedStrokeColor : borderStrokeColor,
          fillOpacity: isSelected ? 0.85 : 0.6,
        });
        if (isSelected) {
          target.bringToFront();
        }
      },
      click: () => {
        onSelectWard(props.ward_id, props.ward_name);
      },
    });

    // Bind clean interactive tooltips
    layer.bindTooltip(
      `
      <div class="px-2 py-1 text-sm ${theme === 'dark' ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white text-slate-800 border-slate-200'} rounded border shadow-md">
        <div class="font-semibold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}">Ward ${props.ward_number}: ${props.ward_name}</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-xs ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}">
          <span>FRI Mean:</span> <span class="font-mono text-right ${theme === 'dark' ? 'text-yellow-400' : 'text-amber-600'}">${props.fri_mean.toFixed(2)}</span>
          <span>FRI Category:</span> <span class="font-bold text-right" style="color: ${getCategoryColor(props.category)}">${props.category}</span>
          <span>Rank:</span> <span class="font-mono text-right ${theme === 'dark' ? 'text-blue-300' : 'text-blue-500'}">#${props.rank}</span>
        </div>
      </div>
      `,
      { permanent: false, direction: 'auto', sticky: true, opacity: 0.95 }
    );
  };

  const centerIndore: [number, number] = [22.7196, 75.8577];
  const zoomIndore = 11.5;

  const tileUrl = theme === 'dark'
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

  return (
    <div className={`w-full h-full relative overflow-hidden rounded-xl border shadow-2xl transition-colors ${theme === 'dark' ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
      <MapContainer
        center={centerIndore}
        zoom={zoomIndore}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <ChangeView geojsonData={geojsonData} />
        {/* Sleek Dynamic Mode Map Tiles */}
        <TileLayer
          key={theme}
          url={tileUrl}
          subdomains="abcd"
          maxZoom={20}
        />
        
        {geojsonData && (
          <GeoJSON
            key={JSON.stringify(geojsonData.features?.[0]?.properties?.year) + theme + selectedWardId}
            data={geojsonData}
            style={getStyle}
            onEachFeature={onEachFeature}
            ref={geojsonRef}
          />
        )}
      </MapContainer>
      
      {/* Dynamic Map Legend Overlay */}
      <div className={`absolute bottom-4 right-4 z-[1000] glass-panel px-4 py-3 rounded-lg shadow-lg text-xs ${theme === 'dark' ? 'border-slate-800/80 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
        <h4 className="font-semibold mb-2">Flood Risk Index (FRI)</h4>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#660107' }}></span>
            <span>Very High (&gt; 20.2)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#c10712' }}></span>
            <span>High (16.7 - 20.2)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFAE19' }}></span>
            <span>Moderate (13.1 - 16.7)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#26ae00' }}></span>
            <span>Low (9.6 - 13.1)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4da9e4' }}></span>
            <span>Very Low (&lt;= 9.6)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
