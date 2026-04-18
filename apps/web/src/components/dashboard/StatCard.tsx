import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: number;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, delta }) => {
  const isPositive = delta !== undefined && delta >= 0;
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
        </div>
        {delta !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium",
            isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          )}>
            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
    </div>
  );
};
