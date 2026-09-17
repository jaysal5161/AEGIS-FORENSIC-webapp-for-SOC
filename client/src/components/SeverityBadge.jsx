import React from 'react';

export default function SeverityBadge({ severity, className = '' }) {
  const sev = (severity || 'low').toLowerCase();

  const styles = {
    critical: 'bg-rose-950/70 text-rose-300 border-rose-700/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    high: 'bg-amber-950/70 text-amber-300 border-amber-700/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
    medium: 'bg-sky-950/70 text-sky-300 border-sky-700/60',
    low: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60'
  };

  const badgeStyle = styles[sev] || styles.low;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider border ${badgeStyle} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />
      {severity}
    </span>
  );
}
