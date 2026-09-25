import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 focus-visible:outline-teal-600 disabled:bg-ink-200 disabled:text-ink-500',
  secondary:
    'bg-white text-ink-900 border border-ink-200 hover:bg-paper-50 focus-visible:outline-ink-500',
  ghost: 'bg-transparent text-ink-700 hover:bg-paper-100 focus-visible:outline-ink-500',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className = '', disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3',
        'font-body text-sm font-semibold tracking-wide transition-colors',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
      {...props}
    />
  );
});
