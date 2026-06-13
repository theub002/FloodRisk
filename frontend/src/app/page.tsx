'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, MapPin, Calendar, ChevronDown, Sun, Moon } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2024);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

  // Fetch Cities from API
  useEffect(() => {
    fetch(`${API_BASE}/api/cities`)
      .then((res) => res.json())
      .then((data) => {
        setCities(data);
        if (data.length > 0) setSelectedCityId(data[0].id);
      })
      .catch((err) => console.error("Error fetching cities", err));
  }, []);

  const yearsRange = Array.from({ length: 2024 - 1981 + 1 }, (_, i) => 1981 + i);

  const handleLaunch = () => {
    router.push(`/dashboard?city=${selectedCityId}&year=${selectedYear}`);
  };

  return (
    <div className={`${theme} min-h-screen flex items-center justify-center p-4 bg-[var(--background)] transition-colors duration-200`}>
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
              <span>{cities.find(c => c.id === selectedCityId)?.name || 'Select City'}</span>
              <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            {isCityDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-[20000] py-1">
                {cities.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCityId(c.id);
                      setIsCityDropdownOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm hover:bg-[var(--secondary)] cursor-pointer transition-colors ${selectedCityId === c.id ? 'bg-blue-500/10 text-blue-500 font-semibold' : 'text-[var(--foreground)]'}`}
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
              <span>{selectedYear}</span>
              <ChevronDown className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
            </div>
            {isYearDropdownOpen && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl max-h-60 overflow-y-auto z-[20000] py-1">
                {yearsRange.map((yr) => (
                  <div
                    key={yr}
                    onClick={() => {
                      setSelectedYear(yr);
                      setIsYearDropdownOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm hover:bg-[var(--secondary)] cursor-pointer transition-colors ${selectedYear === yr ? 'bg-blue-500/10 text-blue-500 font-semibold' : 'text-[var(--foreground)]'}`}
                  >
                    {yr}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleLaunch}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 text-sm cursor-pointer"
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
  );
}
