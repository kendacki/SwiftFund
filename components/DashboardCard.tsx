import { ReactNode } from 'react';

export interface DashboardCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  className?: string;
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  className = '',
}: DashboardCardProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 ${className}`}
    >
      <p className="font-heading text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
        {title}
      </p>
      <div className="font-heading text-xl font-bold text-white tracking-tight">{value}</div>
      {subtitle && (
        <p className="font-heading mt-1 text-xs text-neutral-400 tracking-tight">{subtitle}</p>
      )}
    </div>
  );
}
