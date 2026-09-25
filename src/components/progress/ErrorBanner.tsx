interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-stamp-600/25 bg-stamp-50 p-5">
      <div>
        <p className="font-display text-xs font-semibold uppercase tracking-[0.14em] text-stamp-700">
          Report generation failed
        </p>
        <p className="mt-1.5 font-body text-sm text-stamp-700">{message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-lg px-3 py-1.5 font-body text-sm font-medium text-stamp-700 transition-colors hover:bg-stamp-600/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp-600"
      >
        Dismiss
      </button>
    </div>
  );
}
