'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, Calendar, ShieldAlert, BarChart3, CloudRain, MapPin, Compass, Eye, TrendingUp, Sun, Moon, ChevronDown } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import WardDetailModal from './WardDetailModal';

// Dynamically load the Leaflet Map component to bypass SSR errors in Next.js App Router
const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[var(--muted-foreground)] text-xs font-medium">Initializing Map Module...</p>
      </div>
    </div>
  ),
});

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showLanding, setShowLanding] = useState(true);
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number>(1); // Default Indore
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [landingCityId, setLandingCityId] = useState<number>(1);
  const [landingYear, setLandingYear] = useState<number>(2024);
  const [selectedWard, setSelectedWard] = useState<{ id: number; name: string } | null>(null);
  
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [rainfallData, setRainfallData] = useState<any>(null);
  const [terrainStats, setTerrainStats] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeSidebarTab, setActiveSidebarTab] = useState<'city' | 'ward' | 'list'>('city');
  const [showTrendModal, setShowTrendModal] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Fetch Cities
  useEffect(() => {
    fetch(`${API_BASE}/api/cities`)
      .then((res) => res.json())
      .then((data) => {
        setCities(data);
        if (data.length > 0) setSelectedCityId(data[0].id);
      })
      .catch((err) => console.error("Error fetching cities", err));
  }, []);

  // Fetch Terrain Stats & Rainfall history for the selected city
  useEffect(() => {
    if (!selectedCityId) return;

    fetch(`${API_BASE}/api/terrain?city_id=${selectedCityId}`)
      .then((res) => res.json())
      .then((data) => setTerrainStats(data))
      .catch((err) => console.error("Error fetching terrain", err));

    fetch(`${API_BASE}/api/rainfall?city_id=${selectedCityId}`)
      .then((res) => res.json())
      .then((data) => setRainfallData(data))
      .catch((err) => console.error("Error fetching rainfall", err));
  }, [selectedCityId]);

  // Fetch Wards geojson + FRI stats for selected city and year
  useEffect(() => {
    if (!selectedCityId || !selectedYear) return;

    fetch(`${API_BASE}/api/wards?city_id=${selectedCityId}&year=${selectedYear}`)
      .then((res) => res.json())
      .then((data) => {
        setGeojsonData(data);
        // Reset or update selected ward details if it exists in new year data
        if (selectedWard) {
          const exists = data.features.some((f: any) => f.properties.ward_id === selectedWard.id);
          if (!exists) setSelectedWard(null);
        }
      })
      .catch((err) => console.error("Error fetching wards geojson", err));
  }, [selectedCityId, selectedYear]);

  // Get selected ward stats for the sidebar
  const getSelectedWardStats = () => {
    if (!selectedWard || !geojsonData) return null;
    const feature = geojsonData.features.find((f: any) => f.properties.ward_id === selectedWard.id);
    return feature ? feature.properties : null;
  };

  const selectedWardStats = getSelectedWardStats();

  // Search filter for wards table list
  const filteredWards = geojsonData?.features
    ? geojsonData.features
        .filter((f: any) => {
          const nameMatch = f.properties.ward_name.toLowerCase().includes(searchQuery.toLowerCase());
          const numMatch = f.properties.ward_number.toString().includes(searchQuery);
          return nameMatch || numMatch;
        })
        .map((f: any) => f.properties)
        .sort((a: any, b: any) => a.rank - b.rank)
    : [];

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

  const yearsRange = Array.from({ length: 2024 - 1981 + 1 }, (_, i) => 1981 + i);

  return (
    <div className={`${theme} flex flex-col h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200`}>
      
      {/* Top Header Navigation */}
      <header className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/85 backdrop-blur-md z-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <ShieldAlert className="text-blue-500 w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">URBAN FLOOD RISK GIS PLATFORM</h1>
            <p className="text-xs text-[var(--muted-foreground)]">Decision Support System for Resilient Urban Infrastructure Planning</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* City Selector */}
          <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2">
            <MapPin className="text-blue-500 w-4 h-4" />
            <select
              value={selectedCityId}
              onChange={(e) => setSelectedCityId(Number(e.target.value))}
              className="bg-transparent font-medium text-sm text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id} className="bg-[var(--card)] text-[var(--foreground)]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--border)] rounded-xl px-3 py-2">
            <Calendar className="text-indigo-500 w-4 h-4" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-medium text-sm text-[var(--foreground)] focus:outline-none cursor-pointer"
            >
              {yearsRange.map((yr) => (
                <option key={yr} value={yr} className="bg-[var(--card)] text-[var(--foreground)]">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Layout */}
        <aside className="w-full md:w-[420px] border-r border-[var(--border)] bg-[var(--card)] flex flex-col h-full z-10 shrink-0">
          
          {/* Sidebar Tabs */}
          <div className="flex border-b border-[var(--border)] bg-[var(--secondary)]/50">
            <button
              onClick={() => setActiveSidebarTab('city')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeSidebarTab === 'city'
                  ? 'border-blue-500 text-blue-600 bg-blue-500/5'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Compass className="w-4 h-4" /> City Overview
            </button>
            <button
              onClick={() => setActiveSidebarTab('ward')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeSidebarTab === 'ward'
                  ? 'border-blue-500 text-blue-600 bg-blue-500/5'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Ward Analytics
            </button>
            <button
              onClick={() => setActiveSidebarTab('list')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeSidebarTab === 'list'
                  ? 'border-blue-500 text-blue-600 bg-blue-500/5'
                  : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              <Search className="w-4 h-4" /> Wards List
            </button>
          </div>

          {/* Sidebar Panel Contents */}
          <div className="flex-1 overflow-y-auto p-5">
            
            {/* Tab 1: City Overview */}
            {activeSidebarTab === 'city' && (
              <div className="space-y-6">
                
                {/* Terrain Metrics */}
                {terrainStats && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--muted-foreground)] flex items-center gap-1.5 uppercase tracking-wide">
                      <Compass className="w-4 h-4 text-blue-600" /> Terrain Profile
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[var(--secondary)] p-3 rounded-lg border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Elevation (Min/Max)</div>
                        <div className="text-sm font-bold font-mono text-[var(--foreground)] mt-0.5">
                          {terrainStats.elev_min}m - {terrainStats.elev_max}m
                        </div>
                      </div>
                      <div className="bg-[var(--secondary)] p-3 rounded-lg border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Mean Slope</div>
                        <div className="text-sm font-bold font-mono text-[var(--foreground)] mt-0.5">
                          {terrainStats.slope_mean.toFixed(2)}°
                        </div>
                      </div>
                      <div className="bg-[var(--secondary)] p-3 rounded-lg border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Mean Elevation</div>
                        <div className="text-sm font-bold font-mono text-[var(--foreground)] mt-0.5">
                          {terrainStats.elev_mean.toFixed(1)}m
                        </div>
                      </div>
                      <div className="bg-[var(--secondary)] p-3 rounded-lg border border-[var(--border)]">
                        <div className="text-[10px] text-[var(--muted-foreground)] uppercase font-semibold">Total Urban Area</div>
                        <div className="text-sm font-bold font-mono text-[var(--foreground)] mt-0.5">
                          {terrainStats.area_km2.toFixed(1)} km²
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wet Days Graph over time */}
                {rainfallData && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--muted-foreground)] flex items-center gap-1.5 uppercase tracking-wide">
                      <CloudRain className="w-4 h-4 text-blue-600" /> Wet Days Trends
                    </h3>
                    <div className="h-[180px] bg-[var(--secondary)] p-2 rounded-lg border border-[var(--border)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={rainfallData.rainfall.filter((d: any) => d.year >= 2000)} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                          <XAxis dataKey="year" stroke="#64748b" fontSize={9} />
                          <YAxis stroke="#64748b" fontSize={9} />
                          <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                          <Line type="monotone" dataKey="wet_days" name="Wet Days" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Rainfall Peak Month distribution list */}
                {rainfallData && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--muted-foreground)] flex items-center gap-1.5 uppercase tracking-wide">
                      <CloudRain className="w-4 h-4 text-blue-600" /> Monthly Rainfall ({selectedYear})
                    </h3>
                    {(() => {
                      const currentYearRain = rainfallData.rainfall.find((r: any) => r.year === selectedYear);
                      if (!currentYearRain) return <p className="text-xs text-slate-500">No data loaded.</p>;
                      
                      const monthData = Object.entries(currentYearRain.months).map(([name, value]) => ({ name, value }));

                      return (
                        <div className="h-[180px] bg-[var(--secondary)] p-2 rounded-lg border border-[var(--border)]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                              <YAxis stroke="#64748b" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                              <Bar dataKey="value" name="Rainfall (mm)" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Ward Analytics */}
            {activeSidebarTab === 'ward' && (
              <div className="h-full flex flex-col">
                {selectedWardStats ? (
                  <div className="space-y-5">
                    
                    {/* Ward Identity info */}
                    <div>
                      <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded">
                        Ward Details
                      </span>
                      <h2 className="text-lg font-bold text-[var(--foreground)] mt-2">
                        Ward {selectedWardStats.ward_number}: {selectedWardStats.ward_name}
                      </h2>
                      <div className="grid grid-cols-2 mt-3 gap-2">
                        <div className="bg-[var(--secondary)] p-2.5 rounded-lg border border-[var(--border)]">
                          <div className="text-[9px] text-[var(--muted-foreground)] uppercase font-semibold">Population</div>
                          <div className="text-sm font-bold font-mono text-[var(--foreground)] mt-0.5">
                            {selectedWardStats.population.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-[var(--secondary)] p-2.5 rounded-lg border border-[var(--border)]">
                          <div className="text-[9px] text-[var(--muted-foreground)] uppercase font-semibold">Rank</div>
                          <div className="text-sm font-bold font-mono text-red-500 mt-0.5">
                            #{selectedWardStats.rank} <span className="text-[10px] text-[var(--muted-foreground)] font-normal">/ 85</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <hr className="border-[var(--border)]" />

                    {/* Ward indices components FHI, FEI, FVI */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                        Risk Factor Indices ({selectedYear})
                      </h3>
                      
                      <div className="space-y-3">
                        {/* FRI */}
                        <div className="bg-[var(--secondary)] p-3 rounded-lg border border-[var(--border)]">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-[var(--foreground)]">Flood Risk Index (FRI)</span>
                            <span className="font-bold font-mono text-indigo-500">{selectedWardStats.fri_mean.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-[var(--border)] h-2 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${Math.min(100, (selectedWardStats.fri_mean / 40) * 100)}%`,
                                backgroundColor: getCategoryColor(selectedWardStats.category) 
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] mt-1.5">
                            <span>Category: <strong style={{ color: getCategoryColor(selectedWardStats.category) }}>{selectedWardStats.category}</strong></span>
                            <span>Max: {selectedWardStats.fri_max.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* FHI */}
                        <div className="bg-[var(--secondary)] p-2.5 rounded-lg border border-[var(--border)]">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[var(--muted-foreground)] font-medium">Flood Hazard Index (FHI)</span>
                            <span className="font-bold font-mono text-rose-500">{selectedWardStats.fhi_mean.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-[var(--border)] h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-rose-500 rounded-full" 
                              style={{ width: `${(selectedWardStats.fhi_mean / 4) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* FEI */}
                        <div className="bg-[var(--secondary)] p-2.5 rounded-lg border border-[var(--border)]">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[var(--muted-foreground)] font-medium">Flood Exposure Index (FEI)</span>
                            <span className="font-bold font-mono text-amber-500">{selectedWardStats.fei_mean.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-[var(--border)] h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full" 
                              style={{ width: `${(selectedWardStats.fei_mean / 3) * 100}%` }}
                            />
                          </div>
                        </div>

                        {/* FVI */}
                        <div className="bg-[var(--secondary)] p-2.5 rounded-lg border border-[var(--border)]">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-[var(--muted-foreground)] font-medium">Flood Vulnerability Index (FVI)</span>
                            <span className="font-bold font-mono text-emerald-500">{selectedWardStats.fvi_mean.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-[var(--border)] h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full" 
                              style={{ width: `${(selectedWardStats.fvi_mean / 4) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowTrendModal(true)}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-900/10 text-sm"
                    >
                      <Eye className="w-4 h-4" /> View Historical Trends (1981 - 2024)
                    </button>

                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[var(--secondary)] rounded-xl border border-[var(--border)]">
                    <Compass className="w-8 h-8 text-[var(--muted-foreground)] mb-3" />
                    <p className="text-[var(--foreground)] text-sm font-semibold">No Ward Selected</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Select a ward by clicking on the interactive map or using the search menu.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Wards Search and List */}
            {activeSidebarTab === 'list' && (
              <div className="space-y-4">
                
                {/* Search input field */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-[var(--muted-foreground)] w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by Ward name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Table list */}
                <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)] shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[var(--secondary)] text-[var(--muted-foreground)] uppercase tracking-wider text-[10px] border-b border-[var(--border)]">
                      <tr>
                        <th className="py-2 px-3">Ward</th>
                        <th className="py-2 px-3">FRI Score</th>
                        <th className="py-2 px-3 text-right">Rank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {filteredWards.length > 0 ? (
                        filteredWards.map((w: any) => {
                          const isSelected = selectedWard?.id === w.ward_id;
                          return (
                            <tr
                              key={w.ward_id}
                              onClick={() => setSelectedWard({ id: w.ward_id, name: w.ward_name })}
                              className={`cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-blue-500/10 hover:bg-blue-500/15' 
                                  : 'hover:bg-[var(--secondary)]'
                              }`}
                            >
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-[var(--foreground)]">Ward {w.ward_number}</div>
                                <div className="text-[10px] text-[var(--muted-foreground)]">{w.ward_name}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-mono font-bold mr-1.5 text-[var(--foreground)]">{w.fri_mean.toFixed(2)}</span>
                                <span 
                                  className="text-[9px] px-1 rounded-sm font-bold uppercase tracking-wider"
                                  style={{ backgroundColor: `${getCategoryColor(w.category)}15`, color: getCategoryColor(w.category) }}
                                >
                                  {w.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-semibold text-[var(--muted-foreground)]">
                                #{w.rank}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-[var(--muted-foreground)]">
                            No matching Wards found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>
        </aside>

        {/* Center/Right Area: Leaflet Map Container */}
        <section className="flex-1 p-5 bg-[var(--background)]/20 relative">
          <Map
            geojsonData={geojsonData}
            selectedWardId={selectedWard?.id || null}
            onSelectWard={(id, name) => setSelectedWard({ id, name })}
            theme={theme}
          />
        </section>

      </main>

      {/* Detailed historical trends analysis modal */}
      {showTrendModal && selectedWard && (
        <WardDetailModal
          wardId={selectedWard.id}
          wardName={selectedWard.name}
          theme={theme}
          onClose={() => setShowTrendModal(false)}
        />
      )}

      {/* Landing Selection Overlay */}
      {showLanding && (
        <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[var(--background)] transition-colors duration-200 ${theme}`}>
          <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-visible p-8 space-y-6 flex flex-col">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <ShieldAlert className="text-blue-500 w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--foreground)] tracking-tight">Urban Flood Risk Explorer</h2>
              <p className="text-sm text-[var(--muted-foreground)]">Select a city and year to load the GIS Analytics Map</p>
            </div>

            <div className="space-y-4">
              {/* City Selection */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" /> Choose City
                </label>
                <div 
                  onClick={() => {
                    setIsCityDropdownOpen(!isCityDropdownOpen);
                    setIsYearDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500 cursor-pointer flex justify-between items-center"
                >
                  <span>{cities.find(c => c.id === landingCityId)?.name || 'Select City'}</span>
                  <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {isCityDropdownOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-[20000] py-1">
                    {cities.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setLandingCityId(c.id);
                          setIsCityDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 text-sm hover:bg-[var(--secondary)] cursor-pointer transition-colors ${landingCityId === c.id ? 'bg-blue-500/10 text-blue-500 font-semibold' : 'text-[var(--foreground)]'}`}
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Selection */}
              <div className="space-y-1.5 relative">
                <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Choose Year (1981 - 2024)
                </label>
                <div 
                  onClick={() => {
                    setIsYearDropdownOpen(!isYearDropdownOpen);
                    setIsCityDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500 cursor-pointer flex justify-between items-center"
                >
                  <span>{landingYear}</span>
                  <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                {isYearDropdownOpen && (
                  <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-[20000] py-1">
                    {yearsRange.map((yr) => (
                      <div
                        key={yr}
                        onClick={() => {
                          setLandingYear(yr);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`px-4 py-2.5 text-sm hover:bg-[var(--secondary)] cursor-pointer transition-colors ${landingYear === yr ? 'bg-blue-500/10 text-blue-500 font-semibold' : 'text-[var(--foreground)]'}`}
                      >
                        {yr}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCityId(landingCityId);
                setSelectedYear(landingYear);
                setShowLanding(false);
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm"
            >
              Launch GIS Analytics Map
            </button>
            
            <div className="flex justify-between items-center text-xs text-[var(--muted-foreground)] border-t border-[var(--border)] pt-4">
              <span>Theme Preference:</span>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-3 py-1.5 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-all flex items-center gap-1.5 font-semibold cursor-pointer"
              >
                {theme === 'dark' ? (
                  <><Sun className="w-3.5 h-3.5 text-amber-500" /> Light Mode</>
                ) : (
                  <><Moon className="w-3.5 h-3.5 text-indigo-500" /> Dark Mode</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
