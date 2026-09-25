import { Button } from '@/components/ui/Button';

interface GenerateReportButtonProps {
  onClick: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

export function GenerateReportButton({ onClick, disabled, isGenerating }: GenerateReportButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled || isGenerating} className="w-full sm:w-auto">
      {isGenerating ? (
        <>
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
          Generating...
        </>
      ) : (
        <>Generate Excel Report</>
      )}
    </Button>
  );
}
