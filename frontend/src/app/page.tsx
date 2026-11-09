'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronDown, Sun, Moon, Video, ArrowRight } from 'lucide-react';
import { FullPageLoader } from '@/components/LoadingSpinner';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface CityItem {
  id: number;
  name: string;
}

export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const storedTheme = window.localStorage.getItem('floodrisk-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }
  }, []);

  // Fetch Cities from API
  useEffect(() => {
    fetch(`${API_BASE}/api/cities`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: CityItem[]) => {
        setCities(data);
        if (data.length > 0) setSelectedCityId(data[0].id);
      })
      .catch((err) => console.error('Error fetching cities', err))
      .finally(() => setCitiesLoading(false));
  }, []);

  const yearsRange = Array.from({ length: 2024 - 1981 + 1 }, (_, i) => 1981 + i);

  const handleLaunchGIS = () => {
    router.push(`/dashboard?city=${selectedCityId}&year=${selectedYear}`);
  };

  const handleGoToReporting = () => {
    router.push('/report');
  };

  return (
    <>
      {citiesLoading && (
        <FullPageLoader
          message="Connecting to FloodRisk"
          submessage="Loading available cities and geographic models…"
          theme={theme}
        />
      )}

      <div
        className={`${theme} min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200 flex flex-col justify-between`}
      >
        {/* Top Header */}
        <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            
            <div>
              <span className="text-lg font-bold tracking-tight text-[var(--foreground)] block">
                <span className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white p-1.5 shadow-sm">
                    <Image
                      src="/iiti_logo.png"
                      alt="IIT Indore logo"
                      width={40}
                      height={40}
                      className="h-full w-full object-contain"
                    />
                  </span>
                  FloodRisk
                </span>
              </span>
              <span className="text-[11px] text-[var(--muted-foreground)]">
                {/* Urban Inundation GIS & Citizen Alert Platform */}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(nextTheme);
                window.localStorage.setItem('floodrisk-theme', nextTheme);
              }}
              className="px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-xl hover:bg-[var(--secondary)] transition-all flex items-center gap-1.5 font-semibold text-xs cursor-pointer shadow-xs"
            >
              {mounted ? (
                theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )
              ) : (
                <span className="w-3.5 h-3.5 inline-block" />
              )}
            </button>
          </div>
        </header>

        {/* Main Portal Cards Grid */}
        <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col justify-center">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              Urban Flood Risk & Incident Hub
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
              Explore 40+ years of ward-level GIS vulnerability analytics or report real-time flooding in your area.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* GIS Analytics */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    GIS Analytics
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    Urban Flood Risk Explorer
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
                    Access multi-tier spatial models, Ward FRI/FHI/FEI/FVI indices, historical precipitation trends, and elevation profiles.
                  </p>
                </div>

                {/* Dropdowns */}
                <div className="space-y-3 pt-1">
                  {/* City Selection */}
                  <div className="space-y-1.5 relative z-50">
                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                       Choose City
                    </label>
                    <div
                      onClick={() => {
                        setIsCityDropdownOpen(!isCityDropdownOpen);
                        setIsYearDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500 cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-semibold">
                        {cities.find((c) => c.id === selectedCityId)?.name || 'Select City'}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${
                          isCityDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {isCityDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl max-h-56 overflow-y-auto py-1 z-50">
                        {cities.map((c) => (
                          <div
                            key={c.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCityId(c.id);
                              setIsCityDropdownOpen(false);
                            }}
                            className={`px-4 py-2.5 text-xs sm:text-sm hover:bg-[var(--secondary)] cursor-pointer transition-colors ${
                              selectedCityId === c.id
                                ? 'bg-blue-500/10 text-blue-500 font-semibold'
                                : 'text-[var(--foreground)]'
                            }`}
                          >
                            {c.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Year Selection */}
                  <div className="space-y-1.5 relative z-40">
                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                       Choose Year (1981 - 2024)
                    </label>
                    <div
                      onClick={() => {
                        setIsYearDropdownOpen(!isYearDropdownOpen);
                        setIsCityDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--foreground)] focus:outline-none focus:border-blue-500 cursor-pointer flex justify-between items-center"
                    >
                      <span className="font-semibold">{selectedYear}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${
                          isYearDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {isYearDropdownOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl max-h-56 overflow-y-auto z-[20000] py-1">
                        {yearsRange.map((yr) => (
                          <div
                            key={yr}
                            onClick={() => {
                              setSelectedYear(yr);
                              setIsYearDropdownOpen(false);
                            }}
                            className={`px-4 py-2 text-xs sm:text-sm hover:bg-[var(--secondary)] cursor-pointer transition-colors ${
                              selectedYear === yr
                                ? 'bg-blue-500/10 text-blue-500 font-semibold'
                                : 'text-[var(--foreground)]'
                            }`}
                          >
                            {yr}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLaunchGIS}
                  disabled={citiesLoading || cities.length === 0}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  
                  <span>Launch GIS Analytics Map</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

              </div>
            </div>

            {/* Flood Reporting */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden transition-all group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    Citizen Reporting
                  </span>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    Report a Flood in Region
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--muted-foreground)] leading-relaxed">
                    Witnessing waterlogging, submerged transit corridors, or blocked storm drains? Submit an on-ground incident report to inform municipal teams and alert citizens.
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="p-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] flex items-center gap-2 text-xs">
                    
                    <span className="font-medium text-[11px]">Interactive Map Pinning</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] flex items-center gap-2 text-xs">
                    
                    <span className="font-medium text-[11px]">Photo & Video Proof</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] flex items-center gap-2 text-xs">
                    
                    <span className="font-medium text-[11px]">Depth & Drain Blockage</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[var(--secondary)]/60 border border-[var(--border)] flex items-center gap-2 text-xs">
                    
                    <span className="font-medium text-[11px]">Road & House Flooding</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleGoToReporting}
                  className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/25 text-sm flex items-center justify-center gap-2 cursor-pointer group-hover:scale-[1.01]"
                >
                  
                  <span>Report a Flood Incident Now</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() => router.push('/report')}
                  className="w-full py-2.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-semibold transition-colors cursor-pointer text-center"
                >
                  Browse Recent Incident Reports →
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FloodRisk GIS Analytics & Community Incident Reporting System</span>
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoToReporting}
              className="text-red-600 dark:text-red-400 hover:underline font-medium cursor-pointer"
            >
              Report a Flood
            </button>
            <span>•</span>
            <button
              onClick={handleLaunchGIS}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer"
            >
              GIS Explorer
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
