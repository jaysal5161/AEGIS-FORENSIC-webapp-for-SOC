import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function EmptyState({
  title = 'No records found',
  description = 'There are currently no items matching this criteria.',
  icon: Icon = ShieldCheck,
  action
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-[#0f1422]/50">
      <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-bold text-slate-200 font-mono tracking-tight">
        {title}
      </h4>
      <p className="mt-1 text-sm text-slate-400 max-w-sm">
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
