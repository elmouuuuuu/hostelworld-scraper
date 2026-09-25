const BAR_WIDTH_PATTERN = [
  2, 1, 3, 1, 2, 2, 1, 3, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 2, 1, 1, 2, 3,
  1, 2, 1, 2, 3, 1, 2, 1, 3, 2, 1,
];

interface BarcodeProgressProps {
  percent: number;
}

/**
 * Signature visual: a barcode that "scans" filled as the report
 * generates, tying the ticket/boarding-pass concept to a functional
 * progress indicator.
 */
export function BarcodeProgress({ percent }: BarcodeProgressProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="flex h-10 items-end gap-[3px]"
    >
      {BAR_WIDTH_PATTERN.map((widthUnit, index) => {
        const barThreshold = (index / BAR_WIDTH_PATTERN.length) * 100;
        const isFilled = barThreshold <= clamped;
        return (
          <span
            key={index}
            aria-hidden="true"
            className={`inline-block rounded-[1px] transition-colors duration-300 ${
              isFilled ? 'bg-ink-900' : 'bg-ink-100'
            }`}
            style={{ width: `${widthUnit * 2.5}px`, height: isFilled ? '100%' : '55%' }}
          />
        );
      })}
    </div>
  );
}
