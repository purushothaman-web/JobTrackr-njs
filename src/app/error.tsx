'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import ErrorAnimation from '@/components/ErrorAnimation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
      <ErrorAnimation />
      <h1 className="mt-8 text-3xl font-bold text-slate-900">Something went wrong!</h1>
      <p className="mt-4 max-w-md text-slate-600">
        Don't worry, it's not you - it's us. We encountered an unexpected ghost in the machine.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => reset()}
          className="btn-primary px-6 py-2"
        >
          Try Again
        </button>
        <Link href="/jobs" className="btn-secondary px-6 py-2">
          Go Home
        </Link>
      </div>
    </div>
  );
}
