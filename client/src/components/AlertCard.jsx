import React from 'react';
import { format } from 'date-fns';
import { ShieldAlert, FolderPlus, ArrowRight, User, Server, Globe } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';

export default function AlertCard({ alert, onCreateCase, onInvestigate, onAssign }) {
  const isCritical = alert.severity === 'critical';
  const hasCase = !!alert.caseId;

  return (
    <div className={`p-5 rounded-xl border bg-[#0f1422] transition-all duration-200 hover:bg-[#141b2d] ${
      isCritical
        ? 'border-rose-700/60 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Top row */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <StatusBadge status={alert.status} />
          <span className="font-mono text-xs text-slate-500 font-semibold">
            {alert.alertId}
          </span>
        </div>

        <span className="text-xs font-mono text-slate-500">
          {alert.createdAt ? format(new Date(alert.createdAt), 'yyyy-MM-dd HH:mm') : ''}
        </span>
      </div>

      {/* Alert Title & Description */}
      <h4 className="text-base font-bold font-mono tracking-tight text-slate-100 mb-1.5 flex items-center gap-2">
        <ShieldAlert className={`w-4 h-4 flex-shrink-0 ${isCritical ? 'text-rose-400' : 'text-amber-400'}`} />
        <span className="truncate">{alert.title}</span>
      </h4>

      <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
        {alert.description}
      </p>

      {/* Metadata Pill Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
        {alert.host && (
          <span className="flex items-center gap-1">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <strong className="text-slate-200">{alert.host}</strong>
          </span>
        )}
        {alert.username && alert.username !== 'SYSTEM' && (
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <strong className="text-slate-200">{alert.username}</strong>
          </span>
        )}
        {alert.sourceIP && (
          <span className="flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-slate-200">{alert.sourceIP}</strong>
          </span>
        )}
        {alert.mitreTechniqueId && (
          <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-bold">
            MITRE {alert.mitreTechniqueId}
          </span>
        )}
        {alert.count > 1 && (
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
            {alert.count} hits
          </span>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-mono text-slate-500">
          {alert.assignedTo ? (
            <span>Analyst: <strong className="text-slate-300">{alert.assignedTo.fullName || alert.assignedTo.username}</strong></span>
          ) : (
            <span className="text-amber-500/80 font-medium">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasCase ? (
            <button
              onClick={() => onInvestigate && onInvestigate(alert)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-all"
            >
              Open Case <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onCreateCase && onCreateCase(alert)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-xs font-bold hover:brightness-110 shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
            >
              <FolderPlus className="w-3.5 h-3.5" /> Create Case
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
