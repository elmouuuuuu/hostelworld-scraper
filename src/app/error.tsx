'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Eyebrow } from '@/components/ui/Eyebrow';

/**
 * Next.js App Router automatically wraps this route segment in an error
 * boundary using this file — no manual class-component plumbing needed.
 * Without this, any component throwing produces a blank white screen
 * instead of a recoverable error state.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('Unhandled error in app:', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <Eyebrow className="justify-center text-stamp-700">Something went wrong</Eyebrow>
        <h1 className="mt-2 font-display text-2xl font-medium text-ink-900">
          The app hit an unexpected error
        </h1>
        <p className="mt-3 font-body text-sm text-ink-500">
          Nothing was lost — no report was submitted. Try again, or refresh the page.
        </p>
        <div className="mt-6">
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </main>
  );
}
