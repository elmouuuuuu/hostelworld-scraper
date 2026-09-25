import type { ReactNode } from 'react';

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <p className={`font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink-500 ${className}`}>
      {children}
    </p>
  );
}
