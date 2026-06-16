import React from 'react';
import { X, CloudRain } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';

export default function RainfallModal({ onClose, theme, rainfallData, cityName, selectedYear }: { onClose: () => void, theme: string, rainfallData: any, cityName: string, selectedYear: number }) {
  if (!rainfallData) return null;

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
          <div className="w-8 h-8 flex items-center justify-center text-blue-600">
            <CloudRain className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold font-mono tracking-wider text-blue-600 uppercase">
            Rainfall Statistics — {cityName}
          </h2>
        </div>
        
        <hr className={`mb-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-100'}`} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wet Days Trend */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
              Wet Days Trends (2000 - 2024)
            </h3>
            <div className="h-[200px] bg-[var(--secondary)] p-2 rounded-lg border border-[var(--border)]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rainfallData.rainfall.filter((d: any) => d.year >= 2000)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }} />
                  <Line type="monotone" dataKey="wet_days" name="Wet Days" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Rainfall distribution */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
              Monthly Rainfall ({selectedYear})
            </h3>
            {(() => {
              const currentYearRain = rainfallData.rainfall.find((r: any) => r.year === selectedYear);
              if (!currentYearRain) return <p className="text-xs text-slate-500">No data loaded.</p>;
              
              const monthData = Object.entries(currentYearRain.months).map(([name, value]) => ({ name, value }));

              return (
                <div className="h-[200px] bg-[var(--secondary)] p-2 rounded-lg border border-[var(--border)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: theme === 'dark' ? '#1e293b' : '#e2e8f0', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }} />
                      <Bar dataKey="value" name="Rainfall (mm)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}
