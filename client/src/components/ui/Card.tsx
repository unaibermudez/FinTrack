import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export const Card = ({ title, children, className = '', ...props }: CardProps) => (
  <div
    {...props}
    className={`rounded-xl bg-[#1a1d27] border border-[#2a2d3a] p-5 ${className}`}
  >
    {title && <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">{title}</h3>}
    {children}
  </div>
);
