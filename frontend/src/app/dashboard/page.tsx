'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { FullPageLoader } from '@/components/LoadingSpinner';

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
});

export default function DashboardPage() {
  return (
    <Suspense fallback={<FullPageLoader message="Preparing FloodRisk dashboard" submessage="Loading map and analysis tools…" />}>
      <Dashboard />
    </Suspense>
  );
}
