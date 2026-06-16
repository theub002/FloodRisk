import React from 'react';
import { X, Settings } from 'lucide-react';

export default function AssumptionsModal({ onClose, theme }: { onClose: () => void, theme: string }) {
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
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono tracking-wider text-blue-500 uppercase">Assumptions & Methodology</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Underlying assumptions in the FRI calculation</p>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
          
          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400 border-blue-900' : 'text-blue-600 border-blue-100'} border-b pb-1`}>Rainfall & Hydrology</h3>
            <div className={`p-3 rounded-lg text-sm space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <p><strong>Antecedent Moisture Condition:</strong> Assumed to be always normal by setting a constant 20 mm for all pixels and all years. The code comment states 20 mm puts every pixel in CN2 (normal condition) for annual computation.</p>
              <p><strong>Annual Rainfall as Storm Input:</strong> Annual total rainfall is used as the storm input to the SCS-CN, a single-storm model. The model was designed for individual design storms, not cumulative annual rainfall. The code applies it at an annual scale as a proxy for runoff potential.</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400 border-blue-900' : 'text-blue-600 border-blue-100'} border-b pb-1`}>Population</h3>
            <div className={`p-3 rounded-lg text-sm space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <p><strong>GHSL 2020 Distribution:</strong> The GHSL 2020 population is assumed to represent the current population distribution. The code snaps to the nearest 5-year GHSL, assuming population has not changed significantly.</p>
              <p><strong>Pixel-Level Distribution:</strong> The population count within each 100 m GHSL pixel is assumed to be uniformly distributed across all pixels.</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-blue-400 border-blue-900' : 'text-blue-600 border-blue-100'} border-b pb-1`}>Index Construction</h3>
            <div className={`p-3 rounded-lg text-sm space-y-3 ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <p><strong>Equal Sub-Index Weights:</strong> All three sub-indices are assumed to be equally important in the final FRI. The multiplicative combination FRI = FHI × FEI × FVI assigns equal conceptual weight to hazard, exposure, and vulnerability.</p>
              <p><strong>Flood Hazard Index (FHI):</strong> The three components — runoff, slope, and wet days — are assumed to contribute equally. Each is scored 1–5, summed without differential weighting before rescaling.</p>
              <p><strong>Flood Vulnerability Index (FVI):</strong> Distance to water is given a weight of 0.85 while all other four components are weighted 1.0. The score bins for runoff (650, 850, 1100, 1350 mm) are stated in code as derived from 2020 annual runoff range.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
