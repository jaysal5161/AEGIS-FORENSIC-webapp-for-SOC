import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, ShieldCheck, Key } from 'lucide-react';
import { accountsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';

export default function Accounts() {
  const [search, setSearch] = useState('');
  const [privilege, setPrivilege] = useState('');

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accountsList', { search, privilege }],
    queryFn: async () => {
      const res = await accountsApi.getAccounts({ search: search || undefined, privilege: privilege || undefined });
      return res.data;
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Identity & Access Profiling (IAM Telemetry)
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Accounts dynamically profiled from authentication events, tracking brute-force anomalies and privilege levels.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Tracking <strong className="text-cyan-400 font-bold">{accounts.length}</strong> user identities
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-[#0b0f19] border border-slate-800 rounded-xl flex items-center justify-between gap-3 font-mono text-xs">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search username, domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#070a10] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={privilege}
          onChange={(e) => setPrivilege(e.target.value)}
          className="bg-[#070a10] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
        >
          <option value="">All Privileges</option>
          <option value="standard">Standard User</option>
          <option value="admin">Local Admin</option>
          <option value="domain_admin">Domain Admin</option>
          <option value="service">Service Account</option>
        </select>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {accounts.map((acc) => {
            const isCompromised = acc.status === 'compromised';
            return (
              <div
                key={acc._id}
                className={`p-5 rounded-xl border bg-[#0f1422] transition-all ${
                  isCompromised
                    ? 'border-rose-700/60 shadow-[0_0_12px_rgba(244,63,94,0.15)] ring-1 ring-rose-600/30'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-100">{acc.username}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 uppercase font-bold">
                        {acc.privilege}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{acc.domain}</span>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={acc.status} />
                    <span className={`block font-bold text-xs mt-1 ${acc.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      Risk: {acc.riskScore}/100
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800/80 space-y-1 my-3 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Authentication History:</span>
                    <strong className="text-slate-200">
                      <span className="text-emerald-400">{acc.successLogins || 0} Successful</span> / <span className="text-rose-400">{acc.failedLogins || 0} Failed</span>
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Observed Endpoints:</span>
                    <strong className="text-slate-300 truncate max-w-[200px]">{acc.endpoints?.join(', ') || 'WS01-FIN'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Source IPs:</span>
                    <strong className="text-slate-300 truncate max-w-[200px]">{acc.sourceIPs?.join(', ') || 'Internal'}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                  <span>Last Logon: {acc.lastLogin ? new Date(acc.lastLogin).toUTCString() : 'Never'}</span>
                  <span>Alerts: {acc.associatedAlerts?.length || 0} linked</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
