import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  const s = (status || 'unknown').toLowerCase();

  const styles = {
    // Alerts & Cases
    new: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60',
    open: 'bg-sky-950/70 text-sky-300 border-sky-700/60',
    assigned: 'bg-purple-950/70 text-purple-300 border-purple-700/60',
    investigating: 'bg-amber-950/70 text-amber-300 border-amber-700/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
    pending_review: 'bg-orange-950/70 text-orange-300 border-orange-700/60',
    resolved: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
    closed: 'bg-slate-800/80 text-slate-400 border-slate-700',
    dismissed: 'bg-slate-900 text-slate-500 border-slate-800',
    false_positive: 'bg-slate-900 text-slate-400 border-slate-800',

    // Asset status
    clean: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
    suspicious: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
    compromised: 'bg-rose-950/80 text-rose-300 border-rose-700/80 shadow-[0_0_8px_rgba(244,63,94,0.35)]',

    // Threat reputation
    malicious: 'bg-rose-950/80 text-rose-300 border-rose-700/80',
    good: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
    unknown: 'bg-slate-800 text-slate-300 border-slate-700'
  };

  const badgeStyle = styles[s] || styles.unknown;
  const label = status ? status.replace(/_/g, ' ') : 'Unknown';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tracking-wide border capitalize ${badgeStyle} ${className}`}>
      {label}
    </span>
  );
}
