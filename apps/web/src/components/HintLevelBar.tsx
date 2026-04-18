import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HintLevelBarProps {
  level: number; // 0 to 5
}

export const HintLevelBar: React.FC<HintLevelBarProps> = ({ level }) => {
  const dots = [1, 2, 3, 4, 5];

  const getDotColor = (dotIndex: number) => {
    if (dotIndex > level) return 'bg-slate-700'; // Inactive

    if (level <= 2) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    if (level <= 4) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-800">
      <div className="flex gap-2">
        {dots.map((dot) => (
          <div
            key={dot}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              getDotColor(dot)
            )}
          />
        ))}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
        Hint {level} of 5
      </p>
    </div>
  );
};
