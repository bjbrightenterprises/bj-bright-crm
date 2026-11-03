import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'gold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-bold';

  const variantClasses = {
    primary: 'bg-[#0B1F4B]/10 text-[#0B1F4B] border border-[#0B1F4B]/25',
    gold: 'bg-amber-100 text-amber-950 border border-amber-300',
    success: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    warning: 'bg-orange-100 text-orange-900 border border-orange-300',
    danger: 'bg-rose-100 text-rose-900 border border-rose-300',
    info: 'bg-sky-100 text-sky-900 border border-sky-300',
    neutral: 'bg-slate-100 text-slate-800 border border-slate-300',
  }[variant];

  return (
    <span className={`inline-flex items-center gap-1 rounded-md tracking-wide ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};
