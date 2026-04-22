import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium ft-text-2 uppercase tracking-[0.07em]">
            {label}
            {hint && <span className="normal-case tracking-normal font-normal ft-text-3 ml-1">({hint})</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={[
            'w-full rounded-lg ft-input-bg border text-sm ft-text',
            'px-3 py-2.5 h-10',
            'placeholder:ft-text-3',
            'transition-all duration-150',
            error
              ? 'border-[var(--negative)]/60 focus:border-[var(--negative)] focus:ring-2 focus:ring-[var(--negative)]/20'
              : 'ft-border focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20',
            'focus:outline-none',
            className,
          ].join(' ')}
        />
        {error && <p className="text-xs ft-negative flex items-center gap-1"><span>⚠</span>{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
