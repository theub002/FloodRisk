'use client';

import { useEffect, useState } from 'react';
import { X, TrendingUp, ShieldAlert, Users, Layers } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from 'recharts';

interface WardDetailModalProps {
  wardId: number;
  wardName: string;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function WardDetailModal({ wardId, wardName, onClose, theme }: WardDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'fri' | 'factors'>('fri');

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/trends?ward_id=${wardId}`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [wardId]);

  if (loading) {
    return (
      <div className={`${theme} fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm`}>
        <div className="glass-panel p-8 rounded-xl flex flex-col items-center gap-4 border border-[var(--border)] shadow-2xl bg-[var(--card)]">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--muted-foreground)] text-sm font-medium">Fetching historical trends...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Very High': return '#660107';
      case 'High': return '#c10712';
      case 'Moderate': return '#FFAE19';
      case 'Low': return '#26ae00';
      case 'Very Low':
      default: return '#4da9e4';
    }
  };

  const currentStats = data.trends[data.trends.length - 1] || {};

  return (
    <div className={`${theme} fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fade-in`}>
      <div className="relative w-full max-w-4xl bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border)] bg-[var(--secondary)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <ShieldAlert className="text-blue-600 w-5 h-5" />
              Ward {data.ward_number}: {data.ward_name}
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Historical Analysis & Trend Analysis (1981 - 2024)</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-[var(--card)]">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[var(--secondary)] p-4 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] text-xs flex items-center gap-1.5 mb-1.5 font-semibold">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Wards Population
              </div>
              <div className="text-lg font-bold font-mono text-[var(--foreground)]">
                {data.population.toLocaleString()}
              </div>
            </div>
            <div className="bg-[var(--secondary)] p-4 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] text-xs flex items-center gap-1.5 mb-1.5 font-semibold">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-650" /> Latest FRI Mean
              </div>
              <div className="text-lg font-bold font-mono text-indigo-500">
                {currentStats.fri_mean?.toFixed(2)}
              </div>
            </div>
            <div className="bg-[var(--secondary)] p-4 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] text-xs flex items-center gap-1.5 mb-1.5 font-semibold">
                <Layers className="w-3.5 h-3.5 text-yellow-600" /> Latest Category
              </div>
              <div 
                className="text-lg font-bold"
                style={{ color: getCategoryColor(currentStats.category) }}
              >
                {currentStats.category}
              </div>
            </div>
            <div className="bg-[var(--secondary)] p-4 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted-foreground)] text-xs flex items-center gap-1.5 mb-1.5 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-red-650" /> City Rank
              </div>
              <div className="text-lg font-bold font-mono text-red-500">
                #{currentStats.rank} <span className="text-xs text-[var(--muted-foreground)] font-normal">/ 85</span>
              </div>
            </div>
          </div>

          {/* Chart Controls */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab('fri')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'fri'
                  ? 'border-blue-500 text-blue-600 bg-blue-500/5'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              FRI Trend (Flood Risk Index)
            </button>
            <button
              onClick={() => setActiveTab('factors')}
              className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'factors'
                  ? 'border-blue-500 text-blue-600 bg-blue-500/5'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              FHI, FEI, FVI Factors Trend
            </button>
          </div>

          {/* Chart Container */}
          <div className="h-[320px] bg-[var(--secondary)] p-4 rounded-xl border border-[var(--border)]">
            {activeTab === 'fri' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFri" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="fri_mean"
                    name="FRI Mean"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorFri)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                    labelStyle={{ color: 'var(--foreground)', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Line type="monotone" dataKey="fhi_mean" name="FHI (Hazard)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fei_mean" name="FEI (Exposure)" stroke="#fbbf24" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="fvi_mean" name="FVI (Vulnerability)" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="text-xs text-[var(--muted-foreground)] italic text-center">
            Formula reference: FRI = FHI × FEI × FVI. Displaying values based on historical calculation runs.
          </div>
        </div>
      </div>
    </div>
  );
}
