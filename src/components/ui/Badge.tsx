import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

export function Badge({ children, onRemove, removeLabel = 'Remove' }: BadgeProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-teal-600/20 bg-teal-50 py-1.5 pl-3.5 pr-2 font-body text-sm font-medium text-teal-800">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="flex h-5 w-5 items-center justify-center rounded-full text-teal-700 transition-colors hover:bg-teal-600/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </span>
  );
}
