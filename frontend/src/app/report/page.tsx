'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, MapPin, Camera, Video, X, CheckCircle2, Sun, Moon, Clock } from 'lucide-react';
import WaterDepthSelector from '@/components/WaterDepthSelector';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Dynamically load Leaflet Map picker component without SSR
const ReportMapPicker = dynamic(() => import('@/components/ReportMapPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[440px] rounded-2xl bg-[var(--secondary)] border border-[var(--border)] flex flex-col items-center justify-center gap-3 animate-pulse">
      <MapPin className="w-8 h-8 text-blue-500 animate-bounce" />
      <p className="text-sm text-[var(--muted-foreground)] font-medium">Loading Interactive Map...</p>
    </div>
  ),
});

interface FilePreview {
  file: File;
  url: string;
  type: 'image' | 'video';
  name: string;
  size: string;
}

interface SubmittedReport {
  id: number;
  created_at: string;
  city_name?: string;
  latitude: number;
  longitude: number;
  flood_depth: string;
  blockage: string;
  road_submerged: string;
  house_flooding: string;
  description?: string;
  reporter_name?: string;
  media_urls?: string[];
  status: string;
}

export default function ReportPage() {
  const router = useRouter();

  // Theme setup
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  const [activeTab, setActiveTab] = useState<'form' | 'recent'>('form');

  // Location Coordinates state (defaults to Bhopal)
  const [latitude, setLatitude] = useState<number>(23.2599);
  const [longitude, setLongitude] = useState<number>(77.4126);
  const [addressNotes, setAddressNotes] = useState<string>('');
  const [detectedAddress, setDetectedAddress] = useState<string>('');

  // Flood details state
  const [floodDepth, setFloodDepth] = useState<string>('');
  const [customDepth, setCustomDepth] = useState<string>('');
  const [showCustomDepth, setShowCustomDepth] = useState<boolean>(false);

  const [depthUnit, setDepthUnit] = useState('');
  const [description, setDescription] = useState<string>('');

  // Media files state
  const [mediaFiles, setMediaFiles] = useState<FilePreview[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reporter details
  const [reporterName, setReporterName] = useState<string>('');
  const [reporterPhone, setReporterPhone] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReport, setSubmittedReport] = useState<SubmittedReport | null>(null);

  // Recent reports state
  const [recentReports, setRecentReports] = useState<SubmittedReport[]>([]);
  const [recentLoading, setRecentLoading] = useState<boolean>(false);

  useEffect(() => {
    // Browser theme is restored after hydration to keep the initial render consistent.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const storedTheme = window.localStorage.getItem('floodrisk-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme);
    }
  }, []);

  const fetchRecentReports = async () => {
    setRecentLoading(true);
    try {
      let reportsData: SubmittedReport[] | null = null;

      // 1. Try configured API_BASE
      try {
        const res = await fetch(`${API_BASE}/api/reports?limit=50`);
        if (res.ok) {
          reportsData = await res.json();
        }
      } catch {
        // Fall through
      }

      // 2. Try local FastAPI on port 8000 if API_BASE is remote or failed
      if (!reportsData && API_BASE !== 'http://localhost:8000') {
        try {
          const res = await fetch('http://localhost:8000/api/reports?limit=50');
          if (res.ok) {
            reportsData = await res.json();
          }
        } catch {
          // Fall through
        }
      }

      // 3. Try internal Next.js route handler (/api/reports)
      if (!reportsData) {
        try {
          const res = await fetch('/api/reports?limit=50');
          if (res.ok) {
            reportsData = await res.json();
          }
        } catch {
          // Fall through
        }
      }

      setRecentReports(reportsData || []);
    } catch (err) {
      console.error('Error loading reports', err);
      setRecentReports([]);
    } finally {
      setRecentLoading(false);
    }
  };

  // Handle Location Change from Leaflet Map
  const handleLocationChange = (lat: number, lng: number, placeName?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setDetectedAddress(placeName || '');
  };

  // Handle File Uploads (Images and Videos)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = '';
  };

  const processFiles = (newFiles: File[]) => {
    const formattedPreviews: FilePreview[] = newFiles.map((file) => {
      const isVideo = file.type.startsWith('video/');
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      return {
        file,
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name,
        size: `${sizeInMb} MB`,
      };
    });

    setMediaFiles((prev) => [...prev, ...formattedPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    setMediaFiles((prev) => {
      const target = prev[index];
      if (target) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (isSubmitting) return;
    if (showCustomDepth ? (!depthUnit || !customDepth.trim() || !Number.isFinite(Number(customDepth)) || Number(customDepth) <= 0) : !floodDepth) {
      setSubmitError('Select an observed body-height level, or choose a unit and enter a positive water depth.');
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      setSubmitError('Please pick a flood incident location on the map.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      if (addressNotes.trim()) {
        formData.append('address_notes', addressNotes.trim());
      }

      formData.append('flood_depth', showCustomDepth ? `Exact depth: ${Number(customDepth)} ${depthUnit}` : floodDepth);
      if (showCustomDepth && customDepth.trim()) {
        formData.append('flood_depth_custom', `${Number(customDepth)} ${depthUnit}`);
      }

      // Keep the existing API contract without asserting unobserved conditions.
      formData.append('blockage', 'Not specified');
      formData.append('road_submerged', 'Not specified');
      formData.append('vehicles_stranded', 'false');
      formData.append('house_flooding', 'Not specified');

      if (description.trim()) {
        formData.append('description', description.trim());
      }

      formData.append('reporter_name', isAnonymous ? 'Anonymous Citizen' : (reporterName.trim() || 'Anonymous'));
      if (!isAnonymous && reporterPhone.trim()) {
        formData.append('reporter_phone', reporterPhone.trim());
      }

      // Attach photos and videos
      mediaFiles.forEach((item) => {
        formData.append('files', item.file);
      });

      let submitSuccessful = false;
      let resultData: SubmittedReport | null = null;

      // 1. Primary attempt: configured API_BASE (Render backend or custom)
      try {
        const primaryRes = await fetch(`${API_BASE}/api/reports`, {
          method: 'POST',
          body: formData,
        });

        if (primaryRes.ok) {
          resultData = await primaryRes.json();
          submitSuccessful = true;
        } else if (primaryRes.status !== 404) {
          const errorData = await primaryRes.json().catch(() => ({}));
          throw new Error(errorData.detail || `Server returned ${primaryRes.status}`);
        }
      } catch (err) {
        if (err instanceof Error && !err.message.includes('404') && !err.message.includes('Failed to fetch')) {
          console.warn('Primary report submission error:', err);
        }
      }

      // 2. Secondary attempt: local FastAPI backend on port 8000
      if (!submitSuccessful && API_BASE !== 'http://localhost:8000') {
        try {
          const localRes = await fetch('http://localhost:8000/api/reports', {
            method: 'POST',
            body: formData,
          });

          if (localRes.ok) {
            resultData = await localRes.json();
            submitSuccessful = true;
          }
        } catch {
          // Local FastAPI not running
        }
      }

      // 3. Tertiary attempt: internal Next.js API route (/api/reports)
      if (!submitSuccessful) {
        try {
          const nextRes = await fetch('/api/reports', {
            method: 'POST',
            body: formData,
          });

          if (nextRes.ok) {
            resultData = await nextRes.json();
            submitSuccessful = true;
          } else {
            const errData = await nextRes.json().catch(() => ({}));
            throw new Error(errData.error || errData.detail || `Server returned ${nextRes.status}`);
          }
        } catch (err) {
          throw new Error(
            err instanceof Error ? err.message : 'Unable to submit report. Please check server connection.'
          );
        }
      }

      if (submitSuccessful && resultData) {
        setSubmittedReport(resultData);
      } else {
        throw new Error('Could not submit report to server or local store.');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit flood report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedReport(null);
    setMediaFiles([]);
    setAddressNotes('');
    setDescription('');
    setFloodDepth('');
    setCustomDepth('');
    setDepthUnit('');
    setShowCustomDepth(false);
  };

  return (
    <>

      <div
        className={`${theme} min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200 flex flex-col`}
      >
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-40 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] transition-colors text-[var(--foreground)] cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-[var(--border)]">
              
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight flex items-center gap-2">
                  Flood Reporter
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
                    Live Incident
                  </span>
                </h1>
                <p className="text-[11px] text-[var(--muted-foreground)] hidden sm:block">
                  Submit on-ground inundation, blockage, and depth metrics with photo/video proof
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tab switch */}
            <div className="flex p-1 bg-[var(--secondary)] rounded-xl border border-[var(--border)] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'form'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Report Flood
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('recent'); void fetchRecentReports(); }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeTab === 'recent'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                Recent Reports
              </button>
            </div>

            {/* Link to GIS Dashboard */}
            <button
              onClick={() => router.push('/dashboard')}
              className="hidden md:flex px-3 py-1.5 bg-[var(--secondary)] hover:bg-[var(--border)] text-xs font-semibold rounded-xl border border-[var(--border)] items-center gap-1.5 cursor-pointer transition-colors"
            >
              
              GIS Map
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark';
                setTheme(nextTheme);
                window.localStorage.setItem('floodrisk-theme', nextTheme);
              }}
              className="p-2 rounded-xl bg-[var(--secondary)] hover:bg-[var(--border)] border border-[var(--border)] transition-colors cursor-pointer"
              title="Toggle theme"
            >
              {mounted ? (
                theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-500" />
                )
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'recent' ? (
            /* RECENT REPORTS TAB */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card)] border border-[var(--border)] p-6 rounded-2xl shadow-sm">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Recent Community Flood Reports</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Live crowd-sourced reports from citizens and emergency responders
                  </p>
                </div>
                <button
                  onClick={fetchRecentReports}
                  disabled={recentLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 self-start sm:self-auto"
                >
                  {recentLoading ? 'Refreshing…' : 'Refresh Reports'}
                </button>
              </div>

              {recentLoading ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-[var(--muted-foreground)]">Loading community reports…</p>
                </div>
              ) : recentReports.length === 0 ? (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold">No active flood reports logged yet</h3>
                  <p className="text-xs text-[var(--muted-foreground)] max-w-sm mx-auto">
                    Be the first to submit a flood incident report to notify the municipality and citizen network.
                  </p>
                  <button
                    onClick={() => setActiveTab('form')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Submit a Flood Report
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 space-y-4 shadow-sm hover:border-red-500/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-red-600 dark:text-red-400">
                              #FLD-{report.id}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[var(--secondary)] text-[var(--foreground)] font-medium">
                              {report.city_name || 'Reported location'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--muted-foreground)] flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          {report.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/60">
                          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                            Flood Depth
                          </span>
                          <span className="font-semibold text-red-600 dark:text-red-400">
                            {report.flood_depth}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/60">
                          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                            Road Status
                          </span>
                          <span className="font-semibold">{report.road_submerged}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/60">
                          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                            Drain Blockage
                          </span>
                          <span className="font-medium text-[var(--foreground)]">{report.blockage}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--secondary)]/60">
                          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] block">
                            House Flooding
                          </span>
                          <span className="font-medium text-[var(--foreground)]">{report.house_flooding}</span>
                        </div>
                      </div>

                      {report.description && (
                        <p className="text-xs text-[var(--muted-foreground)] bg-[var(--background)] p-3 rounded-xl border border-[var(--border)]">
                          {report.description}
                        </p>
                      )}

                      {/* Photo / Video previews */}
                      {report.media_urls && report.media_urls.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]">
                            Attached Media ({report.media_urls.length})
                          </span>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {report.media_urls.map((url, i) => {
                              const isVid = url.endsWith('.mp4') || url.endsWith('.mov') || url.endsWith('.webm');
                              const mediaSrc = url.startsWith('http')
                                ? url
                                : (API_BASE && !API_BASE.includes('onrender.com') ? `${API_BASE}${url}` : url);
                              return isVid ? (
                                <video
                                  key={i}
                                  src={mediaSrc}
                                  controls
                                  className="w-24 h-20 rounded-lg object-cover bg-black border border-[var(--border)] shrink-0"
                                />
                              ) : (
                                <a
                                  key={i}
                                  href={mediaSrc}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0"
                                >
                                  <img
                                    src={mediaSrc}
                                    alt="Flood evidence"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      if (!target.src.includes(':8000') && !target.src.startsWith('http')) {
                                        target.src = `http://localhost:8000${url}`;
                                      }
                                    }}
                                    className="w-24 h-20 rounded-lg object-cover border border-[var(--border)] hover:opacity-85 transition-opacity"
                                  />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[var(--border)] flex justify-between items-center text-[11px] text-[var(--muted-foreground)]">
                        <span className="font-mono">
                          📍 {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                        </span>
                        <span>Reported by: {report.reporter_name || 'Anonymous'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : submittedReport ? (
            /* SUCCESS CONFIRMATION SCREEN */
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xl p-6 sm:p-10 max-w-2xl mx-auto space-y-6 text-center animate-fade-in">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Incident Logged Successfully
                </span>
                <h2 className="text-2xl font-bold tracking-tight">Report #{submittedReport.id} Submitted</h2>
                <p className="text-xs text-[var(--muted-foreground)] max-w-md mx-auto">
                  Thank you for contributing real-time field data. Your report is now visible to regional disaster
                  response units and local citizens.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-[var(--secondary)]/50 border border-[var(--border)] rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted-foreground)]">Location Coordinates:</span>
                  <span className="font-mono font-semibold">
                    {submittedReport.latitude.toFixed(5)}, {submittedReport.longitude.toFixed(5)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted-foreground)]">Estimated Depth:</span>
                  <span className="font-semibold text-red-500">{submittedReport.flood_depth}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted-foreground)]">Road Inundation:</span>
                  <span className="font-semibold">{submittedReport.road_submerged}</span>
                </div>
                <div className="flex justify-between border-b border-[var(--border)] pb-2">
                  <span className="text-[var(--muted-foreground)]">Drain Blockage:</span>
                  <span className="font-semibold">{submittedReport.blockage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Residential Status:</span>
                  <span className="font-semibold">{submittedReport.house_flooding}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Submit Another Report
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('recent'); void fetchRecentReports(); }}
                  className="px-5 py-2.5 bg-[var(--secondary)] hover:bg-[var(--border)] text-[var(--foreground)] font-bold text-xs rounded-xl border border-[var(--border)] transition-all cursor-pointer"
                >
                  View All Recent Reports
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Open GIS Analytics Map
                </button>
              </div>
            </div>
          ) : (
            /* REPORTING FORM */
            <form onSubmit={handleSubmit} onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
              const target = event.target as HTMLElement;
              if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON' && target.getAttribute('role') !== 'button') event.preventDefault();
            }} className="space-y-8 animate-fade-in">
              {/* Card 1: Geographic Location Selection */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      
                      <h2 className="text-base font-bold tracking-tight">1. Pick Flood Location on Map</h2>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Click anywhere on the map or drag the pin to mark the exact flooded street or area.
                    </p>
                  </div>

                </div>

                {/* Leaflet Map Picker Component */}
                <ReportMapPicker
                  latitude={latitude}
                  longitude={longitude}
                  onChangeLocation={handleLocationChange}
                  onAddressDetected={(addr) => setDetectedAddress(addr)}
                  theme={theme}
                />

                {/* Street / Landmark input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                       Landmark or Street Details (Optional)
                    </label>
                    {detectedAddress && (
                      <button
                        type="button"
                        onClick={() => setAddressNotes(detectedAddress)}
                        className="text-[11px] text-blue-500 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                        title="Click to fill landmark with location detected from map"
                      >
                        Auto-fill: <span className="font-normal truncate max-w-[180px] sm:max-w-xs">{detectedAddress}</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={addressNotes}
                    onChange={(e) => setAddressNotes(e.target.value)}
                    placeholder="e.g. Near New Market Metro Pillar 42, Link Road No. 1, near drainage culvert"
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Card 2: Flood Characteristics & Depth */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
                <div className="space-y-1 border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-2">
                    
                    <h2 className="text-base font-bold tracking-tight">2. Flood Severity & Water Depth</h2>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Select the approximate standing water level at the deepest observable point.
                  </p>
                </div>

                <WaterDepthSelector
                  value={floodDepth} onChange={setFloodDepth}
                  exact={showCustomDepth} onExactChange={setShowCustomDepth}
                  unit={depthUnit} onUnitChange={setDepthUnit}
                  measurement={customDepth} onMeasurementChange={setCustomDepth}
                />

                {/* Additional Description Notes */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider flex items-center gap-1.5">
                     Other Details / Danger Factors
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what you observed: blocked drains, submerged roads, affected homes, rising or receding water, or other hazards..."
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Card 3: Photo and Video Upload */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
                <div className="space-y-1 border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                      <Camera className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-bold tracking-tight">3. Photos & Video Upload</h2>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Upload visual evidence of the water level, road condition, or drainage blockage (JPEG, PNG, MP4,
                    MOV).
                  </p>
                </div>

                {/* Dropzone container */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files) {
                      processFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  className="border-2 border-dashed border-[var(--border)] hover:border-red-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/60 flex flex-col items-center justify-center gap-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="p-3 rounded-full bg-purple-500/10 text-purple-500">
                      <Video className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-[var(--foreground)]">
                      Click to choose photos & videos, or drag & drop files here
                    </p>
                    <p className="text-[11px] text-[var(--muted-foreground)] mt-1">
                      Supports multiple photos (JPG, PNG, WebP) and short video clips (MP4, MOV, WebM)
                    </p>
                  </div>
                </div>

                {/* Preview Cards */}
                {mediaFiles.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">
                      Selected Files ({mediaFiles.length})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {mediaFiles.map((item, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-black/5 aspect-video flex items-center justify-center shadow-xs"
                        >
                          {item.type === 'image' ? (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <video src={item.url} className="w-full h-full object-cover" controls={false} />
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFile(idx);
                            }}
                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {/* File badge */}
                          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-mono flex items-center gap-1">
                            {item.type === 'video' ? <Video className="w-2.5 h-2.5" /> : <Camera className="w-2.5 h-2.5" />}
                            <span>{item.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card 4: Reporter Contact Info (Optional) */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="space-y-0.5">
                    <h2 className="text-base font-bold tracking-tight">4. Reporter Details (Optional)</h2>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Provide contact for civic coordination, or report anonymously.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded border-[var(--border)] text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                      Submit Anonymously
                    </span>
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--muted-foreground)] flex items-center gap-1.5">
                         Your Name / Organization
                      </label>
                      <input
                        type="text"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[var(--muted-foreground)] flex items-center gap-1.5">
                         Phone Number (For Verification)
                      </label>
                      <input
                        type="tel"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)]/60 focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error banner */}
              {submitError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-3">
                  
                  <p className="font-semibold">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-1.5">
                  
                  <span>Report will be pinned at Lat {latitude.toFixed(4)}, Lng {longitude.toFixed(4)}</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto min-w-[220px] py-3.5 px-8 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-500/25 text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting Report…</span>
                    </>
                  ) : (
                    <>
                      
                      <span>Submit Flood Incident Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </main>
      </div>
    </>
  );
}

