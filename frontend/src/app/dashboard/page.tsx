'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Dashboard = dynamic(() => import('@/components/Dashboard'), {
  ssr: false,
});

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 bg-slate-50 min-h-screen flex items-center justify-center">Loading Dashboard...</div>}>
      <Dashboard />
    </Suspense>
  );
}
