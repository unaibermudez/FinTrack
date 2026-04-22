import { type ReactNode } from 'react';

interface CardProps {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
  action?: ReactNode;
  noPadding?: boolean;
}

export const Card = ({ title, description, className = '', children, action, noPadding }: CardProps) => (
  <div
    className={[
      'ft-card border ft-border rounded-xl ft-shadow-sm',
      'transition-colors duration-200',
      noPadding ? '' : 'p-5',
      className,
    ].join(' ')}
  >
    {(title || action) && (
      <div className={`flex items-start justify-between gap-4 ${noPadding ? 'px-5 pt-5 pb-4' : 'mb-4'}`}>
        <div>
          {title && (
            <h3 className="text-xs font-semibold ft-text-2 uppercase tracking-[0.08em]">
              {title}
            </h3>
          )}
          {description && <p className="text-xs ft-text-3 mt-0.5">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    )}
    {children}
  </div>
);
