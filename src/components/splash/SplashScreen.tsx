'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const DISPLAY_DURATION_MS = 2600;
const FADE_DURATION_MS = 500;

/**
 * Brief branded intro shown once before the main app appears. Purely
 * cosmetic — auto-dismisses on its own after a short display window, no
 * click required (though the whole screen is also clickable to skip).
 */
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const fadeInTimer = setTimeout(() => setVisible(true), 20);
    const fadeOutTimer = setTimeout(() => setFadingOut(true), DISPLAY_DURATION_MS);
    const finishTimer = setTimeout(() => onFinish(), DISPLAY_DURATION_MS + FADE_DURATION_MS);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  function handleSkip() {
    setFadingOut(true);
    setTimeout(onFinish, FADE_DURATION_MS);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSkip}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') handleSkip();
      }}
      aria-label="Skip intro"
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-ink-900 transition-opacity ease-out"
      style={{ opacity: visible && !fadingOut ? 1 : 0, transitionDuration: `${FADE_DURATION_MS}ms` }}
    >
      <div
        className="flex items-center gap-8 transition-all ease-out sm:gap-10"
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transitionDuration: '700ms',
        }}
      >
        <div className="flex flex-col">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            Brought to you by
          </p>
          <p className="font-display text-4xl font-medium leading-[1.1] text-white sm:text-6xl">Trust me bro</p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/trust-me-bro.avif"
          alt="Trust me bro"
          className="h-40 w-40 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 sm:h-56 sm:w-56"
        />
      </div>
    </div>
  );
}
