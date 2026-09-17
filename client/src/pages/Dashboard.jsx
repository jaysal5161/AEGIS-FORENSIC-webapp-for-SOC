import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldAlert,
  Activity,
  AlertTriangle,
  FolderLock,
  Server,
  Users,
  Crosshair,
  ArrowRight,
  TrendingUp,
  Radio,
  FileText
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

import { dashboardApi, alertsApi } from '../services/api';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await dashboardApi.getSummary();
      return res.data;
    },
    refetchInterval: 15000
  });

  const totals = data?.totals || {};
  const alertsBySeverity = data?.alertsBySeverity || [];
  const eventsBySource = data?.eventsBySource || [];
  const eventsOverTime = data?.eventsOverTime || [];
  const topSourceIPs = data?.topSourceIPs || [];
  const topTargetedAccounts = data?.topTargetedAccounts || [];
  const topAffectedEndpoints = data?.topAffectedEndpoints || [];
  const recentAlerts = data?.recentAlerts || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-3 text-xs font-mono text-slate-400 animate-pulse">
          Synthesizing Security Intelligence Telemetry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Threat Posture Ticker */}
      <div className="p-4 bg-gradient-to-r from-rose-950/40 via-[#0f1422] to-[#0f1422] border border-rose-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-rose-400">
                ACTIVE THREAT INCIDENT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 font-bold">
                ELEVATED RISK
              </span>
            </div>
            <p className="text-sm font-mono text-slate-200 mt-0.5">
              Intrusion telemetry active across {totals.compromisedEndpoints || 0} compromised endpoints and {totals.compromisedAccounts || 0} compromised identities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold shadow-[0_0_12px_rgba(244,63,94,0.4)] transition-all"
          >
            Investigate Cases <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1: KPI StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Events"
          value={totals.events?.toLocaleString()}
          subtitle="Normalized telemetry records"
          icon={Activity}
          color="cyan"
          trend="+18% / 24h"
        />
        <StatCard
          title="Critical Alerts"
          value={totals.criticalAlerts}
          subtitle={`${totals.activeAlerts || 0} active in triage`}
          icon={AlertTriangle}
          color="rose"
          trend="+4 new"
        />
        <StatCard
          title="Active Cases"
          value={totals.openCases}
          subtitle="Forensic investigations ongoing"
          icon={FolderLock}
          color="amber"
          trend="2 high priority"
        />
        <StatCard
          title="Compromised Assets"
          value={`${totals.compromisedEndpoints || 0} / ${totals.endpoints || 0}`}
          subtitle={`${totals.compromisedAccounts || 0} compromised identities`}
          icon={Server}
          color="purple"
          trend="Quarantine ready"
        />
      </div>

      {/* Row 2: Charts (Events over time AreaChart + Alerts by Severity PieChart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Timeline Area Chart (2 cols) */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Telemetry Volume & Security Spikes (24h)"
            subtitle="Ingested events bucketized chronologically"
            icon={TrendingUp}
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={eventsOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="securityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1422', borderColor: '#1f293d', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}
                    labelStyle={{ color: '#06b6d4', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="events" name="Total Events" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#eventGradient)" />
                  <Area type="monotone" dataKey="security" name="Security Incidents" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#securityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Severity Distribution Pie Chart (1 col) */}
        <div>
          <ChartCard
            title="Alerts by Severity"
            subtitle="Triage classification breakdown"
            icon={Radio}
          >
            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={alertsBySeverity}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {alertsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1422', borderColor: '#1f293d', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800 text-xs font-mono">
              {alertsBySeverity.map((s) => (
                <div key={s.name} className="flex items-center justify-between px-2 py-1 rounded bg-[#0b0f19]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-slate-300">{s.name}</span>
                  </div>
                  <strong className="text-white">{s.value}</strong>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Row 3: Threat Analytics Intelligence (Top Source IPs, Targeted Accounts, Affected Endpoints) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Source IPs */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Top Adversary Source IPs
            </h4>
            <span className="text-[10px] font-mono text-cyan-400">Threat Feed</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {topSourceIPs.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No external source IPs recorded</p>
            ) : (
              topSourceIPs.map((ipObj) => (
                <div key={ipObj.ip} className="p-2 rounded-lg bg-[#0b0f19] border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-rose-300 block">{ipObj.ip}</span>
                    <span className="text-[10px] text-slate-500">{ipObj.failedCount} failed auth attempts</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-bold">
                    {ipObj.count} hits
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Targeted Accounts */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Targeted Account Identities
            </h4>
            <span className="text-[10px] font-mono text-amber-400">Identity Risk</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {topTargetedAccounts.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No accounts profiled</p>
            ) : (
              topTargetedAccounts.map((acc) => (
                <div key={acc.username} className="p-2 rounded-lg bg-[#0b0f19] border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-200">{acc.username}</span>
                      <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">{acc.privilege}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{acc.failedLogins || 0} failed logins</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-bold block ${acc.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      Risk: {acc.riskScore}/100
                    </span>
                    <span className="text-[10px] capitalize text-slate-500">{acc.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Affected Endpoints */}
        <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Host Asset Rankings
            </h4>
            <span className="text-[10px] font-mono text-purple-400">Endpoint Telemetry</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {topAffectedEndpoints.length === 0 ? (
              <p className="text-slate-500 py-4 text-center">No endpoint assets recorded</p>
            ) : (
              topAffectedEndpoints.map((ep) => (
                <div key={ep.hostname} className="p-2 rounded-lg bg-[#0b0f19] border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">{ep.hostname}</span>
                    <span className="text-[10px] text-slate-500">{ep.os || 'Windows Host'}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-bold block ${ep.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      Risk: {ep.riskScore}/100
                    </span>
                    <span className="text-[10px] capitalize text-slate-500">{ep.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Alerts Triage List */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase">
              Recent Alerts Feed & Triage Queue
            </h3>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View All Alerts ({totals.alerts || 0}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60 font-mono text-xs">
          {recentAlerts.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No alerts generated yet. Ingest log data to evaluate rules.</p>
          ) : (
            recentAlerts.map((alert) => (
              <div key={alert._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#141b2d] px-2 rounded-lg transition-colors">
                <div className="flex items-start sm:items-center gap-3">
                  <SeverityBadge severity={alert.severity} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{alert.title}</span>
                      <span className="text-[11px] text-slate-500">[{alert.alertId}]</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      {alert.host && <span>Host: <strong className="text-slate-300">{alert.host}</strong></span>}
                      {alert.sourceIP && <span>IP: <strong className="text-slate-300">{alert.sourceIP}</strong></span>}
                      {alert.mitreTechniqueId && <span className="text-purple-400">MITRE {alert.mitreTechniqueId}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <StatusBadge status={alert.status} />
                  <button
                    onClick={() => {
                      if (alert.caseId) navigate(`/cases/${alert.caseId._id || alert.caseId}`);
                      else navigate('/alerts');
                    }}
                    className="px-3 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-slate-300 text-xs transition-colors flex items-center gap-1"
                  >
                    Investigate <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
