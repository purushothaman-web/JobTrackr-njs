'use client';

import React from 'react';
import Link from 'next/link';
import ErrorAnimation from '@/components/ErrorAnimation';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <ErrorAnimation />
      <h1 className="mt-8 text-4xl font-bold text-slate-900">Page Not Found</h1>
      <p className="mt-4 max-w-md text-slate-600">
        Oops! The page you are looking for seems to have drifted away into the void.
      </p>
      <Link href="/jobs" className="btn-primary mt-8 px-8 py-3">
        Go Back Home
      </Link>
    </div>
  );
}
