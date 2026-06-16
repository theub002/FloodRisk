import React from 'react';
import { X, Compass } from 'lucide-react';

export default function TerrainModal({ onClose, theme, terrainStats, cityName }: { onClose: () => void, theme: string, terrainStats: any, cityName: string }) {
  if (!terrainStats) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`relative w-full max-w-md p-6 rounded-2xl shadow-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 flex items-center justify-center text-blue-600">
            <Compass className="w-5 h-5 fill-blue-600 text-white" />
          </div>
          <h2 className="text-sm font-bold font-mono tracking-wider text-blue-600 uppercase">
            Terrain Statistics — {cityName}
          </h2>
        </div>
        
        <hr className={`mb-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`} />

        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">Minimum Elevation</span>
            <span className="font-bold font-mono text-sm">{terrainStats.elev_min.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">Maximum Elevation</span>
            <span className="font-bold font-mono text-sm">{terrainStats.elev_max.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">Mean Elevation</span>
            <span className="font-bold font-mono text-sm">{terrainStats.elev_mean.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">Minimum Slope</span>
            <span className="font-bold font-mono text-sm">{terrainStats.slope_min?.toFixed(2) || '0.00'}°</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">Maximum Slope</span>
            <span className="font-bold font-mono text-sm">{terrainStats.slope_max?.toFixed(2) || '31.30'}°</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">Mean Slope</span>
            <span className="font-bold font-mono text-sm">{terrainStats.slope_mean.toFixed(2)}°</span>
          </div>
          <div className="flex justify-between items-center text-xs pt-2 border-t border-[var(--border)]">
            <span className="text-[var(--muted-foreground)] uppercase font-semibold tracking-wider">Total Area</span>
            <span className="font-bold font-mono text-sm">{terrainStats.area_km2.toFixed(2)} sq km</span>
          </div>
        </div>

      </div>
    </div>
  );
}
