'use client';

import { useId } from 'react';

function describeDepth(cm: number) {
  if (cm <= 0) return 'Ground level';
  if (cm <= 20) return 'Ankle level';
  if (cm <= 55) return 'Knee level';
  if (cm <= 100) return 'Waist level';
  if (cm <= 140) return 'Chest level';
  if (cm <= 160) return 'Neck level';
  if (cm <= 170) return 'Head level';
  return 'Above head';
}

export default function WaterDepthSelector({ value, onChange, exact, onExactChange, unit, onUnitChange, measurement, onMeasurementChange }: {
  value: string; onChange: (value: string) => void;
  exact: boolean; onExactChange: (value: boolean) => void;
  unit: string; onUnitChange: (value: string) => void;
  measurement: string; onMeasurementChange: (value: string) => void;
}) {
  const clipId = useId();
  const depth = Number(value.match(/~(\d+) cm/)?.[1] || 0);
  const waterY = Math.max(0, 302 - (depth / 170) * 287);
  const estimate = `${describeDepth(depth)} (~${depth} cm)`;
  return (
    <div className="space-y-5">
      <div className="grid gap-6 sm:grid-cols-[240px_1fr] items-center">
        <div className="rounded-2xl bg-[var(--secondary)]/40 p-4">
          <div className="relative h-80 w-52 mx-auto">
            <svg viewBox="0 0 180 320" className="h-80 w-44" role="img" aria-label={!exact && value ? `Estimated water level: ${estimate}` : 'Adult body outline'}>
              <defs><clipPath id={clipId}>
                <circle cx="90" cy="37" r="22" />
                <path d="M68 67 Q90 60 112 67 L132 137 Q135 151 123 154 Q114 156 111 143 L105 117 L105 175 L115 287 Q116 302 103 302 Q93 302 92 287 L87 210 L83 287 Q82 302 70 302 Q58 302 60 287 L71 175 L71 117 L65 143 Q62 157 50 153 Q41 150 45 137 Z" />
              </clipPath></defs>
              <g fill="var(--card)" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <circle cx="90" cy="37" r="22" />
                <path d="M68 67 Q90 60 112 67 L132 137 Q135 151 123 154 Q114 156 111 143 L105 117 L105 175 L115 287 Q116 302 103 302 Q93 302 92 287 L87 210 L83 287 Q82 302 70 302 Q58 302 60 287 L71 175 L71 117 L65 143 Q62 157 50 153 Q41 150 45 137 Z" />
              </g>
              {!exact && value && <>
                <rect x="30" y={waterY} width="120" height={310 - waterY} fill="#38bdf8" fillOpacity="0.65" clipPath={`url(#${clipId})`} />
                <line x1="20" x2="180" y1={waterY} y2={waterY} stroke="#0284c7" strokeWidth="2" strokeDasharray="4 3" />
              </>}
            </svg>
            <input type="range" min="0" max="180" step="5" value={depth}
              aria-label="Estimated water depth" aria-valuetext={`${depth} centimetres, ${describeDepth(depth)}`}
              onChange={event => { const cm = Number(event.target.value); onExactChange(false); onChange(`${describeDepth(cm)} (~${cm} cm)`); }}
              className="water-depth-range absolute right-1 top-0 h-[304px] w-8 cursor-ns-resize accent-blue-600"
              style={{ writingMode: 'vertical-lr', direction: 'rtl' }} />
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--muted-foreground)]">Slide up or down to set the waterline</p>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">How high is the water?</h3>
          <div aria-live="polite" className="rounded-xl border border-[var(--border)] p-4 space-y-1">
            <p className="text-lg font-semibold">{exact ? 'Exact measurement selected' : value ? describeDepth(depth) : 'Move the slider to estimate'}</p>
            {!exact && value && <p className="text-blue-600 font-semibold">Approximately {depth} cm / {(depth / 30.48).toFixed(1)} ft</p>}
          </div>
          <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">The figure represents a 170 cm adult. Body landmarks vary by person, so this is a general visual estimate, not a measured depth.</p>
          <p className="text-xs text-[var(--muted-foreground)]">Use the arrow keys for 5 cm steps. For a known measurement or depths above 180 cm, use the exact option below.</p>
          <p className="text-xs text-[var(--muted-foreground)]">Observe from a safe place. Do not enter floodwater to measure it.</p>
        </div>
      </div>
      <div className="border-t border-[var(--border)] pt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={exact} onChange={event => onExactChange(event.target.checked)} />
          Enter an exact measurement instead
        </label>
        {exact && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs font-semibold space-y-1.5"> <span className="block">1. Measurement unit</span>
            <select aria-label="Measurement unit" value={unit} onChange={event => onUnitChange(event.target.value)} required className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <option value="">Select unit</option><option value="cm">Centimetres (cm)</option><option value="m">Metres (m)</option><option value="mm">Millimetres (mm)</option><option value="ft">Feet (ft)</option><option value="in">Inches (in)</option>
            </select>
          </label>
          <label className="text-xs font-semibold space-y-1.5"><span className="block">2. Water depth{unit && ` (${unit})`}</span>
            <input aria-label="Exact water depth" type="number" min="0.001" step="any" inputMode="decimal" required disabled={!unit} value={measurement} onKeyDown={event => { if (['e', 'E', '+', '-'].includes(event.key)) event.preventDefault(); }} onChange={event => onMeasurementChange(event.target.value)} placeholder={unit ? 'Enter a positive number' : 'Select a unit first'} className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 disabled:opacity-50" />
          </label>
        </div>}
      </div>
    </div>
  );
}
