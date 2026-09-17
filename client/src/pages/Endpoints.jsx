import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Server, Search, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';
import { endpointsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';

export default function Endpoints() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data: endpoints = [], isLoading } = useQuery({
    queryKey: ['endpointsList', { search, status }],
    queryFn: async () => {
      const res = await endpointsApi.getEndpoints({ search: search || undefined, status: status || undefined });
      return res.data;
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Endpoint Asset Inventory & Risk Profiling
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Enterprise hosts automatically profiled from event logs with dynamic vulnerability & compromise scoring.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Tracking <strong className="text-cyan-400 font-bold">{endpoints.length}</strong> managed assets
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-[#0b0f19] border border-slate-800 rounded-xl flex items-center justify-between gap-3 font-mono text-xs">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search host, OS, IP address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#070a10] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[#070a10] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="clean">Clean</option>
          <option value="suspicious">Suspicious</option>
          <option value="compromised">Compromised</option>
        </select>
      </div>

      {/* Endpoints Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {endpoints.map((ep) => {
            const isCompromised = ep.status === 'compromised';
            return (
              <div
                key={ep._id}
                className={`p-5 rounded-xl border bg-[#0f1422] transition-all ${
                  isCompromised
                    ? 'border-rose-700/60 shadow-[0_0_12px_rgba(244,63,94,0.15)] ring-1 ring-rose-600/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-base font-bold text-slate-100 block">{ep.hostname}</span>
                    <span className="text-xs text-slate-400">{ep.os}</span>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={ep.status} />
                    <span className={`block font-bold text-xs mt-1 ${ep.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      Risk: {ep.riskScore}/100
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800/80 space-y-1 my-3 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Observed IPs:</span>
                    <strong className="text-cyan-400">{ep.ipAddresses?.join(', ') || 'N/A'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Logged-in Users:</span>
                    <strong className="text-slate-200">{ep.users?.join(', ') || 'None'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Domain Joined:</span>
                    <strong className="text-slate-300">{ep.domainJoined ? 'Yes (CORP.LOCAL)' : 'Workgroup'}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                  <span>Open Ports: {ep.openPorts?.join(', ') || '3389, 445'}</span>
                  <span>Alerts: {ep.associatedAlerts?.length || 0} linked</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
