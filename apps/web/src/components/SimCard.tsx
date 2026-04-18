import React from 'react';

interface SimCardProps {
  template: string;
  params: Record<string, string | number>;
}

export const SimCard: React.FC<SimCardProps> = ({ template, params }) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value.toString());
  });

  const simUrl = `/sims/${template}.html?${queryParams.toString()}`;

  // Human-readable labels for simulations
  const templateLabels: Record<string, string> = {
    projectile_motion: 'Projectile Motion',
    pendulum: 'Pendulum Oscillation',
    wave_superposition: 'Wave Superposition',
    ohms_law: "Ohm's Law",
    cell_division: 'Cell Division',
    lens_refraction: 'Lens Refraction',
  };

  const label = templateLabels[template] || 'Simulation';

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 shadow-xl bg-white dark:bg-slate-900 group transition-all hover:shadow-2xl">
      <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Interactive Sim — {label}
          </span>
        </div>
        <button 
          onClick={() => window.open(simUrl, '_blank')}
          className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
        >
          Expand ↗
        </button>
      </div>
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950">
        <iframe
          src={simUrl}
          className="w-full h-full border-0 absolute inset-0"
          title={label}
          loading="lazy"
        />
      </div>
    </div>
  );
};
