'use client';

import { Suspense } from 'react';
import LicenseSuccessContent from './content';

export default function LicenseSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">Loading...</div>}>
      <LicenseSuccessContent />
    </Suspense>
  );
}
