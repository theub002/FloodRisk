import React from 'react';
import { X, TriangleAlert } from 'lucide-react';

export default function LimitationsModal({ onClose, theme }: { onClose: () => void, theme: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`relative w-full max-w-2xl p-6 rounded-2xl shadow-2xl border ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-500">
            <TriangleAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider text-pink-500 uppercase">Study Limitations</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Specific constraints of this FRI implementation</p>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
          
          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400 border-blue-900' : 'text-blue-600 border-blue-100'} border-b pb-1`}>📡 Data & Resolution</h3>
            <div className={`p-3 rounded-lg text-sm space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>IMD Rainfall</span>
                <p>IMD rainfall data at 5.5 km grid resolution assigns near-uniform values across an entire city, failing to capture <strong>intra-urban ward-wise precipitation variability</strong>.</p>
              </div>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>MODIS / SRTM</span>
                <p>MODIS land cover at 500 m resolution is considerably coarser than the 30 m SRTM elevation model, resulting in a <strong>spatial mismatch</strong> between the two datasets.</p>
              </div>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>GHSL Population</span>
                <p>GHSL population data reprojected from 100 m to 30 m involves <strong>spatial interpolation rather than actual measurement</strong>, potentially introducing errors in population exposure estimates.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400 border-blue-900' : 'text-blue-600 border-blue-100'} border-b pb-1`}>⚙ Methodology</h3>
            <div className={`p-3 rounded-lg text-sm space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>SCS-CN Method</span>
                <p>The SCS-CN method was developed for rural watersheds; its application in <strong>dense Indian cities with complex drainage infrastructure</strong> introduces systematic errors.</p>
              </div>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Wet Days</span>
                <p>Wet-day frequency is computed as a <strong>city-wide spatial mean</strong>, assigning an identical score to every pixel and ignoring local precipitation variation.</p>
              </div>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Hazard Threshold</span>
                <p>The Hazard Index threshold is based on a city-wide average of wet days (1981–2024) and does <strong>not account for spatial variation</strong> across homogeneous precipitation zones in India.</p>
              </div>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>FVI Elevation</span>
                <p>FVI elevation thresholds (≤5 m = score 5, ≤10 m = score 4, etc.) were derived from <strong>coastal and delta contexts</strong> and are inappropriate for inland plateau cities like Indore (~550 m above sea level).</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400 border-blue-900' : 'text-blue-600 border-blue-100'} border-b pb-1`}>📐 Index Design</h3>
            <div className={`p-3 rounded-lg text-sm space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Multiplicative FRI</span>
                <p>FRI is computed as the product of FHI, FEI, and FVI; if any component reaches its minimum value, the overall FRI is <strong>disproportionately suppressed</strong>, regardless of the other two.</p>
              </div>
              <div className={`p-2 border-l-2 ${theme === 'dark' ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'}`}>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>Score Masking</span>
                <p>An area with <strong>high hazard and high exposure but low measured vulnerability</strong> may still yield a misleadingly low composite risk score.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400 border-blue-900' : 'text-blue-600 border-blue-100'} border-b pb-1`}>🕐 Temporal Limitations</h3>
            <div className={`p-3 rounded-lg text-sm space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Land Cover</span>
                <p>Land cover is fixed to a single MODIS scene from 2013, meaning <strong>rapid urbanization between 2013 and 2024</strong> is not reflected in the analysis.</p>
              </div>
              <div>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>Landsat Composites</span>
                <p>Landsat composites for NDVI and NDWI are restricted to 2022; any <strong>drought or wet conditions in that year</strong> can bias the FVI calculation.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400 border-blue-900' : 'text-blue-600 border-blue-100'} border-b pb-1`}>🏗 Infrastructure Data</h3>
            <div className={`p-3 rounded-lg text-sm space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div className={`p-2 border-l-2 ${theme === 'dark' ? 'border-blue-500 bg-blue-500/10' : 'border-blue-500 bg-blue-50'}`}>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>Infrastructure Blind Spot</span>
                <p>The methodology is entirely terrain and rainfall-based, with <strong>no data on stormwater drain networks, culvert capacities, road underpasses, or pumping stations</strong> — the primary determinants of urban flooding in built-up cities.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
