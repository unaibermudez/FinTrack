import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
  icon?: ReactNode;
}

export const StatCard = ({ label, value, sub, positive, icon }: StatCardProps) => (
  <div className="ft-card border ft-border rounded-xl p-5 flex items-start gap-4 ft-shadow-sm transition-colors duration-200">
    {icon && (
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          background: positive === undefined
            ? 'var(--primary-bg)'
            : positive ? 'var(--positive-bg)' : 'var(--negative-bg)',
        }}
      >
        <span style={{
          color: positive === undefined
            ? 'var(--primary)'
            : positive ? 'var(--positive)' : 'var(--negative)',
        }}>
          {icon}
        </span>
      </div>
    )}
    <div className="min-w-0">
      <p className="text-xs ft-text-2 uppercase tracking-[0.07em] font-medium mb-1">{label}</p>
      <p
        className="text-xl font-bold font-mono-num leading-none"
        style={{
          color: positive === undefined
            ? 'var(--text)'
            : positive ? 'var(--positive)' : 'var(--negative)',
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="text-xs font-mono-num mt-0.5"
          style={{
            color: positive === undefined
              ? 'var(--text-2)'
              : positive ? 'var(--positive)' : 'var(--negative)',
            opacity: 0.8,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  </div>
);
