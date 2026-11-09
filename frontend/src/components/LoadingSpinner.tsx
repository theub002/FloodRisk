'use client';

import { ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

/**
 * Full-screen loading overlay — used when the entire app is waiting
 * for the backend to respond (initial boot, page transitions).
 */
export function FullPageLoader({
  message = 'Loading...',
  submessage,
  theme,
}: {
  message?: string;
  submessage?: string;
  theme?: Theme;
}) {
  const [resolvedTheme, setResolvedTheme] = useState<Theme>(theme || 'light');

  useEffect(() => {
    if (theme) {
      setResolvedTheme(theme);
      return;
    }

    const storedTheme = window.localStorage.getItem('floodrisk-theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setResolvedTheme(storedTheme);
    }
  }, [theme]);

  return (
    <div className={`${resolvedTheme} fixed inset-0 z-[99999] flex items-center justify-center bg-[var(--background)] animate-fade-in`}>
      <div className="flex flex-col items-center gap-7">
        {/* Ripple spinner */}
        <div className="relative w-20 h-20">
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-500/40"
            style={{ animation: 'ripple 1.6s cubic-bezier(0,0.2,0.8,1) infinite' }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-blue-500/40"
            style={{ animation: 'ripple 1.6s cubic-bezier(0,0.2,0.8,1) infinite', animationDelay: '-0.8s' }}
          />
          <div className="absolute inset-0 flex items-center justify-center rounded-full border border-blue-500/25 bg-blue-500/[0.04]">
            <ShieldAlert className="w-7 h-7 text-blue-500 animate-loader-breathe" />
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <p className="text-base font-semibold text-[var(--foreground)] tracking-tight">{message}</p>
          {submessage && (
            <p className="text-sm text-[var(--muted-foreground)]">{submessage}</p>
          )}
        </div>

        {/* Thin progress bar */}
        <div className="w-56 progress-bar-indeterminate rounded-full" />
      </div>
    </div>
  );
}

/**
 * Inline overlay with backdrop blur — used on top of the map area
 * or sidebar when data is being fetched for city/year change.
 */
export function OverlayLoader({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-[var(--background)] animate-fade-in rounded-xl">
      <div className="flex flex-col items-center gap-5 animate-slide-up">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-[3px] border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-sm font-medium text-[var(--muted-foreground)]">{message}</p>
      </div>
    </div>
  );
}

/**
 * Skeleton block placeholders — used in sidebar panels
 * to show loading state for stats, charts, etc.
 */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in p-5">
      {/* Title area skeleton */}
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-24 col-span-2" />
          <SkeletonBlock className="h-20" />
          <SkeletonBlock className="h-20" />
        </div>
      </div>

      {/* Terrain area skeleton */}
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
        </div>
      </div>

      {/* Chart area skeleton */}
      <div className="space-y-2">
        <SkeletonBlock className="h-4 w-36" />
        <SkeletonBlock className="h-[180px]" />
      </div>
    </div>
  );
}

/**
 * Thin progress bar that sits at the very top of the page.
 * Shows during city/year transitions as a subtle indicator.
 */
export function TopProgressBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[99998] progress-bar-indeterminate" />
  );
}
